<?php
declare(strict_types=1);
if (PHP_SAPI!=='cli' || getenv('STAFF_LOCAL_TEST')!=='1') throw new RuntimeException('Local fixtures only.');
$file=realpath($argv[1] ?? '');
if (!$file || !str_starts_with(str_replace('\\','/',$file),rtrim(str_replace('\\','/',realpath(sys_get_temp_dir())),'/').'/')) throw new RuntimeException('A local temporary fixture dump is required.');
$db=new PDO('mysql:host=127.0.0.1;port=3397','root','',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$target='attaie_staff_restore_'.bin2hex(random_bytes(4));
$db->exec("CREATE DATABASE `$target` CHARACTER SET utf8mb4");$db->exec("USE `$target`");$db->exec(file_get_contents($file));
$config=require sys_get_temp_dir().'/attaie-staff-v2-test/config.php';
preg_match('/dbname=([^;]+)/',$config['dsn'],$databaseMatch); $originalDatabase=$databaseMatch[1];
foreach(['core_users','cc_customers','cc_leads','cc_followup_tasks','core_management_tasks','core_audit_events'] as $table) {
 $original=$db->query("SELECT COUNT(*) FROM `$originalDatabase`.`$table`")->fetchColumn();
 $restored=$db->query("SELECT COUNT(*) FROM `$target`.`$table`")->fetchColumn();
 if($original!==$restored)throw new RuntimeException('Restore count mismatch.');
}
echo "Isolated backup/restore passed for six core staff tables. No V1 database was accessed.\n";
