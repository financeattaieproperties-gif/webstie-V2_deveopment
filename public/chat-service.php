<?php
/**
 * Isolated Customer-to-Admin Direct Chat Service (`chat-service.php`)
 *
 * Supports:
 * - Customer & Admin message threads (`thread`, `customer_message`, `admin_list`, `admin_reply`)
 * - Message Read Receipts (`read_status`: `'sent' | 'read'`, `read_at`, via `mark_read`, `customer_mark_read`, `admin_mark_read`)
 * - Real-Time Typing Indicators (`typing` action for both `'customer'` and `'admin'`, with 6-second TTL)
 *
 * Complies with AGENTS.md V1 Protection Rules:
 * - Separate from `public/api/` (does not modify any existing PHP endpoint).
 * - Uses isolated file storage (`uploads/chat_store/conversations.json`) with `flock()`
 *   so the existing production MySQL database is never modified or queried.
 */

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    @session_start();
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (
    $origin !== '' &&
    (preg_match('#^https?://([a-z0-9-]+\.)*attaieproperties\.(com|af)$#i', $origin)
        || preg_match('#^https://[a-z0-9-]+\.run\.app$#i', $origin)
        || preg_match('#^http://(localhost|127\.0\.0\.1)(:\d+)?$#i', $origin))
) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function chat_json_out(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function chat_require_admin(): void {
    if (empty($_SESSION['admin'])) {
        chat_json_out(['error' => 'Unauthorized'], 401);
    }
}

/**
 * Enriches a conversation record with computed active typing flags (true if signal < 6s old)
 * and ensures every message has a normalized `read_status` ('sent' | 'read').
 */
function chat_enrich_conversation(array $conv): array {
    $nowTs = time();
    $custTypingAt = isset($conv['typing_customer_at']) && is_string($conv['typing_customer_at'])
        ? strtotime($conv['typing_customer_at'])
        : false;
    $admTypingAt = isset($conv['typing_admin_at']) && is_string($conv['typing_admin_at'])
        ? strtotime($conv['typing_admin_at'])
        : false;

    $conv['is_customer_typing'] = ($custTypingAt !== false && ($nowTs - $custTypingAt) <= 6);
    $conv['is_admin_typing']    = ($admTypingAt !== false && ($nowTs - $admTypingAt) <= 6);

    if (isset($conv['messages']) && is_array($conv['messages'])) {
        foreach ($conv['messages'] as &$m) {
            if (empty($m['read_status'])) {
                $m['read_status'] = 'sent';
            }
            if (!array_key_exists('read_at', $m)) {
                $m['read_at'] = null;
            }
        }
        unset($m);
    }
    return $conv;
}

$storeDir = __DIR__ . '/uploads/chat_store';
if (!is_dir($storeDir)) {
    @mkdir($storeDir, 0755, true);
}
$htaccessPath = $storeDir . '/.htaccess';
if (!is_file($htaccessPath)) {
    @file_put_contents($htaccessPath, "Require all denied\n");
}
$storeFile = $storeDir . '/conversations.json';

function chat_with_store(callable $mutator, bool $write = false) {
    global $storeFile;
    $fp = @fopen($storeFile, 'c+');
    if (!$fp) {
        return $mutator([]);
    }
    @flock($fp, $write ? LOCK_EX : LOCK_SH);
    $raw = stream_get_contents($fp);
    $data = is_string($raw) && $raw !== '' ? json_decode($raw, true) : [];
    if (!is_array($data)) {
        $data = [];
    }
    $result = $mutator($data);
    if ($write) {
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        fflush($fp);
    }
    @flock($fp, LOCK_UN);
    fclose($fp);
    return $result;
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$action = trim((string) ($_GET['action'] ?? ''));
$rawInput = file_get_contents('php://input');
$body = is_string($rawInput) && $rawInput !== '' ? (json_decode($rawInput, true) ?? []) : [];
if (!is_array($body)) {
    $body = [];
}
if ($action === '' && !empty($body['action'])) {
    $action = trim((string) $body['action']);
}

// 1. Customer fetches their own conversation by session_id
if ($method === 'GET' && $action === 'thread') {
    $sessionId = trim((string) ($_GET['session_id'] ?? ''));
    $markRead  = !empty($_GET['mark_read']);
    if ($sessionId === '') {
        chat_json_out(['conversation' => null]);
    }
    $now = gmdate('Y-m-d\TH:i:s\Z');
    $found = chat_with_store(function (array &$conversations) use ($sessionId, $markRead, $now) {
        foreach ($conversations as &$conv) {
            if (($conv['id'] ?? '') === $sessionId) {
                if ($markRead) {
                    $conv['unread_customer'] = 0;
                    if (isset($conv['messages']) && is_array($conv['messages'])) {
                        foreach ($conv['messages'] as &$m) {
                            if (($m['sender'] ?? '') === 'admin' && ($m['read_status'] ?? 'sent') !== 'read') {
                                $m['read_status'] = 'read';
                                $m['read_at']     = $now;
                            }
                        }
                        unset($m);
                    }
                }
                return chat_enrich_conversation($conv);
            }
        }
        return null;
    }, $markRead);

    chat_json_out(['conversation' => $found]);
}

// 2. Customer sends a message (creates or appends to their conversation with read_status: 'sent')
if ($method === 'POST' && $action === 'customer_message') {
    $sessionId   = preg_replace('/[^a-zA-Z0-9_-]/', '', (string) ($body['session_id'] ?? ''));
    $name        = mb_substr(trim((string) ($body['customer_name'] ?? '')), 0, 120);
    $phone       = mb_substr(trim((string) ($body['customer_phone'] ?? '')), 0, 50);
    $email       = mb_substr(trim((string) ($body['customer_email'] ?? '')), 0, 160);
    $pageContext = mb_substr(trim((string) ($body['page_context'] ?? '')), 0, 250);
    $text        = mb_substr(trim((string) ($body['message'] ?? '')), 0, 2000);

    if ($text === '') {
        chat_json_out(['error' => 'Message cannot be empty'], 400);
    }
    if ($sessionId === '') {
        $sessionId = 'chat_' . bin2hex(random_bytes(8));
    }

    $now = gmdate('Y-m-d\TH:i:s\Z');
    $msgId = 'msg_' . bin2hex(random_bytes(6));

    $updatedConv = chat_with_store(function (array &$conversations) use ($sessionId, $name, $phone, $email, $pageContext, $text, $now, $msgId) {
        $targetIndex = null;
        foreach ($conversations as $idx => $conv) {
            if (($conv['id'] ?? '') === $sessionId) {
                $targetIndex = $idx;
                break;
            }
        }

        if ($name === '') {
            $name = 'Visitor #' . strtoupper(substr($sessionId, -4));
        }

        $newMessage = [
            'id'          => $msgId,
            'sender'      => 'customer',
            'sender_name' => $name,
            'text'        => $text,
            'read_status' => 'sent',
            'read_at'     => null,
            'created_at'  => $now,
        ];

        if ($targetIndex === null) {
            $newConv = [
                'id'                 => $sessionId,
                'customer_name'      => $name,
                'customer_phone'     => $phone,
                'customer_email'     => $email,
                'page_context'       => $pageContext,
                'status'             => 'open',
                'unread_admin'       => 1,
                'unread_customer'    => 0,
                'typing_customer_at' => null,
                'typing_admin_at'    => null,
                'typing_admin_name'  => null,
                'created_at'         => $now,
                'updated_at'         => $now,
                'messages'           => [$newMessage],
            ];
            array_unshift($conversations, $newConv);
            return chat_enrich_conversation($newConv);
        }

        $conv = &$conversations[$targetIndex];
        if ($name !== '') $conv['customer_name'] = $name;
        if ($phone !== '') $conv['customer_phone'] = $phone;
        if ($email !== '') $conv['customer_email'] = $email;
        if ($pageContext !== '') $conv['page_context'] = $pageContext;
        $conv['status'] = 'open';
        $conv['unread_admin'] = (int) ($conv['unread_admin'] ?? 0) + 1;
        $conv['typing_customer_at'] = null;
        $conv['updated_at'] = $now;
        if (!isset($conv['messages']) || !is_array($conv['messages'])) {
            $conv['messages'] = [];
        }
        $conv['messages'][] = $newMessage;

        $item = chat_enrich_conversation($conv);
        array_splice($conversations, $targetIndex, 1);
        array_unshift($conversations, $item);
        return $item;
    }, true);

    if (isset($updatedConv['error'])) {
        chat_json_out(['error' => $updatedConv['error']], 400);
    }

    chat_json_out(['conversation' => $updatedConv]);
}

// 3. Real-Time Typing Indicator Endpoint (supports both customer and admin)
if ($method === 'POST' && $action === 'typing') {
    $sessionId = preg_replace('/[^a-zA-Z0-9_-]/', '', (string) ($body['session_id'] ?? ''));
    $actor     = in_array($body['actor'] ?? '', ['customer', 'admin'], true) ? $body['actor'] : 'customer';
    $isTyping  = !empty($body['is_typing']);
    $actorName = mb_substr(trim((string) ($body['actor_name'] ?? '')), 0, 80);

    if ($actor === 'admin') {
        chat_require_admin();
    }
    if ($sessionId === '') {
        chat_json_out(['ok' => false, 'error' => 'session_id required'], 400);
    }

    $now = gmdate('Y-m-d\TH:i:s\Z');
    $updated = chat_with_store(function (array &$conversations) use ($sessionId, $actor, $isTyping, $actorName, $now) {
        foreach ($conversations as &$conv) {
            if (($conv['id'] ?? '') === $sessionId) {
                if ($actor === 'customer') {
                    $conv['typing_customer_at'] = $isTyping ? $now : null;
                } else {
                    $conv['typing_admin_at']   = $isTyping ? $now : null;
                    $conv['typing_admin_name'] = $isTyping ? ($actorName ?: 'Attaie Advisor') : null;
                }
                return chat_enrich_conversation($conv);
            }
        }
        return null;
    }, true);

    chat_json_out(['ok' => true, 'conversation' => $updated]);
}

// 4. Unified Read-Receipt Update Endpoint (`mark_read`, `customer_mark_read`, `admin_mark_read`)
if ($method === 'POST' && in_array($action, ['mark_read', 'customer_mark_read', 'admin_mark_read'], true)) {
    $sessionId = trim((string) ($body['session_id'] ?? ''));
    $reader    = (string) ($body['reader'] ?? '');
    if ($action === 'admin_mark_read' || $reader === 'admin') {
        chat_require_admin();
        $reader = 'admin';
    } else {
        $reader = 'customer';
    }

    if ($sessionId === '') {
        chat_json_out(['error' => 'session_id is required'], 400);
    }

    $now = gmdate('Y-m-d\TH:i:s\Z');
    $updated = chat_with_store(function (array &$conversations) use ($sessionId, $reader, $now) {
        foreach ($conversations as &$conv) {
            if (($conv['id'] ?? '') === $sessionId) {
                $targetSender = ($reader === 'admin') ? 'customer' : 'admin';
                if ($reader === 'admin') {
                    $conv['unread_admin'] = 0;
                } else {
                    $conv['unread_customer'] = 0;
                }
                if (isset($conv['messages']) && is_array($conv['messages'])) {
                    foreach ($conv['messages'] as &$m) {
                        if (($m['sender'] ?? '') === $targetSender && ($m['read_status'] ?? 'sent') !== 'read') {
                            $m['read_status'] = 'read';
                            $m['read_at']     = $now;
                        }
                    }
                    unset($m);
                }
                return chat_enrich_conversation($conv);
            }
        }
        return null;
    }, true);

    chat_json_out(['ok' => true, 'conversation' => $updated]);
}

// 5. Admin list all conversations
if ($action === 'admin_list') {
    chat_require_admin();
    $list = chat_with_store(function (array &$conversations) {
        return array_map('chat_enrich_conversation', $conversations);
    }, false);
    chat_json_out(['conversations' => $list]);
}

// 6. Admin sends a reply (initial read_status: 'sent', marks customer messages 'read')
if ($method === 'POST' && $action === 'admin_reply') {
    chat_require_admin();
    $sessionId = trim((string) ($body['session_id'] ?? ''));
    $text      = mb_substr(trim((string) ($body['message'] ?? '')), 0, 2000);
    $adminName = mb_substr(trim((string) ($body['admin_name'] ?? ($_SESSION['admin_user'] ?? 'Attaie Advisor'))), 0, 80);

    if ($sessionId === '' || $text === '') {
        chat_json_out(['error' => 'Conversation ID and message are required'], 400);
    }

    $now = gmdate('Y-m-d\TH:i:s\Z');
    $msgId = 'msg_' . bin2hex(random_bytes(6));

    $updated = chat_with_store(function (array &$conversations) use ($sessionId, $text, $adminName, $now, $msgId) {
        foreach ($conversations as $idx => &$conv) {
            if (($conv['id'] ?? '') === $sessionId) {
                // Mark previous customer messages as read since admin is replying
                if (isset($conv['messages']) && is_array($conv['messages'])) {
                    foreach ($conv['messages'] as &$m) {
                        if (($m['sender'] ?? '') === 'customer' && ($m['read_status'] ?? 'sent') !== 'read') {
                            $m['read_status'] = 'read';
                            $m['read_at']     = $now;
                        }
                    }
                    unset($m);
                }
                $conv['messages'][] = [
                    'id'          => $msgId,
                    'sender'      => 'admin',
                    'sender_name' => $adminName,
                    'text'        => $text,
                    'read_status' => 'sent',
                    'read_at'     => null,
                    'created_at'  => $now,
                ];
                $conv['unread_admin']    = 0;
                $conv['unread_customer'] = (int) ($conv['unread_customer'] ?? 0) + 1;
                $conv['typing_admin_at'] = null;
                $conv['updated_at']      = $now;
                $item = chat_enrich_conversation($conv);
                array_splice($conversations, $idx, 1);
                array_unshift($conversations, $item);
                return $item;
            }
        }
        return null;
    }, true);

    if (!$updated) {
        chat_json_out(['error' => 'Conversation not found'], 404);
    }

    chat_json_out(['conversation' => $updated]);
}

if ($method === 'POST' && $action === 'admin_status') {
    chat_require_admin();
    $sessionId = trim((string) ($body['session_id'] ?? ''));
    $status    = in_array($body['status'] ?? '', ['open', 'resolved'], true) ? $body['status'] : 'open';
    $updated = chat_with_store(function (array &$conversations) use ($sessionId, $status) {
        foreach ($conversations as &$conv) {
            if (($conv['id'] ?? '') === $sessionId) {
                $conv['status'] = $status;
                $conv['unread_admin'] = 0;
                return chat_enrich_conversation($conv);
            }
        }
        return null;
    }, true);
    chat_json_out(['conversation' => $updated]);
}

if ($method === 'POST' && $action === 'admin_delete') {
    chat_require_admin();
    $sessionId = trim((string) ($body['session_id'] ?? ''));
    chat_with_store(function (array &$conversations) use ($sessionId) {
        $conversations = array_values(array_filter($conversations, function ($c) use ($sessionId) {
            return ($c['id'] ?? '') !== $sessionId;
        }));
        return true;
    }, true);
    chat_json_out(['deleted' => true]);
}

chat_json_out(['error' => 'Invalid action'], 400);
