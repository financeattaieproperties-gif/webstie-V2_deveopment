<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli' || getenv('STAFF_LOCAL_TEST')!=='1') throw new RuntimeException('Local fixtures only.');
$config=require sys_get_temp_dir().'/attaie-staff-v2-test/config.php';
$db=new PDO($config['dsn'],$config['database_user'],$config['database_password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$mode=$argv[1] ?? ''; $directory=$argv[2] ?? '';
if ($mode==='reset') { $db->exec('UPDATE core_users SET active=1 WHERE id=4'); $db->exec("UPDATE core_management_tasks SET status='cancelled' WHERE assignee_id=4 AND title='Concurrency fixture'"); echo "Fixture restored.\n"; exit; }
$real=realpath($directory);
if (!$real || !str_starts_with(str_replace('\\','/',$real),rtrim(str_replace('\\','/',realpath(sys_get_temp_dir())),'/').'/')) throw new RuntimeException('Temporary signal directory required.');
$db->beginTransaction();
$db->query('SELECT id FROM core_users WHERE id=4 FOR UPDATE')->fetch();
if ($mode==='deactivate') $db->exec('UPDATE core_users SET active=0,auth_version=auth_version+1 WHERE id=4');
elseif ($mode==='assign') $db->exec("INSERT INTO core_management_tasks(title,instructions,priority,assignee_id,assigned_by,deadline_at) VALUES ('Concurrency fixture','Local fixture only','normal',4,3,'2099-01-01 00:00:00')");
else throw new RuntimeException('Unknown fixture mode.');
file_put_contents($real.'/ready','1');
$start=microtime(true);
while (!is_file($real.'/release')) { if (microtime(true)-$start>10) throw new RuntimeException('Signal timed out.'); usleep(10000); }
$db->commit();
