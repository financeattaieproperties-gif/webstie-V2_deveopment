<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'||getenv('STAFF_LOCAL_TEST')!=='1')throw new RuntimeException('Isolated fictional fixture only.');
$db=new PDO('mysql:host=127.0.0.1;port=3397;charset=utf8mb4','root','',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$name='attaie_branch_migration_test_'.bin2hex(random_bytes(6));
try{
 $db->exec("CREATE DATABASE `$name` CHARACTER SET utf8mb4; USE `$name`");if($db->query('SELECT DATABASE()')->fetchColumn()!==$name)throw new RuntimeException('Wrong fixture target.');
 foreach(['001-core.sql','010-callcenter.sql','020-inventory.sql','030-sales-crm.sql','040-hr-finance.sql','050-marketing-production.sql','060-engineering.sql','090-role-migration.sql','095-retire-finance-assistant.sql','100-dashboard-completion.sql'] as $file)$db->exec(file_get_contents(__DIR__.'/../database/'.$file));
 $db->exec("INSERT INTO core_roles VALUES ('hr_manager','management','Legacy HR');INSERT INTO core_users(id,firebase_uid,name,username,role) VALUES (1,'legacy-owner','Fictional Owner','owner@example.test','manager'),(2,'legacy-manager','Fictional Manager','manager@example.test','hr_manager')");
 $sql=file_get_contents(__DIR__.'/../database/110-ceo-manager-branch-model.sql');$db->exec($sql);
 $first=$db->query('SELECT id,firebase_uid,role,active,auth_version FROM core_users ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
 if($first[0]['role']!=='ceo'||$first[1]['role']!=='manager'||(int)$first[1]['active']!==0)throw new RuntimeException('Legacy migration did not fail closed.');
 $db->exec($sql);$second=$db->query('SELECT id,firebase_uid,role,active,auth_version FROM core_users ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
 if($first!==$second)throw new RuntimeException('Second import remapped identities.');
 if((int)$db->query("SELECT COUNT(*) FROM core_migration_ledger WHERE migration_key='ceo_manager_branch_model_v1'")->fetchColumn()!==1)throw new RuntimeException('Migration marker mismatch.');
 echo "Legacy role mapping preserved and repeated import unchanged.\n";
}finally{$db->exec("DROP DATABASE IF EXISTS `$name`");}
