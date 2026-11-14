<?php
/**
 * Isolated Customer-to-Admin Direct Chat Service (`chat-service.php`).
 * Supports customer/Admin threads, read receipts, and typing with a six-second TTL.
 * Uses locked private JSON storage; website Admin sessions never authorize staff CRM.
 */
require_once __DIR__ . '/api/bootstrap.php';
init_secure_session();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('Vary: Origin');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('#^https://([a-z0-9-]+\.)*attaieproperties\.(com|af)$#i', $origin) || preg_match('#^http://(localhost|127\.0\.0\.1)(:\d+)?$#D', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, X-Chat-Token');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

final class WebsiteChatException extends RuntimeException {}
function chat_json_out(array $payload, int $status = 200): void { json_out($payload, $status); }
function chat_require_admin(): void { require_admin(); }
function chat_text(array $body, string $key, int $limit, string $default = ''): string {
    $value = $body[$key] ?? $default;
    if (!is_string($value) || mb_strlen($value, 'UTF-8') > $limit) throw new WebsiteChatException('Invalid chat fields', 422);
    return trim($value);
}
function chat_require_customer(array $conv): void {
    $token = $_SERVER['HTTP_X_CHAT_TOKEN'] ?? '';
    if (!is_string($token) || !preg_match('/^[a-f0-9]{64}$/D', $token) || empty($conv['owner_token_hash']) || !hash_equals($conv['owner_token_hash'], hash('sha256', $token))) {
        throw new WebsiteChatException('Conversation access denied', 403);
    }
}
/** Enrich active typing flags and normalized read receipts without exposing capabilities. */
function chat_enrich_conversation(array $conv): array {
    unset($conv['owner_token_hash']);
    foreach (['customer','admin'] as $actor) {
        $at = strtotime($conv['typing_' . $actor . '_at'] ?? '') ?: 0;
        $conv['is_' . $actor . '_typing'] = $at > 0 && time() - $at <= 6;
    }
    foreach ($conv['messages'] as &$message) {
        unset($message['payload_hash']);
        $message['delivery_status'] = 'confirmed';
        $message['read_status'] = $message['read_status'] ?? 'sent';
        $message['read_at'] = $message['read_at'] ?? null;
    }
    unset($message);
    return $conv;
}

/** Lock a separate file so an atomic replacement never changes the lock inode. Fail closed. */
function chat_with_store(callable $mutator, bool $write = false) {
    $configured = ctc_env('WEBSITE_CHAT_STORE_DIR', '');
    if ($configured === '') throw new WebsiteChatException('Chat storage unavailable', 503);
    $dir = realpath($configured);
    $webroots = [realpath(__DIR__), realpath($_SERVER['DOCUMENT_ROOT'] ?? __DIR__)];
    if (!$dir || !is_dir($dir)) throw new WebsiteChatException('Chat storage unavailable', 503);
    foreach ($webroots as $webroot) {
        if ($webroot && (strcasecmp($dir, $webroot) === 0 || str_starts_with(strtolower(str_replace('\\','/',$dir)) . '/', strtolower(str_replace('\\','/',$webroot)) . '/'))) {
            throw new WebsiteChatException('Chat storage unavailable', 503);
        }
    }
    $file = $dir . '/conversations.json';
    $lock = @fopen($dir . '/conversations.lock', 'c');
    if (!$lock || !flock($lock, $write ? LOCK_EX : LOCK_SH)) throw new WebsiteChatException('Chat storage unavailable', 503);
    $temporary = null;
    try {
        $raw = is_file($file) ? file_get_contents($file) : '[]';
        $data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($data) || !array_is_list($data)) throw new RuntimeException('Invalid store');
        $result = $mutator($data);
        if ($write) {
            $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
            $temporary = tempnam($dir, 'chat-');
            if (!$temporary || file_put_contents($temporary, $json) !== strlen($json)) throw new RuntimeException('Unable to persist chat');
            @chmod($temporary, 0600);
            if (!rename($temporary, $file)) throw new RuntimeException('Unable to persist chat');
            $temporary = null;
        }
        return $result;
    } finally {
        if ($temporary && is_file($temporary)) @unlink($temporary);
        flock($lock, LOCK_UN); fclose($lock);
    }
}

try {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $body = $method === 'POST' ? body() : [];
    $action = chat_text($_GET + $body, 'action', 40);
    $sessionId = chat_text($method === 'GET' ? $_GET : $body, 'session_id', 100);
    $actor = $body['actor'] ?? $body['sender'] ?? 'customer';
    $reader = $body['reader'] ?? ($action === 'admin_mark_read' ? 'admin' : 'customer');
    $admin = str_starts_with($action, 'admin_') || ($action === 'typing' && $actor === 'admin') || ($action === 'mark_read' && $reader === 'admin');
    if ($admin) chat_require_admin();
    session_write_close();
    $getActions = ['thread','admin_list'];
    $postActions = ['customer_message','admin_reply','typing','mark_read','customer_mark_read','admin_mark_read','admin_status','admin_delete'];
    if (($method === 'GET' && !in_array($action,$getActions,true)) || ($method === 'POST' && !in_array($action,$postActions,true)) || !in_array($method,['GET','POST'],true)) {
        throw new WebsiteChatException('Invalid action or method', 405);
    }
    if ($action !== 'admin_list' && !preg_match('/^[a-zA-Z0-9_-]{1,100}$/D', $sessionId)) throw new WebsiteChatException('Invalid conversation', 422);
    $write = $method === 'POST' || !empty($_GET['mark_read']);
    $result = chat_with_store(function (array &$conversations) use ($action,$sessionId,$body,$actor,$reader,$admin) {
        if ($action === 'admin_list') {
            $list = array_map('chat_enrich_conversation', $conversations);
            usort($list, fn($a,$b)=>strcmp($b['updated_at'],$a['updated_at']));
            return ['conversations'=>$list];
        }
        $index = null;
        foreach ($conversations as $key=>$item) { if (($item['id'] ?? '') === $sessionId) { $index=$key; break; } }
        $token = $_SERVER['HTTP_X_CHAT_TOKEN'] ?? '';
        if ($index === null) {
            if ($action !== 'customer_message') {
                if (!$admin && !preg_match('/^[a-f0-9]{64}$/D', $token)) throw new WebsiteChatException('Conversation access denied',403);
                return ['conversation'=>null];
            }
            if (!preg_match('/^[a-f0-9]{64}$/D', $token)) throw new WebsiteChatException('Conversation access denied',403);
            $now=gmdate('Y-m-d\TH:i:s\Z');
            $conversations[] = ['id'=>$sessionId,'owner_token_hash'=>hash('sha256',$token),'customer_name'=>'Visitor #' . strtoupper(substr($sessionId,-4)),'customer_phone'=>'','customer_email'=>'','page_context'=>'','status'=>'open','unread_admin'=>0,'unread_customer'=>0,'typing_customer_at'=>null,'typing_admin_at'=>null,'typing_admin_name'=>null,'created_at'=>$now,'updated_at'=>$now,'messages'=>[]];
            $index=array_key_last($conversations);
        }
        $conv=&$conversations[$index];
        if (!$admin) chat_require_customer($conv);
        $now=gmdate('Y-m-d\TH:i:s\Z');
        if ($action === 'customer_message' || $action === 'admin_reply') {
            $text=chat_text($body,'message',2000);
            $clientId=chat_text($body,'client_message_id',36);
            if ($text === '' || !preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/iD',$clientId)) throw new WebsiteChatException('Message and request UUID required',422);
            $sender=$admin?'admin':'customer';
            $hash=hash('sha256',$sender . "\n" . $text);
            foreach ($conv['messages'] as $message) {
                if (($message['client_message_id'] ?? '') === $clientId) {
                    if (!hash_equals($message['payload_hash'] ?? '',$hash)) throw new WebsiteChatException('Message identifier conflict',409);
                    return ['conversation'=>chat_enrich_conversation($conv)];
                }
            }
            if (!$admin) {
                foreach (['customer_name'=>120,'customer_phone'=>50,'customer_email'=>160,'page_context'=>250] as $field=>$limit) {
                    $value=chat_text($body,$field,$limit);
                    if ($value !== '') $conv[$field]=$value;
                }
            }
            $name=$admin?chat_text($body,'admin_name',80,(string)($_SESSION['admin_user'] ?? 'Attaie Admin')):$conv['customer_name'];
            $conv['messages'][]=['id'=>'msg_' . bin2hex(random_bytes(16)),'client_message_id'=>$clientId,'payload_hash'=>$hash,'sender'=>$sender,'sender_name'=>$name,'text'=>$text,'read_status'=>'sent','read_at'=>null,'created_at'=>$now];
            $conv['unread_' . ($admin?'customer':'admin')]++;
            $conv['typing_' . $sender . '_at']=null;
            $conv['status']='open';$conv['updated_at']=$now;
            if ($admin) { $conv['unread_admin']=0; foreach ($conv['messages'] as &$message) { if ($message['sender']==='customer') { $message['read_status']='read';$message['read_at']=$message['read_at'] ?? $now; } } unset($message); }
        } elseif ($action === 'typing') {
            $conv['typing_' . ($admin?'admin':'customer') . '_at']=!empty($body['is_typing'])?$now:null;
            if ($admin) $conv['typing_admin_name']=chat_text($body,'actor_name',80,chat_text($body,'sender_name',80,'Attaie Admin'));
        } elseif (in_array($action,['mark_read','customer_mark_read','admin_mark_read'],true) || ($action==='thread' && !empty($_GET['mark_read']))) {
            $who=$admin?'admin':'customer';$target=$admin?'customer':'admin';
            $conv['unread_' . $who]=0;
            foreach ($conv['messages'] as &$message) { if ($message['sender']===$target) { $message['read_status']='read';$message['read_at']=$message['read_at'] ?? $now; } } unset($message);
        } elseif ($action==='admin_status') {
            $status=chat_text($body,'status',10);
            if (!in_array($status,['open','resolved'],true)) throw new WebsiteChatException('Invalid status',422);
            $conv['status']=$status;$conv['updated_at']=$now;
        } elseif ($action==='admin_delete') {
            array_splice($conversations,$index,1);return ['success'=>true];
        }
        if ($action !== 'thread' || !empty($_GET['mark_read'])) $conv['version']=(int)($conv['version'] ?? 0)+1;
        return ['conversation'=>chat_enrich_conversation($conv)];
    }, $write);
    chat_json_out($result);
} catch (WebsiteChatException $error) { chat_json_out(['error'=>$error->getMessage()],$error->getCode()); }
catch (Throwable $error) { chat_json_out(['error'=>'Chat storage unavailable. Please retry.'],503); }
