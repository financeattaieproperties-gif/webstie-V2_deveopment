<?php
declare(strict_types=1);
if (PHP_SAPI!=='cli'||getenv('STAFF_LOCAL_TEST')!=='1') throw new RuntimeException('Fictional local fixture only');
require_once __DIR__.'/../src/App.php';
$name=getenv('STAFF_LEAD_TEST_DATABASE');
if (!is_string($name)||!preg_match('/^attaie_v2_test_[a-f0-9]{20}$/D',$name)) throw new RuntimeException('Refusing nonfixture target');
$db=new PDO('mysql:host=127.0.0.1;port=3397;charset=utf8mb4','root','',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_EMULATE_PREPARES=>false,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
$action=$argv[1]??'setup';
if($action==='drop'){$db->exec("DROP DATABASE IF EXISTS `$name`");exit;}
if($action==='setup')$db->exec("CREATE DATABASE `$name` CHARACTER SET utf8mb4");
$db->exec("USE `$name`");
if($db->query('SELECT DATABASE()')->fetchColumn()!==$name)throw new RuntimeException('Wrong fixture target');
if($action==='counts') {
    $counts=[];foreach(['cc_leads','cc_followup_tasks','crm_customer_property_leads','core_audit_events'] as $table)$counts[$table]=(int)$db->query('SELECT COUNT(*) FROM '.$table)->fetchColumn();
    $counts['qualified_leads']=(int)$db->query("SELECT COUNT(*) FROM cc_leads WHERE status<>'draft'")->fetchColumn();
    echo json_encode($counts);exit;
}
if($action==='worker') {
    $app=new Staff\App();$rc=new ReflectionClass($app);$body=json_decode(getenv('STAFF_LEAD_TEST_BODY'),true,512,JSON_THROW_ON_ERROR);$route=getenv('STAFF_LEAD_TEST_ROUTE');
    $q=$db->prepare('SELECT * FROM core_users WHERE id=?');$q->execute([(int)getenv('STAFF_LEAD_TEST_ACTOR')]);
    foreach(['db'=>$db,'user'=>$q->fetch(),'now'=>gmdate('Y-m-d H:i:s'),'config'=>['dsn'=>"mysql:host=127.0.0.1;port=3397;dbname=$name",'origin'=>'http://127.0.0.1']] as $key=>$value)$rc->getProperty($key)->setValue($app,$value);
    $_SERVER['HTTP_IDEMPOTENCY_KEY']=getenv('STAFF_LEAD_TEST_KEY');
    try {
        $operation=function()use($rc,$app,$route,$body){
            if(preg_match('#^leads/(\d+)/submit-entry$#',$route,$match))return $rc->getMethod('submitEntry')->invoke($app,(int)$match[1],$body);
            return $rc->getMethod('moduleWrite')->invoke($app,$route,$body);
        };
        $result=$rc->getMethod('mutate')->invoke($app,$route,$body,$operation);
        echo json_encode(['status'=>200,'data'=>$result]);
    }catch(Staff\HttpError $error){echo json_encode(['status'=>$error->status,'error'=>$error->getMessage()]);}
    catch(InvalidArgumentException $error){echo json_encode(['status'=>422,'error'=>$error->getMessage()]);}
    exit;
}
if($action==='close-first'){$db->exec("UPDATE cc_leads SET status='lost' WHERE id=(SELECT id FROM (SELECT MIN(id) id FROM cc_leads) x)");exit;}
if($action==='closed-first'){$db->exec("UPDATE cc_leads SET status='closed' WHERE id=(SELECT id FROM (SELECT MIN(id) id FROM cc_leads) x)");exit;}
foreach(['001-core.sql','010-callcenter.sql','020-inventory.sql','030-sales-crm.sql','040-hr-finance.sql','050-marketing-production.sql','060-engineering.sql','090-role-migration.sql','095-retire-finance-assistant.sql','100-dashboard-completion.sql','103-customer-property-leads.sql'] as $file)$db->exec(file_get_contents(__DIR__.'/../database/'.$file));
$db->exec("INSERT INTO core_branches(id,code,name) VALUES (1,'FIX-1','Fictional branch'),(2,'FIX-2','Foreign fictional branch')");
$roles=['sales','sales','callcenter','sales','sales','manager'];
foreach($roles as $index=>$role){$id=$index+1;$q=$db->prepare('INSERT INTO core_users(id,firebase_uid,name,username,role,branch_id) VALUES (?,?,?,?,?,?)');$q->execute([$id,'fictional-'.$id,'Fictional '.$role.' '.$id,'fixture'.$id.'@example.test',$role,$id===5?2:1]);}
foreach([1,2,3] as $id){$q=$db->prepare('INSERT INTO inv_projects(id,branch_id,code,name,location,description,created_by) VALUES (?,?,?,?,?,?,6)');$q->execute([$id,$id===3?2:1,'FX-'.$id,'Fictional property '.$id,'Fixture','Fixture']);}
foreach([[1,1],[2,1],[3,2],[4,3]] as [$id,$project]){$q=$db->prepare("INSERT INTO inv_apartments(id,project_id,unit_number,serial_number,floor,area_sqm,direction,boundary_north,boundary_south,boundary_east,boundary_west,price_per_sqm,total_price) VALUES (?,?,?, ?,1,100,'N','N','S','E','W',10,1000)");$q->execute([$id,$project,'A-'.$id,'FX-A-'.$id]);}
foreach([1,2,4] as $agent)foreach([1,2] as $project)$db->exec("INSERT INTO inv_project_sales_agents(project_id,sales_agent_id,assigned_by) VALUES ($project,$agent,6)");
$db->exec("INSERT INTO inv_project_sales_agents(project_id,sales_agent_id,assigned_by) VALUES (3,5,6)");
$db->exec("INSERT INTO cc_customers(id,branch_id,name,phone,created_at) VALUES (1,1,'Fictional shared customer','+93700000000',UTC_TIMESTAMP())");
$db->exec("INSERT INTO crm_phone_registry(phone,customer_id) VALUES ('+93700000000',1)");
$db->exec("INSERT INTO crm_customer_owners(customer_id,serial,owner_agent_id) VALUES (1,'C-FIX-1',1)");
$db->exec("INSERT INTO crm_customer_shared_access(customer_id,agent_id,granted_by) VALUES (1,2,6),(1,3,6)");
$dir=getenv('STAFF_LEAD_TEST_DIR');mkdir($dir.'/sessions',0700,true);$sessions=[];
foreach($roles as $i=>$role){$sid=bin2hex(random_bytes(16));$csrf=bin2hex(random_bytes(32));$now=time();$session=['user_id'=>$i+1,'auth_version'=>1,'last_seen'=>$now,'firebase_expiry'=>$now+3600,'firebase_checked'=>$now,'csrf'=>$csrf];$encoded='';foreach($session as $key=>$value)$encoded.=$key.'|'.serialize($value);file_put_contents($dir.'/sessions/sess_'.$sid,$encoded);$sessions[(string)($i+1)]=['cookie'=>'attaie_staff_session='.$sid,'csrf'=>$csrf];}
$config=['dsn'=>"mysql:host=127.0.0.1;port=3397;dbname=$name;charset=utf8mb4",'database_user'=>'root','database_password'=>'','origin'=>getenv('STAFF_LEAD_TEST_ORIGIN'),'session_directory'=>$dir.'/sessions','allow_local_http'=>true];
file_put_contents($dir.'/config.php','<?php return '.var_export($config,true).';');
echo json_encode(['sessions'=>$sessions]);
