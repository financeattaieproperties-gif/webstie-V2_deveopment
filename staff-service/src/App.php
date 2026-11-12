<?php
declare(strict_types=1);
namespace Staff;
require_once __DIR__ . '/Domain.php';
require_once __DIR__ . '/FirebaseAuth.php';
use PDO;
use RuntimeException;
use InvalidArgumentException;

final class HttpError extends RuntimeException {
    public function __construct(public int $status, string $message) { parent::__construct($message); }
}

final class App {
    private PDO $db;
    private array $config;
    private array $user = [];
    private string $now;
    private string $requestId;

    public static function run(string $directory, ?string $configFile=null): void {
        $app = new self();
        $app->requestId = bin2hex(random_bytes(8));
        try { $app->boot($directory, $configFile); $data = $app->dispatch(); $app->respond($data); }
        catch (HttpError $e) { $app->respondError($e->status, $e->getMessage()); }
        catch (InvalidArgumentException $e) { $app->respondError(422, $e->getMessage()); }
        catch (\Throwable $e) {
            error_log('Staff request ' . $app->requestId . ' failed (' . get_class($e) . ').');
            $app->respondError(503, 'Staff service is temporarily unavailable. Your change was not confirmed.');
        }
    }
    private function boot(string $directory, ?string $configFile=null): void {
        date_default_timezone_set('UTC');
        $this->now = gmdate('Y-m-d H:i:s');
        $file = $configFile ?? getenv('STAFF_CONFIG_FILE');
        $real = $file ? realpath($file) : false;
        $root = realpath($_SERVER['DOCUMENT_ROOT'] ?? __DIR__);
        if (!$real || !$root || str_starts_with(str_replace('\\','/', $real), rtrim(str_replace('\\','/', $root), '/') . '/')) throw new HttpError(503, 'Private staff configuration is missing.');
        $this->config = require $real;
        if (!is_array($this->config) || !str_starts_with($this->config['dsn'] ?? '', 'mysql:')) throw new HttpError(503, 'A separate staff MySQL database must be configured.');
        $this->db = new PDO($this->config['dsn'], $this->config['database_user'], $this->config['database_password'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES=>false, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
        $this->db->exec("SET time_zone = '+00:00'");
        if ((int) $this->db->query("SELECT MAX(version) FROM core_module_versions WHERE module_code='callcenter'")->fetchColumn() !== 1) throw new HttpError(503, 'Staff database version does not match this release.');
        $sessions = realpath($this->config['session_directory'] ?? '');
        if (!$sessions || !is_writable($sessions) || str_starts_with(str_replace('\\','/', $sessions) . '/', rtrim(str_replace('\\','/', $root), '/') . '/')) throw new HttpError(503, 'Private staff sessions are not configured.');
        $local = in_array($_SERVER['SERVER_NAME'] ?? '', ['127.0.0.1','localhost'], true) && ($this->config['allow_local_http'] ?? false);
        if (!$local && (!str_starts_with($this->config['origin'] ?? '', 'https://') || (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] === 'off'))) throw new HttpError(503, 'Staff access requires HTTPS.');
        session_name('attaie_staff_session');
        session_save_path($sessions);
        ini_set('session.use_strict_mode', '1');
        session_set_cookie_params(['lifetime'=>0, 'path'=>'/', 'secure'=>!$local, 'httponly'=>true, 'samesite'=>'Strict']);
        session_start();
        if (!empty($_SESSION['user_id'])) {
            $row = $this->one('SELECT id,name,username,firebase_uid,role,active,auth_version FROM core_users WHERE id=?', [$_SESSION['user_id']]);
            if (!$row || !$row['active'] || $row['auth_version'] !== ($_SESSION['auth_version'] ?? null) || time() - ($_SESSION['last_seen'] ?? 0) > 1800 || time() >= ($_SESSION['firebase_expiry'] ?? 0)) {
                $_SESSION = [];
                session_regenerate_id(true);
            } else {
                if (time()-($_SESSION['firebase_checked']??0)>=300) {
                    try { $identity=$this->firebase()->verify($_SESSION['firebase_token']??'');
                        if ($identity['uid']!==$row['firebase_uid']) throw new FirebaseAuthException('Identity mismatch.');
                        $_SESSION['firebase_checked']=time();
                    } catch (FirebaseAuthException $e) { $_SESSION=[]; session_regenerate_id(true); $row=null; }
                }
                if ($row) { $this->user=$row; $_SESSION['last_seen']=time(); }
            }
        }
        $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
    }
    private function dispatch(): mixed {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $prefix = '/staff-api/v1';
        if (!str_starts_with($path, $prefix . '/') && $path !== $prefix) throw new HttpError(404, 'Route not found.');
        $route = trim(substr($path, strlen($prefix)), '/');
        if (!$this->user && !(($route==='session' && $method==='GET') || ($route==='auth/login' && $method==='POST'))) throw new HttpError(401,'Please sign in.');
        if ($method !== 'GET') {
            if (!in_array($method, ['POST','PATCH'], true)) throw new HttpError(405, 'Method not allowed.');
            if (($_SERVER['HTTP_ORIGIN'] ?? '') !== $this->config['origin']) throw new HttpError(403, 'Origin is not allowed.');
            if (!hash_equals($_SESSION['csrf'], $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) throw new HttpError(403, 'Session token expired. Refresh and try again.');
        }
        if ($route === 'session' && $method === 'GET') return ['user'=>$this->user ? $this->publicUser($this->user) : null,'csrfToken'=>$_SESSION['csrf'],'serverTime'=>Domain::iso($this->now)];
        if ($route === 'auth/login' && $method === 'POST') return $this->login($this->body());
        if (!$this->user) throw new HttpError(401, 'Please sign in.');
        if ($route === 'auth/logout' && $method === 'POST') { $_SESSION=[]; session_destroy(); setcookie(session_name(), '', ['expires'=>1,'path'=>'/','secure'=>session_get_cookie_params()['secure'],'httponly'=>true,'samesite'=>'Strict']); return ['success'=>true]; }
        $this->permission('callcenter.access');
        if ($method === 'GET') {
            if ($route === 'dashboard') return $this->workspace();
            if (preg_match('#^leads/(\d+)$#', $route, $m)) return $this->leadDetails((int)$m[1]);
            if ($route === 'staff') { $this->permission('core.staff.manage'); return $this->query("SELECT id,name,username,role,active FROM core_users WHERE role <> 'customer' ORDER BY id LIMIT 200"); }
            if ($route === 'departments') { return $this->query("SELECT code,name FROM core_departments WHERE code <> 'customers' ORDER BY name"); }
            throw new HttpError(404, 'Route not found.');
        }
        $body = $this->body();
        return $this->mutate($route, $body, function () use ($route,$body,$method) {
            if ($route === 'call-drafts' && $method === 'POST') return $this->createDraft($body);
            if (preg_match('#^leads/(\d+)/submit-entry$#',$route,$m) && $method === 'POST') return $this->submitEntry((int)$m[1],$body);
            if (preg_match('#^followups/(\d+)/feedback$#',$route,$m) && $method === 'POST') return $this->feedback((int)$m[1],$body);
            if ($route === 'tasks' && $method === 'POST') return $this->createTask($body);
            if (preg_match('#^tasks/(\d+)$#',$route,$m) && $method === 'PATCH') return $this->updateTask((int)$m[1],$body);
            if ($route === 'staff' && $method === 'POST') return $this->createStaff($body);
            if (preg_match('#^staff/(\d+)$#',$route,$m) && $method === 'PATCH') return $this->setStaffActive((int)$m[1],$body);
            if ($route === 'departments' && $method === 'POST') return $this->createDepartment($body);
            throw new HttpError(404, 'Route not found.');
        });
    }
    private function body(): array {
        if (!str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) throw new HttpError(415, 'JSON is required.');
        if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0)>65536) throw new HttpError(413, 'Request is too large.');
        $raw=file_get_contents('php://input', false, null, 0, 65537);
        if (strlen($raw)>65536) throw new HttpError(413, 'Request is too large.');
        try { $data=json_decode($raw,true,64,JSON_THROW_ON_ERROR); } catch (\JsonException $e) { throw new HttpError(400,'Invalid JSON.'); }
        if (!is_array($data) || array_is_list($data)) throw new HttpError(400,'A JSON object is required.');
        return $data;
    }
    private function firebase(): FirebaseAuth {
        return new FirebaseAuth($this->config['firebase_project_id']??'', $this->config['firebase_api_key']??'');
    }
    private function login(array $body): array {
        // A failed account switch must never leave the prior identity authenticated.
        $this->user=[]; $_SESSION=[]; session_regenerate_id(true); $_SESSION['csrf']=bin2hex(random_bytes(32));
        $bucket=hash('sha256', $_SERVER['REMOTE_ADDR']??'unknown');
        $cutoff=gmdate('Y-m-d H:i:s',time()-900);
        $this->execute('INSERT INTO core_login_limits(bucket,attempts,window_start) VALUES (?,1,?) ON DUPLICATE KEY UPDATE attempts=IF(window_start < ?,1,attempts+1),window_start=IF(window_start < ?,VALUES(window_start),window_start)',[$bucket,$this->now,$cutoff,$cutoff]);
        if ($this->one('SELECT attempts FROM core_login_limits WHERE bucket=?',[$bucket])['attempts']>20) { header('Retry-After: 900'); throw new HttpError(429,'Too many sign-in attempts. Try again later.'); }
        if (!is_string($body['idToken']??null)) throw new HttpError(401,'A Firebase sign-in token is required.');
        try { $identity=$this->firebase()->verify($body['idToken']); }
        catch (FirebaseAuthException $e) { throw new HttpError(401,$e->getMessage()); }
        $row=$this->one('SELECT * FROM core_users WHERE firebase_uid=?',[$identity['uid']]);
        if (!$row || !$row['active']) throw new HttpError(403,'This account has no active workspace access. Contact your administrator.');
        session_regenerate_id(true);
        $_SESSION=['user_id'=>$row['id'],'auth_version'=>$row['auth_version'],'created'=>time(),'last_seen'=>time(),'csrf'=>bin2hex(random_bytes(32)),
            'firebase_expiry'=>$identity['expiresAt'],'firebase_token'=>$body['idToken'],'firebase_checked'=>time()];
        $this->execute('DELETE FROM core_login_limits WHERE bucket=?',[$bucket]);
        return ['user'=>$this->publicUser($row),'csrfToken'=>$_SESSION['csrf'],'serverTime'=>Domain::iso($this->now)];
    }
    private function permission(string $code): void {
        if (!$this->hasPermission($code)) throw new HttpError(403,'This account does not have permission for this workspace.');
    }
    private function hasPermission(string $code): bool { return (bool)$this->one('SELECT 1 FROM core_role_permissions WHERE role_code=? AND permission_code=?',[$this->user['role'],$code]); }
    private function workspace(): array {
        $view=$_GET['view'] ?? 'overview';
        if (!in_array($view,['overview','followups','customers','leads','tasks','team','projects','contracts','finance','marketing','submissions','deliverables'],true)) throw new InvalidArgumentException('Unknown dashboard view.');
        if ($view==='tasks') $this->permission('core.tasks.read_own');
        if ($view==='team') $this->permission('core.tasks.assign');
        $search=trim((string)($_GET['q'] ?? ''));
        if (strlen($search)>160) throw new InvalidArgumentException('Search is too long.');
        $page=max(0,min(10000,(int)($_GET['page'] ?? 0))); $offset=$page*25;
        $like=str_replace(['!','%','_'],['!!','!%','!_'],$search).'%';
        $bucket=$_GET['bucket'] ?? 'all';
        if (!in_array($bucket,['all','today','due','upcoming','overtime','completed'],true)) throw new InvalidArgumentException('Unknown follow-up filter.');
        $bucketSql=''; $bucketParams=[];
        if ($bucket==='today') { $start=(new \DateTimeImmutable('today',new \DateTimeZone('Asia/Kabul')))->setTimezone(new \DateTimeZone('UTC')); $bucketSql=' AND f.completed_at IS NULL AND f.scheduled_at>=? AND f.scheduled_at<?'; $bucketParams=[$start->format('Y-m-d H:i:s'),$start->modify('+1 day')->format('Y-m-d H:i:s')]; }
        elseif ($bucket==='completed') $bucketSql=' AND f.completed_at IS NOT NULL';
        elseif ($bucket==='due') { $bucketSql=' AND f.completed_at IS NULL AND f.scheduled_at<=? AND f.deadline_at>=?'; $bucketParams=[$this->now,$this->now]; }
        elseif ($bucket==='upcoming') { $bucketSql=' AND f.completed_at IS NULL AND f.scheduled_at>?'; $bucketParams=[$this->now]; }
        elseif ($bucket==='overtime') { $bucketSql=' AND f.completed_at IS NULL AND f.deadline_at<?'; $bucketParams=[$this->now]; }
        $access=$this->isManager() ? '1=1' : '(l.origin_agent_id='.$this->uid().' OR l.assignee_id='.$this->uid().')';
        $mine='f.assignee_id='.$this->uid();
        $base="SELECT f.*,l.serial,l.customer_name,l.phone,l.requirements FROM cc_followup_tasks f JOIN cc_leads l ON l.id=f.lead_id WHERE $mine";
        $followups=in_array($view,['overview','followups'],true) ? $this->query($base.$bucketSql." AND (l.customer_name LIKE ? ESCAPE '!' OR l.serial LIKE ? ESCAPE '!') ORDER BY f.completed_at IS NOT NULL, f.scheduled_at,f.id LIMIT 25 OFFSET $offset",[...$bucketParams,$like,$like]) : [];
        $leads=in_array($view,['overview','leads'],true) ? $this->query("SELECT l.* FROM cc_leads l WHERE $access AND (l.customer_name LIKE ? ESCAPE '!' OR l.serial LIKE ? ESCAPE '!' OR l.phone LIKE ? ESCAPE '!') ORDER BY l.id DESC LIMIT 25 OFFSET $offset",[$like,$like,$like]) : [];
        $taskScope=$view==='team' && $this->isManager() ? '1=1' : 't.assignee_id='.$this->uid();
        $tasks=in_array($view,['overview','tasks','team'],true) && $this->hasPermission('core.tasks.read_own') ? $this->query("SELECT t.*,u.name AS assigned_by_name FROM core_management_tasks t JOIN core_users u ON u.id=t.assigned_by WHERE $taskScope AND t.title LIKE ? ESCAPE '!' ORDER BY t.completed_at IS NOT NULL,t.deadline_at,t.id LIMIT 25 OFFSET $offset",[$like]) : [];
        $customers=$view==='customers' ? $this->query("SELECT c.id,c.name,c.phone,COUNT(l.id) AS lead_count,MAX(l.id) AS latest_lead_id FROM cc_customers c JOIN cc_leads l ON l.customer_id=c.id WHERE $access AND (c.name LIKE ? ESCAPE '!' OR c.phone LIKE ? ESCAPE '!') GROUP BY c.id,c.name,c.phone ORDER BY c.id DESC LIMIT 25 OFFSET $offset",[$like,$like]) : [];
        $recentMap=[]; if ($customers) { $ids=array_column($customers,'latest_lead_id'); foreach($this->query('SELECT id,requirements FROM cc_leads WHERE id IN ('.implode(',',array_fill(0,count($ids),'?')).')',$ids) as $row) $recentMap[$row['id']]=$row['requirements']; }
        foreach($customers as &$customer) { $customer=['id'=>(int)$customer['id'],'name'=>$customer['name'],'phone'=>$customer['phone'],'requirements'=>$recentMap[$customer['latest_lead_id']] ?? '','leadCount'=>(int)$customer['lead_count']]; } unset($customer);
        $counts=$this->one("SELECT SUM(f.completed_at IS NULL AND f.scheduled_at<=?) AS due,SUM(f.completed_at IS NULL AND f.deadline_at<?) AS overtime,SUM(f.completed_at IS NOT NULL AND f.late_seconds>0) AS completedLate FROM cc_followup_tasks f WHERE $mine",[$this->now,$this->now]);
        $counts['due']=(int)$counts['due']-(int)$counts['overtime'];
        $counts['newLeads']=(int)$this->one("SELECT COUNT(*) AS n FROM cc_leads l WHERE $access AND l.status='draft'")['n'];
        $counts['tasks']=(int)$this->one("SELECT COUNT(*) AS n FROM core_management_tasks WHERE assignee_id=? AND status IN ('todo','in_progress')",[$this->uid()])['n'];
        $roles=$this->isManager() ? "('manager','hr_manager','callcenter','sales_leader','sales','marketing_manager','production_manager','editor','videographer','photographer','finance_manager','finance_assistant','architect','graphic_designer','visual_designer_3d','ceo')" : "('callcenter','sales','sales_leader')";
        $assignees=$this->query("SELECT id,name,role,active FROM core_users WHERE active=1 AND role IN $roles ORDER BY name LIMIT 100");
        return ['leads'=>array_map([$this,'leadDto'],$leads),'followups'=>array_map([$this,'followupDto'],$followups),'customers'=>$customers,'tasks'=>array_map([$this,'taskDto'],$tasks),'assignees'=>array_map([$this,'publicUser'],$assignees),'counts'=>array_map('intval',$counts),'page'=>$page,'integration'=>['enabled'=>false,'message'=>'Etisalat automatic capture is not connected. Manual call entries are labeled.'],'serverTime'=>Domain::iso($this->now)];
    }
    private function leadDetails(int $id): array {
        $lead=$this->lead($id);
        $dto=$this->leadDto($lead);
        $dto['activities']=array_map(fn($r)=>['id'=>(int)$r['id'],'actorName'=>$r['name'],'type'=>$r['type'],'notes'=>$r['notes'],'at'=>Domain::iso($r['created_at'])],$this->query('SELECT a.*,u.name FROM cc_lead_activities a JOIN core_users u ON u.id=a.actor_id WHERE lead_id=? ORDER BY a.id DESC LIMIT 100',[$id]));
        $dto['deal']=$this->one('SELECT d.amount,d.currency,d.closed_at,u.name AS salesAgent FROM cc_deal_closures d JOIN core_users u ON u.id=d.sales_agent_id WHERE d.lead_id=?',[$id]);
        if ($dto['deal']) { $dto['deal']['closedAt']=Domain::iso($dto['deal']['closed_at']); unset($dto['deal']['closed_at']); }
        return $dto;
    }
    private function createDraft(array $body): array {
        if ($this->user['role']!=='callcenter') throw new HttpError(403,'Only call center agents can record call entries.');
        $phone=Domain::phone((string)($body['phone'] ?? ''));
        $raw=$body['callAt'] ?? '';
        if (!is_string($raw) || !preg_match('/^\d{4}-\d{2}-\d{2}T/', $raw)) throw new InvalidArgumentException('Enter the actual call time.');
        try { $date=new \DateTimeImmutable($raw); } catch (\Exception $e) { throw new InvalidArgumentException('Invalid call time.'); }
        if ($date->getTimestamp()>time()+60) throw new InvalidArgumentException('Call time cannot be in the future.');
        $this->execute('INSERT IGNORE INTO cc_serial_counters(agent_id,next_number) VALUES (?,1)',[$this->uid()]);
        $counter=$this->one('SELECT next_number FROM cc_serial_counters WHERE agent_id=? FOR UPDATE',[$this->uid()]);
        $serial='CA'.str_pad((string)$this->uid(),2,'0',STR_PAD_LEFT).'-L'.$counter['next_number'];
        $this->execute('UPDATE cc_serial_counters SET next_number=next_number+1 WHERE agent_id=?',[$this->uid()]);
        $this->execute("INSERT INTO cc_leads(serial,phone,requirements,origin_agent_id,assignee_id,call_at,source) VALUES (?,?,'',?,?,?,'manual')",[$serial,$phone,$this->uid(),$this->uid(),$date->setTimezone(new \DateTimeZone('UTC'))->format('Y-m-d H:i:s')]);
        $id=(int)$this->db->lastInsertId();
        $this->execute("INSERT INTO cc_calls(lead_id,agent_id,customer_phone,call_at,source,created_at) VALUES (?,?,?,?,'manual',?)",[$id,$this->uid(),$phone,$date->setTimezone(new \DateTimeZone('UTC'))->format('Y-m-d H:i:s'),$this->now]);
        $this->audit('call.manual_created',$id);
        return $this->leadDto($this->lead($id));
    }
    private function submitEntry(int $id,array $body): array {
        $lead=$this->lead($id,true); $this->version($lead,$body);
        if ($this->user['role']!=='callcenter' || (int)$lead['assignee_id']!==$this->uid() || $lead['status']!=='draft') throw new HttpError(403,'This entry cannot be submitted by this account.');
        $name=Domain::text($body['customerName'] ?? null,160); $requirements=Domain::text($body['requirements'] ?? null);
        $scheduled=Domain::future($body['nextScheduledAt'] ?? null);
        $assignee=(int)($body['nextAssigneeId'] ?? $this->uid()); $this->eligible($assignee);
        $customerId=(int)($body['customerId'] ?? 0);
        if ($customerId) {
            $match=$this->one('SELECT c.id FROM cc_customers c JOIN cc_leads l ON l.customer_id=c.id WHERE c.id=? AND c.phone=? AND (l.origin_agent_id=? OR l.assignee_id=?) LIMIT 1',[$customerId,$lead['phone'],$this->uid(),$this->uid()]);
            if (!$match) throw new HttpError(404,'Customer match is not accessible.');
        } else {
            $this->execute('INSERT INTO cc_customers(name,phone,created_at) VALUES (?,?,?)',[$name,$lead['phone'],$this->now]); $customerId=(int)$this->db->lastInsertId();
        }
        $taskId=$this->nextTask($id,$assignee,$scheduled,$requirements);
        $this->execute("UPDATE cc_leads SET customer_id=?,customer_name=?,requirements=?,assignee_id=?,status='active',current_task_id=?,version=version+1 WHERE id=?",[$customerId,$name,$requirements,$assignee,$taskId,$id]);
        $this->activity($id,'entry_submitted',$requirements); $this->audit('lead.entry_submitted',$id);
        return $this->leadDto($this->lead($id));
    }
    private function feedback(int $id,array $body): array {
        $found=$this->one('SELECT lead_id FROM cc_followup_tasks WHERE id=? AND assignee_id=?',[$id,$this->uid()]);
        if (!$found) throw new HttpError(404,'Follow-up not found.');
        $lead=$this->lead((int)$found['lead_id'],true);
        $task=$this->one('SELECT * FROM cc_followup_tasks WHERE id=? FOR UPDATE',[$id]); $this->version($task,$body);
        if ($task['completed_at']!==null || (int)$lead['current_task_id']!==$id || $lead['status']!=='active') throw new HttpError(409,'This follow-up was already changed. Refresh before retrying.');
        Domain::feedback($body,$this->user['role']);
        $notes=Domain::text($body['outcome']==='lost' ? $body['reason'] : ($body['outcome']==='closed' ? 'Deal closed' : $body['notes']));
        $late=max(0,strtotime($this->now)-strtotime($task['deadline_at']));
        $next=null; $status=$body['outcome']==='closed' ? 'closed' : ($body['outcome']==='lost' ? 'lost' : 'active');
        $assignee=(int)$lead['assignee_id'];
        if ($status==='active') { $assignee=$body['nextAssigneeId']; $this->eligible($assignee); $next=$this->nextTask((int)$lead['id'],$assignee,Domain::future($body['nextScheduledAt']),$notes); }
        if ($status==='closed') $this->execute('INSERT INTO cc_deal_closures(lead_id,sales_agent_id,amount,currency,closed_at) VALUES (?,?,?,?,?)',[$lead['id'],$this->uid(),$body['amount'],$body['currency'],$this->now]);
        $this->execute('UPDATE cc_followup_tasks SET completed_at=?,late_seconds=?,notes=?,outcome=?,version=version+1 WHERE id=?',[$this->now,$late,$notes,$body['outcome'],$id]);
        $this->execute('UPDATE cc_leads SET current_task_id=?,assignee_id=?,status=?,version=version+1 WHERE id=?',[$next,$assignee,$status,$lead['id']]);
        $this->activity((int)$lead['id'],$body['outcome'],$notes); $this->audit('followup.'.$body['outcome'],$id,json_encode(['nextAssigneeId'=>$assignee,'nextTaskId'=>$next,'lateSeconds'=>$late]));
        return ['success'=>true,'nextTaskId'=>$next,'lateSeconds'=>$late];
    }
    private function createTask(array $body): array {
        $this->permission('core.tasks.assign'); $title=Domain::text($body['title'] ?? null,200); $instructions=Domain::text($body['instructions'] ?? null);
        if (!in_array($body['priority'] ?? '',['low','normal','high','urgent'],true)) throw new InvalidArgumentException('Choose task priority.');
        $assignee=$this->activeUser((int)($body['assigneeId'] ?? 0)); $deadline=Domain::future($body['deadlineAt'] ?? null);
        if ($assignee['role']==='customer' || !$this->one('SELECT 1 FROM core_role_permissions WHERE role_code=? AND permission_code=?',[$assignee['role'],'core.tasks.read_own'])) throw new InvalidArgumentException('Select an active operational staff member.');
        $this->execute('INSERT INTO core_management_tasks(title,instructions,priority,assignee_id,assigned_by,deadline_at) VALUES (?,?,?,?,?,?)',[$title,$instructions,$body['priority'],$assignee['id'],$this->uid(),$deadline]);
        $id=(int)$this->db->lastInsertId(); $this->audit('task.assigned',$id,json_encode(['assigneeId'=>(int)$assignee['id']])); return ['id'=>$id];
    }
    private function updateTask(int $id,array $body): array {
        $this->permission('core.tasks.read_own');
        $task=$this->one('SELECT * FROM core_management_tasks WHERE id=? AND assignee_id=? FOR UPDATE',[$id,$this->uid()]);
        if (!$task) throw new HttpError(404,'Task not found.'); $this->version($task,$body);
        if (in_array($task['status'],['completed','cancelled'],true)) throw new HttpError(409,'This task is already completed.');
        if (!in_array($body['status'] ?? '',['in_progress','completed'],true)) throw new InvalidArgumentException('Choose In progress or Completed.');
        if (array_diff(array_keys($body),['version','status'])) throw new InvalidArgumentException('Task assignment fields cannot be changed here.');
        $this->execute('UPDATE core_management_tasks SET status=?,completed_at=?,version=version+1 WHERE id=?',[$body['status'],$body['status']==='completed' ? $this->now : null,$id]);
        $this->audit('task.'.$body['status'],$id); return ['success'=>true];
    }
    private function createDepartment(array $body): array {
        $this->permission('core.departments.manage');
        $code=strtolower(preg_replace('/[^a-zA-Z0-9_]/','',Domain::text($body['code']??null,60)));
        $name=Domain::text($body['name']??null,120);
        if ($code==='') throw new InvalidArgumentException('Enter a valid department code.');
        $this->execute('INSERT INTO core_departments(code,name) VALUES (?,?) ON DUPLICATE KEY UPDATE name=VALUES(name)',[$code,$name]);
        $this->audit('department.saved',0,json_encode(['code'=>$code,'name'=>$name]));
        return ['code'=>$code,'name'=>$name];
    }
    private function createStaff(array $body): array {
        $this->permission('core.staff.manage');
        $name=Domain::text($body['name']??null,120);
        $username=strtolower(Domain::text($body['username']??null,254));
        if (!filter_var($username,FILTER_VALIDATE_EMAIL)) throw new InvalidArgumentException('Enter the Firebase account email.');
        $uid=Domain::text($body['firebaseUid']??null,128);
        if (!preg_match('/^[\x21-\x7e]{1,128}$/D',$uid)) throw new InvalidArgumentException('Enter the exact Firebase UID.');
        $allowedRoles=['callcenter','sales','sales_leader','hr_manager','marketing_manager','production_manager','editor','videographer','photographer','finance_manager','finance_assistant','architect','graphic_designer','visual_designer_3d'];
        if (!in_array($body['role']??'',$allowedRoles,true)) throw new InvalidArgumentException('Select an internal operational staff role.');
        if ($this->one('SELECT id FROM core_users WHERE username=? OR firebase_uid=?',[$username,$uid])) throw new HttpError(409,'That email or Firebase UID is already provisioned.');
        $this->execute('INSERT INTO core_users(name,username,firebase_uid,role) VALUES (?,?,?,?)',[$name,$username,$uid,$body['role']]);
        $id=(int)$this->db->lastInsertId(); $this->audit('staff.created',$id); return ['id'=>$id];
    }
    private function setStaffActive(int $id,array $body): array {
        $this->permission('core.staff.manage'); if ($id===$this->uid()) throw new HttpError(403,'You cannot deactivate your own account.');
        if (!is_bool($body['active'] ?? null)) throw new InvalidArgumentException('An active flag is required.');
        $target=$this->one('SELECT role FROM core_users WHERE id=? FOR UPDATE',[$id]);
        if (!$target || in_array($target['role'],['ceo','admin','manager'],true)) throw new HttpError(403,'Privileged staff changes require private administration.');
        if (!$body['active'] && ($this->one("SELECT id FROM cc_leads WHERE assignee_id=? AND status IN ('draft','active') LIMIT 1 FOR UPDATE",[$id]) || $this->one("SELECT id FROM core_management_tasks WHERE assignee_id=? AND status IN ('todo','in_progress') LIMIT 1 FOR UPDATE",[$id]))) throw new HttpError(409,'This agent still has active work. Resolve assignments before deactivation.');
        $this->execute('UPDATE core_users SET active=?,auth_version=auth_version+1 WHERE id=?',[(int)$body['active'],$id]); $this->audit('staff.active_changed',$id); return ['success'=>true];
    }
    private function mutate(string $route,array $body,callable $operation): mixed {
        $key=$_SERVER['HTTP_IDEMPOTENCY_KEY'] ?? '';
        if (!preg_match('/^[a-zA-Z0-9-]{16,80}$/',$key)) throw new HttpError(400,'A unique request key is required.');
        $hash=hash('sha256',$route.'|'.json_encode($body));
        $this->db->beginTransaction();
        try {
            $this->execute('INSERT IGNORE INTO core_idempotency_keys(actor_id,request_key,body_hash,created_at) VALUES (?,?,?,?)',[$this->uid(),$key,$hash,$this->now]);
            $record=$this->one('SELECT body_hash,result_json FROM core_idempotency_keys WHERE actor_id=? AND request_key=? FOR UPDATE',[$this->uid(),$key]);
            if (!hash_equals($record['body_hash'],$hash)) throw new HttpError(409,'Request key was already used for different data.');
            if ($record['result_json']!==null) { $this->db->commit(); return json_decode($record['result_json'],true,64,JSON_THROW_ON_ERROR); }
            $result=$operation(); $this->execute('UPDATE core_idempotency_keys SET result_json=? WHERE actor_id=? AND request_key=?',[json_encode($result,JSON_THROW_ON_ERROR),$this->uid(),$key]);
            $this->db->commit(); return $result;
        } catch (\Throwable $e) { if ($this->db->inTransaction()) $this->db->rollBack(); throw $e; }
    }
    private function lead(int $id,bool $lock=false): array {
        $row=$this->one('SELECT * FROM cc_leads WHERE id=?'.($lock ? ' FOR UPDATE' : ''),[$id]);
        if (!$row || (!$this->isManager() && (int)$row['origin_agent_id']!==$this->uid() && (int)$row['assignee_id']!==$this->uid())) throw new HttpError(404,'Lead not found.');
        return $row;
    }
    private function eligible(int $id): void {
        $target=$this->activeUser($id);
        $role=$this->user['role'];
        if ($id===$this->uid() && in_array($role,['callcenter','sales'],true)) return;
        if (!(($role==='callcenter' && $target['role']==='sales') || ($role==='sales' && $target['role']==='callcenter'))) throw new HttpError(403,'Select yourself or an eligible handoff agent.');
    }
    private function activeUser(int $id): array { $row=$this->one('SELECT id,name,role FROM core_users WHERE id=? AND active=1 FOR UPDATE',[$id]); if (!$row) throw new InvalidArgumentException('Select an active staff member.'); return $row; }
    private function nextTask(int $lead,int $assignee,string $scheduled,string $notes): int {
        $deadline=gmdate('Y-m-d H:i:s',strtotime($scheduled)+86400);
        $this->execute('INSERT INTO cc_followup_tasks(lead_id,assignee_id,scheduled_at,deadline_at,notes) VALUES (?,?,?,?,?)',[$lead,$assignee,$scheduled,$deadline,$notes]); return (int)$this->db->lastInsertId();
    }
    private function activity(int $lead,string $type,string $notes): void { $this->execute('INSERT INTO cc_lead_activities(lead_id,actor_id,type,notes,created_at) VALUES (?,?,?,?,?)',[$lead,$this->uid(),$type,$notes,$this->now]); }
    private function audit(string $action,int $id,string $details='{}'): void { $this->execute('INSERT INTO core_audit_events(actor_id,action,target_id,details,created_at) VALUES (?,?,?,?,?)',[$this->uid(),$action,$id,$details,$this->now]); }
    private function version(array $row,array $body): void { if (!is_int($body['version'] ?? null) || (int)$row['version']!==$body['version']) throw new HttpError(409,'This record changed. Refresh before submitting.'); }
    private function uid(): int { return (int)$this->user['id']; }
    private function isManager(): bool { return $this->hasPermission('callcenter.manage'); }
    private function manager(): void { if (!$this->isManager()) throw new HttpError(403,'Management permission is required.'); }
    private function publicUser(array $row): array { return ['id'=>(int)$row['id'],'name'=>$row['name'],'role'=>$row['role'],'username'=>$row['username'] ?? '','active'=>(bool)($row['active'] ?? 1)]; }
    private function leadDto(array $r): array { return ['id'=>(int)$r['id'],'serial'=>$r['serial'],'customerId'=>$r['customer_id']===null ? null : (int)$r['customer_id'],'customerName'=>$r['customer_name'],'phone'=>$r['phone'],'requirements'=>$r['requirements'],'status'=>$r['status'],'originAgentId'=>(int)$r['origin_agent_id'],'assigneeId'=>(int)$r['assignee_id'],'callAt'=>Domain::iso($r['call_at']),'source'=>$r['source'],'version'=>(int)$r['version']]; }
    private function followupDto(array $r): array { return ['id'=>(int)$r['id'],'leadId'=>(int)$r['lead_id'],'serial'=>$r['serial'],'customerName'=>$r['customer_name'],'phone'=>$r['phone'],'requirements'=>$r['requirements'],'assigneeId'=>(int)$r['assignee_id'],'scheduledAt'=>Domain::iso($r['scheduled_at']),'completedAt'=>Domain::iso($r['completed_at']),'notes'=>$r['notes'],'version'=>(int)$r['version']]; }
    private function taskDto(array $r): array { return ['id'=>(int)$r['id'],'title'=>$r['title'],'instructions'=>$r['instructions'],'priority'=>$r['priority'],'assigneeId'=>(int)$r['assignee_id'],'assignedBy'=>$r['assigned_by_name'],'deadlineAt'=>Domain::iso($r['deadline_at']),'status'=>$r['status'],'completedAt'=>Domain::iso($r['completed_at']),'version'=>(int)$r['version']]; }
    private function query(string $sql,array $params=[]): array { $s=$this->db->prepare($sql); $s->execute($params); return $s->fetchAll(); }
    private function one(string $sql,array $params=[]): ?array { return $this->query($sql,$params)[0] ?? null; }
    private function execute(string $sql,array $params=[]): void { $s=$this->db->prepare($sql); $s->execute($params); }
    private function respond(mixed $data): void { echo json_encode(['data'=>$data,'requestId'=>$this->requestId,'serverTime'=>Domain::iso($this->now)],JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR); }
    private function respondError(int $status,string $message): void { http_response_code($status); echo json_encode(['error'=>['code'=>'HTTP_'.$status,'message'=>$message],'requestId'=>$this->requestId]); }
}
