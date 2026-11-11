<?php
declare(strict_types=1);
if (PHP_SAPI!=='cli' || getenv('STAFF_LOCAL_TEST')!=='1') throw new RuntimeException('Local fictional fixtures only.');
$db=new PDO('mysql:host=127.0.0.1;port=3397;charset=utf8mb4','root','',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$name='attaie_staff_v2_'.bin2hex(random_bytes(4));
$db->exec("CREATE DATABASE `$name` CHARACTER SET utf8mb4"); $db->exec("USE `$name`");
foreach(['001-core.sql','010-callcenter.sql'] as $file) $db->exec(file_get_contents(__DIR__.'/../database/'.$file));
$users=[[1,'Call Center Fixture','agent','callcenter'],[2,'Sales Fixture','sales','sales'],[3,'CEO Fixture','owner','ceo'],[4,'Other Agent Fixture','other','callcenter'],[5,'Customer Fixture','customer','customer'],[6,'Finance Fixture','finance','finance_manager']];
$stmt=$db->prepare('INSERT INTO core_users(id,name,username,firebase_uid,role) VALUES (?,?,?,?,?)');
foreach($users as [$id,$label,$username,$role]) $stmt->execute([$id,$label,$username.'@example.test','fixture-'.$username,$role]);
$directory=sys_get_temp_dir().'/attaie-staff-v2-test';
if (!is_dir($directory)) mkdir($directory,0700,true);
if (!is_dir($directory.'/sessions')) mkdir($directory.'/sessions',0700,true);
$config=['dsn'=>"mysql:host=127.0.0.1;port=3397;dbname=$name;charset=utf8mb4",'database_user'=>'root','database_password'=>'','origin'=>'http://127.0.0.1:5175','session_directory'=>$directory.'/sessions','allow_local_http'=>true,'firebase_project_id'=>'fixture-project','firebase_api_key'=>'fixture-key'];
file_put_contents($directory.'/config.php','<?php return '.var_export($config,true).';');
$key=openssl_pkey_new(['private_key_bits'=>2048,'private_key_type'=>OPENSSL_KEYTYPE_RSA,'config'=>__DIR__.'/openssl.cnf']);
file_put_contents($directory.'/public.pem',openssl_pkey_get_details($key)['key']);
$encode=fn($v)=>rtrim(strtr(base64_encode(json_encode($v)),'+/','-_'),'=');
$tokens=[];
foreach($users as [$id,$label,$username,$role]) {
 $raw=$encode(['alg'=>'RS256','kid'=>'fixture-key']).'.'.$encode(['aud'=>'fixture-project','iss'=>'https://securetoken.google.com/fixture-project','sub'=>'fixture-'.$username,'iat'=>time()-5,'auth_time'=>time()-10,'exp'=>time()+3600]);
 openssl_sign($raw,$signature,$key,OPENSSL_ALGO_SHA256); $tokens[$username]=$raw.'.'.rtrim(strtr(base64_encode($signature),'+/','-_'),'=');
}
file_put_contents($directory.'/tokens.json',json_encode($tokens));
// Prove a later module creates tables/rows without changing existing schema or records.
$snapshot=function()use($db){$result=[];foreach($db->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN) as $table){$result[$table]=[$db->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_NUM)[1],$db->query("SELECT * FROM `$table`")->fetchAll(PDO::FETCH_ASSOC)];}return $result;};
$before=$snapshot();
$db->exec('CREATE TABLE fixture_future_module (id INT PRIMARY KEY, user_id INT UNSIGNED NOT NULL, FOREIGN KEY(user_id) REFERENCES core_users(id)) ENGINE=InnoDB');
$db->exec("INSERT INTO core_modules VALUES ('fixture_future','Future module fixture',UTC_TIMESTAMP())");
$after=$snapshot();
foreach($before as $table=>$value) {
 if($value[0]!==$after[$table][0]) throw new RuntimeException('Module altered prior schema: '.$table);
 if($table==='core_modules') { if(array_slice($after[$table][1],0,2)!==$value[1]) throw new RuntimeException('Existing registry rows changed.'); }
 elseif($value[1]!==$after[$table][1]) throw new RuntimeException('Module altered prior data: '.$table);
}
echo "Created NEW fictional $name; core + callcenter imports and additive module isolation passed.\n";
