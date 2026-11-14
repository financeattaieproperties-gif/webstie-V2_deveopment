<?php
declare(strict_types=1);
if (PHP_SAPI!=='cli'||getenv('STAFF_LOCAL_TEST')!=='1') throw new RuntimeException('Isolated local fixture only.');
$release=realpath($argv[1]??'');
if (!$release||!is_file($release.'/manifest.json')) throw new RuntimeException('Prepared release required.');
$db=new PDO('mysql:host=127.0.0.1;port=3397;charset=utf8mb4','root','',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$names=[];$checks=0;
$check=function(bool $value,string $message)use(&$checks){if(!$value)throw new RuntimeException($message);$checks++;};
try {
 foreach(['website','internal-crm','submissions'] as $i=>$kind){
  $name='attaie_v2_package_'.bin2hex(random_bytes(8));$names[]=$name;
  $db->exec("CREATE DATABASE `$name` CHARACTER SET utf8mb4");$db->exec("USE `$name`");
  $check($db->query('SELECT DATABASE()')->fetchColumn()===$name,'Wrong fixture target');
  $db->exec(file_get_contents($release.'/database/fresh/0'.($i+1).'-'.$kind.'.sql'));
  if($kind==='website'){
   foreach(['projects','properties','project_units','leads','admin_users'] as $table)$check((int)$db->query("SELECT COUNT(*) FROM `$table`")->fetchColumn()===0,'Fresh website contains records');
   $check((int)$db->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='website_inquiry_events'")->fetchColumn()===1,'Missing inquiries');
   $check((int)$db->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name LIKE 'core_%'")->fetchColumn()===0,'CRM leaked into website');
  }elseif($kind==='internal-crm'){
   foreach(['core_users','core_branches','inv_projects','inv_apartments','cc_leads'] as $table)$check((int)$db->query("SELECT COUNT(*) FROM `$table`")->fetchColumn()===0,'Fresh CRM contains records');
   $check((int)$db->query('SELECT enabled FROM crm_lead_property_readiness WHERE id=1')->fetchColumn()===1,'Fresh claim activation missing');
   $check((int)$db->query('SELECT COUNT(*) FROM core_roles')->fetchColumn()===12,'Canonical role catalog incomplete');
   $check((int)$db->query("SELECT COUNT(*) FROM core_role_permissions WHERE permission_code='core.staff.manage' AND role_code<>'ceo'")->fetchColumn()===0,'Provisioning authority incorrect');
   $check((int)$db->query("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='mkt_production_entries' AND column_name='website_revision'")->fetchColumn()===1,'Publication revision absent');
  }else{
   $check((int)$db->query('SELECT COUNT(*) FROM sub_posts')->fetchColumn()===0,'Submission catalog not empty');
   $check((int)$db->query('SELECT COUNT(*) FROM sub_post_revisions')->fetchColumn()===0,'Revision catalog not empty');
   $check((int)$db->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name LIKE 'core_%'")->fetchColumn()===0,'CRM leaked into bridge');
  }
 }
 echo "$checks packaged three-database fresh-import assertions passed; fictional databases removed.\n";
}finally{foreach($names as $name){if(!preg_match('/^attaie_v2_package_[a-f0-9]{16}$/D',$name))throw new RuntimeException('Unsafe fixture cleanup');$db->exec("DROP DATABASE `$name`");}}
