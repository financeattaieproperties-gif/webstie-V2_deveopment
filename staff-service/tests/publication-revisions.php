<?php
declare(strict_types=1);
if (PHP_SAPI!=='cli'||getenv('STAFF_LOCAL_TEST')!=='1') throw new RuntimeException('Isolated fictional fixture only.');
require_once __DIR__.'/../src/App.php';
$db=new PDO('mysql:host=127.0.0.1;port=3397;charset=utf8mb4','root','',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_EMULATE_PREPARES=>false,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
$suffix=bin2hex(random_bytes(6));$crm='attaie_pub_test_'.$suffix;$sub=$crm.'_sub';$web=$crm.'_web';$checks=0;$server=null;$testDir=sys_get_temp_dir().'/attaie-publication-'.$suffix;
$check=function(bool $condition,string $message)use(&$checks){if(!$condition)throw new RuntimeException($message);$checks++;};
try {
 foreach([$crm,$sub,$web] as $name){$db->exec("CREATE DATABASE `$name` CHARACTER SET utf8mb4");}
 $db->exec("USE `$crm`");$check($db->query('SELECT DATABASE()')->fetchColumn()===$crm,'Wrong fixture database');
 foreach(['001-core.sql','010-callcenter.sql','020-inventory.sql','030-sales-crm.sql','040-hr-finance.sql','050-marketing-production.sql','060-engineering.sql','090-role-migration.sql','095-retire-finance-assistant.sql','100-dashboard-completion.sql','105-submission-revisions-internal.sql'] as $file)$db->exec(file_get_contents(__DIR__.'/../database/'.$file));
 $sdb=new PDO("mysql:host=127.0.0.1;port=3397;dbname=$sub;charset=utf8mb4",'root','',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
 foreach(['055-submissions-db.sql','106-submission-revisions-third.sql'] as $file)$sdb->exec(file_get_contents(__DIR__.'/../database/'.$file));
 $db->exec("INSERT INTO core_branches(id,code,name) VALUES (1,'FX','Fictional'); INSERT INTO core_users(id,firebase_uid,username,name,role,branch_id) VALUES (1,'fx-editor','editor@example.test','Fictional Editor','editor',1),(2,'fx-sales','sales@example.test','Fictional Sales','sales',1),(3,'fx-other','other@example.test','Other Editor','editor',1)");
 $db->exec("INSERT INTO mkt_production_entries(id,branch_id,customer_name,address,property_type,submitted_by_id,filming_completed_at,editor_id,stage) VALUES (1,1,'Fictional Owner','Fictional Street','Apartment',2,UTC_TIMESTAMP(),1,'ready_for_post')");
 $photos=[];for($i=0;$i<6;$i++){$id=str_pad(dechex($i+1),32,'0',STR_PAD_LEFT);$q=$db->prepare("INSERT INTO core_private_files(id,owner_id,purpose,file_name,mime,byte_size,content) VALUES (?,1,'marketing','fictional.png','image/png',1,'x')");$q->execute([$id]);$photos[]='/staff-api/v1/files/'.$id;}
 $app=new Staff\App();$r=new ReflectionClass($app);foreach(['db'=>$db,'now'=>gmdate('Y-m-d H:i:s'),'config'=>['dsn'=>"mysql:host=127.0.0.1;port=3397;dbname=$crm",'submission_dsn'=>"mysql:host=127.0.0.1;port=3397;dbname=$sub",'submission_user'=>'root','submission_password'=>'']] as $k=>$v)$r->getProperty($k)->setValue($app,$v);
 $actor=function(int $id)use($r,$app,$db){$r->getProperty('user')->setValue($app,$db->query('SELECT * FROM core_users WHERE id='.$id)->fetch());};$actor(1);
 $invoke=function(array $body)use($r,$app){return $r->getMethod('marketingAdvance')->invoke($app,1,$body);};
 $body=['action'=>'submit_website','version'=>1,'serialNumber'=>'FX-PUB-1','propertyInfoNote'=>'Fictional publication details','photos'=>array_slice($photos,0,5)];
 $reject=function(callable $fn)use($check){try{$fn();}catch(Staff\HttpError|InvalidArgumentException $e){$check(true,'Rejected');return;}$check(false,'Expected rejection');};
 $reject(fn()=>$invoke([...$body,'photos'=>array_slice($photos,0,4)]));$reject(fn()=>$invoke([...$body,'photos'=>$photos]));$reject(fn()=>$invoke([...$body,'photos'=>[$photos[0],$photos[1],$photos[2],$photos[3],$photos[0]]]));
 $actor(3);$reject(fn()=>$invoke($body));$actor(1);$invoke($body);$r->getMethod('flushSubmissionOutbox')->invoke($app);
 $row=$sdb->query('SELECT * FROM sub_posts')->fetch();$check((int)$row['current_revision']===1,'First revision missing');$check($row['submitted_by_name']==='Fictional Editor','Submitter must be Editor');$check($row['social_platform']===null,'Website is not a social post');$check((int)$sdb->query('SELECT COUNT(*) FROM sub_post_assets')->fetchColumn()===5,'Five assets');
 $sdb->exec("UPDATE sub_posts SET publish_status='Rejected',rejection_reason='Correct description',version=version+1");
 $invoke([...$body,'action'=>'resubmit_website','version'=>2,'rejectedRevision'=>1,'propertyInfoNote'=>'Corrected details']);$r->getMethod('flushSubmissionOutbox')->invoke($app);
 $row=$sdb->query('SELECT * FROM sub_posts')->fetch();$check((int)$row['current_revision']===2&&$row['property_info_note']==='Corrected details','Resubmission revision missing');$check((int)$sdb->query('SELECT COUNT(*) FROM sub_post_revisions')->fetchColumn()===2,'History preserved');$check((int)$sdb->query('SELECT COUNT(*) FROM sub_post_assets')->fetchColumn()===10,'Revision assets preserved');
 $db->exec("UPDATE mkt_submission_outbox SET status='pending' WHERE revision=1");$r->getMethod('flushSubmissionOutbox')->invoke($app);$check((int)$sdb->query('SELECT current_revision FROM sub_posts')->fetchColumn()===2,'Old replay must not roll back revision');
 $check((int)$sdb->query('SELECT COUNT(*) FROM sub_posts')->fetchColumn()===1,'No duplicate publication');
 $db->exec("USE `$web`");$db->exec(file_get_contents(__DIR__.'/../../public/api/schema.sql'));$db->exec(file_get_contents(__DIR__.'/../database/102-website-submission-map.sql'));
 mkdir($testDir);mkdir($testDir.'/admin');copy(__DIR__.'/../../public/api/admin/submissions.php',$testDir.'/admin/submissions.php');copy(__DIR__.'/../../public/api/submission-photo.php',$testDir.'/submission-photo.php');
 file_put_contents($testDir.'/sitemap-helper.php','<?php function build_and_save_sitemap(){}');
 $bootstrap='<?php define("DB_NAME",'.var_export($web,true).');define("SUBMISSION_DB_HOST","127.0.0.1:3397");define("SUBMISSION_DB_USER","root");define("SUBMISSION_DB_PASS","");define("SUBMISSION_DB_NAME",'.var_export($sub,true).');mysqli_report(MYSQLI_REPORT_OFF);function db(){static $db;return $db??=new mysqli("127.0.0.1","root","",DB_NAME,3397);}function cors(){}function body(){return json_decode(file_get_contents("php://input"),true)??[];}function json_out($data,$status=200){http_response_code($status);header("Content-Type: application/json");echo json_encode($data);exit;}function require_admin(){if(($_SERVER["HTTP_X_FIXTURE_ADMIN"]??"")!=="yes")json_out(["error"=>"Unauthorized"],401);}';
 file_put_contents($testDir.'/bootstrap.php',$bootstrap);
 $socket=stream_socket_server('tcp://127.0.0.1:0');$address=stream_socket_get_name($socket,false);fclose($socket);
 $server=proc_open([PHP_BINARY,'-d','extension_dir='.realpath(__DIR__.'/../../releases/validation/php/ext'),'-d','extension=mysqli','-S',$address,'-t',$testDir],[0=>['pipe','r'],1=>['file',$testDir.'/server.log','a'],2=>['file',$testDir.'/server.log','a']],$pipes);
 $request=function(string $route,?array $body=null,bool $admin=true)use($address){$headers="Content-Type: application/json\r\n".($admin?"X-Fixture-Admin: yes\r\n":"");$context=stream_context_create(['http'=>['method'=>$body===null?'GET':'POST','header'=>$headers,'content'=>$body===null?'':json_encode($body),'ignore_errors'=>true,'timeout'=>5]]);$result=file_get_contents('http://'.$address.'/'.$route,false,$context);preg_match('/\s(\d{3})\s/',$http_response_header[0]??'',$m);return ['status'=>(int)($m[1]??0),'data'=>json_decode($result,true),'raw'=>$result];};
 for($i=0;$i<30;$i++){if(@fsockopen(explode(':',$address)[0],(int)explode(':',$address)[1]))break;usleep(100000);}
 $check($request('submission-photo.php?post=1&revision=2&photo=0',null,false)['status']===401,'Unreviewed photos must remain private');
 $check($request('submission-photo.php?post=1&revision=2&photo=0')['status']===200,'Admin preview allowed');
 $check($request('admin/submissions.php',null,false)['status']===401,'Anonymous review denied');
 $items=$request('admin/submissions.php')['data'];$current=$items[0];$check(count($current['photos'])===5&&$current['revision']===2,'Current revision queue only');
 $check($request('admin/submissions.php',['id'=>1,'version'=>$current['version'],'revision'=>1,'action'=>'approve'])['status']===409,'Stale revision denied');
 $check($request('admin/submissions.php',['id'=>1,'version'=>$current['version'],'revision'=>2,'action'=>'reject','reason'=>''])['status']===422,'Blank rejection denied');
 $check($request('admin/submissions.php',['id'=>1,'version'=>$current['version'],'revision'=>2,'action'=>'approve'])['status']===200,'Approval works');
 $current=$request('admin/submissions.php')['data'][0];$publish=['id'=>1,'version'=>$current['version'],'revision'=>2,'action'=>'publish','price'=>1000,'listing_type'=>'sale'];
 $sdb->exec("CREATE TRIGGER fixture_publish_failure BEFORE UPDATE ON sub_posts FOR EACH ROW BEGIN IF NEW.publish_status='Published' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Fictional delivery failure'; END IF; END");
 $check($request('admin/submissions.php',$publish)['status']===503,'Submission failure after website commit is retryable');
 $check($request('admin/submissions.php',['id'=>1,'version'=>$current['version'],'revision'=>2,'action'=>'reject','reason'=>'Try a different revision'])['status']===409,'A durable website publication must be recovered before any rejection or resubmission');
 $check($sdb->query('SELECT publish_status FROM sub_posts WHERE id=1')->fetchColumn()==='Approved','Blocked rejection preserves recoverable approval');
 $db->exec("USE `$crm`");$reject(fn()=>$invoke([...$body,'action'=>'resubmit_website','version'=>3,'rejectedRevision'=>2]));$db->exec("USE `$web`");
 $sdb->exec('DROP TRIGGER fixture_publish_failure');$check($request('admin/submissions.php',$publish)['status']===200,'Publishing retry recovers');
 $check((int)$db->query('SELECT COUNT(*) FROM website_submission_publications')->fetchColumn()===1,'One website mapping after retry');
 $check($request('submission-photo.php?post=1&revision=2&photo=0',null,false)['status']===200,'Published revision publicly readable');
 $check($request('submission-photo.php?post=1&revision=1&photo=0',null,false)['status']===401,'Rejected old revision remains private');
 echo "$checks publication revision/database/HTTP/privacy/recovery assertions passed.\n";
} finally {if(is_resource($server)){proc_terminate($server);proc_close($server);}if(is_dir($testDir)){foreach(glob($testDir.'/admin/*') as $f)unlink($f);rmdir($testDir.'/admin');foreach(glob($testDir.'/*') as $f)if(is_file($f))unlink($f);rmdir($testDir);}foreach([$sub,$crm,$web] as $name){if(!preg_match('/^attaie_pub_test_[a-f0-9]{12}(?:_sub|_web)?$/D',$name))throw new RuntimeException('Unsafe fixture cleanup');$db->exec("DROP DATABASE IF EXISTS `$name`");}}
