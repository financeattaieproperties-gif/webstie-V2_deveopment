<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli' || getenv('STAFF_LOCAL_TEST') !== '1') throw new RuntimeException('Fictional local test only');
require_once __DIR__ . '/../src/Domain.php';
$db = new PDO('mysql:host=127.0.0.1;port=3397;charset=utf8mb4','root','',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_EMULATE_PREPARES=>false,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
$name = 'attaie_v2_test_' . bin2hex(random_bytes(10));
if (!preg_match('/^attaie_v2_test_[a-f0-9]{20}$/D',$name)) throw new RuntimeException('Invalid fixture');
$db->exec("CREATE DATABASE `$name` CHARACTER SET utf8mb4");
$checks=0;
$check=function(bool $condition,string $reason)use(&$checks){$checks++;if(!$condition)throw new RuntimeException($reason);};
try {
    $db->exec("USE `$name`");
    $check($db->query('SELECT DATABASE()')->fetchColumn()===$name,'Wrong fixture target');
    foreach (['001-core.sql','010-callcenter.sql','020-inventory.sql','030-sales-crm.sql','040-hr-finance.sql','050-marketing-production.sql','060-engineering.sql','090-role-migration.sql','095-retire-finance-assistant.sql','100-dashboard-completion.sql'] as $file) $db->exec(file_get_contents(__DIR__.'/../database/'.$file));
    $migration=__DIR__.'/../database/103-customer-property-leads.sql';
    $check(is_file($migration),'Canonical customer/property migration is missing');
    $db->exec(file_get_contents($migration));
    require_once __DIR__.'/../tools/preflight-lead-properties.php';
    $check(lead_property_preflight($db)['ready']===true,'Empty fixture must be ready');
    $db->exec("INSERT INTO core_branches(id,code,name) VALUES (1,'FIXTURE','Fictional Branch')");
    $db->exec("INSERT INTO core_users(id,firebase_uid,name,username,role,branch_id) VALUES (1,'fixture-sales','Fictional Sales','fixture@example.test','sales',1)");
    $db->exec("INSERT INTO cc_customers(id,branch_id,name,phone,created_at) VALUES (1,1,'Fictional Customer','93700000000',UTC_TIMESTAMP())");
    $db->exec("INSERT INTO crm_phone_registry(phone,customer_id) VALUES ('+93700000000',1)");
    $db->exec("INSERT INTO inv_projects(id,branch_id,code,name,location,description,created_by) VALUES (1,1,'FX-1','Fictional Building','Fictional Location','Fixture',1)");
    $db->exec("INSERT INTO inv_apartments(id,project_id,unit_number,serial_number,floor,area_sqm,direction,boundary_north,boundary_south,boundary_east,boundary_west,price_per_sqm,total_price,currency,status) VALUES (1,1,'A-1','FX-A-1',1,100,'N','N','S','E','W',10,1000,'USD','available'),(2,1,'A-2','FX-A-2',1,100,'N','N','S','E','W',10,1000,'USD','available')");
    $lead=$db->prepare("INSERT INTO cc_leads(branch_id,serial,customer_id,customer_name,phone,requirements,origin_agent_id,assignee_id,status,call_at,source,project_id,apartment_id) VALUES (1,?,1,'Fictional Customer',?,'Fixture',1,1,'active',UTC_TIMESTAMP(),'manual',1,?)");
    $lead->execute(['FX-L1','0700000000',1]);$lead->execute(['FX-L2','+93 700 000 000',2]);$lead->execute(['FX-L3','93700000000',null]);
    $report=lead_property_preflight($db);$check($report['ready']===true,'Two units and project-level interest must remain distinct');
    $check(count($report['claims'])===3,'Three independent property claims expected');
    $lead->execute(['FX-L4','0700000000',1]);
    $before=$db->query('SELECT * FROM cc_leads ORDER BY id')->fetchAll();
    $report=lead_property_preflight($db);
    $check($report['ready']===false,'Historical duplicate pair must block activation');
    $check(in_array('duplicate_pair',array_column($report['issues'],'type'),true),'Duplicate report must identify resolution needed');
    $check($db->query('SELECT * FROM cc_leads ORDER BY id')->fetchAll()===$before,'Preflight must not mutate leads');
    $db->exec("INSERT INTO cc_customers(id,branch_id,name,phone,created_at) VALUES (2,1,'Legacy fictional duplicate','0700000000',UTC_TIMESTAMP())");
    $report=lead_property_preflight($db);$check(in_array('ambiguous_customer',array_column($report['issues'],'type'),true),'Equivalent historical phones must not bypass canonical identity');
    $db->exec("UPDATE cc_leads SET project_id=NULL,apartment_id=NULL WHERE serial='FX-L3'");
    $report=lead_property_preflight($db);$check(in_array('missing_property',array_column($report['issues'],'type'),true),'Unqualified active leads must be reported');
    $check((int)$db->query('SELECT COUNT(*) FROM cc_leads')->fetchColumn()===4,'All legacy leads must survive');
    $check((int)$db->query('SELECT COUNT(*) FROM crm_customer_property_leads')->fetchColumn()===0,'Read-only preflight must not enable claims');
    $check(is_file(__DIR__.'/../src/LeadPropertyClaims.php'),'Shared resolver and atomic claim service missing');
    require_once __DIR__.'/../src/App.php';
    require_once __DIR__.'/../src/LeadPropertyClaims.php';
    $service=new class($db) {
        use Staff\LeadPropertyClaims;
        private array $user=['id'=>1,'role'=>'callcenter','branch_id'=>1];
        public function __construct(private PDO $db) {}
        private function uid():int{return 1;}
        private function one(string $sql,array $values=[]):?array{$q=$this->db->prepare($sql);$q->execute($values);return $q->fetch(PDO::FETCH_ASSOC)?:null;}
        private function execute(string $sql,array $values=[]):void{$q=$this->db->prepare($sql);$q->execute($values);}
        public function resolve(array $body):array{return $this->resolveLeadProperty($body);}
        public function claim(int $customer,array $property,int $lead):void{$this->claimLeadProperty($customer,$property,$lead);}
    };
    $unit=$service->resolve(['property'=>['kind'=>'unit','id'=>1]]);
    $check($unit===['kind'=>'unit','id'=>1,'projectId'=>1,'apartmentId'=>1],'Unit resolver must derive project identity');
    $check($service->resolve(['property'=>['kind'=>'project','id'=>1]])===['kind'=>'project','id'=>1,'projectId'=>1,'apartmentId'=>null],'Project interest is separate from a unit');
    foreach ([[],['property'=>['kind'=>'unit','id'=>1],'projectId'=>999],['property'=>['kind'=>'project','id'=>1],'apartmentId'=>1]] as $invalid) {
        try {$service->resolve($invalid);$check(false,'Invalid or inconsistent property must not resolve');}
        catch(InvalidArgumentException $error){$check(true,'Property input rejected');}
    }
    $db->beginTransaction();$service->claim(1,$unit,1);$db->commit();
    $db->beginTransaction();
    try {$service->claim(1,$unit,4);$check(false,'Duplicate pair must be rejected');}
    catch(Staff\HttpError $error){$check($error->status===409,'Duplicate must return generic conflict');}
    finally {$db->rollBack();}
    $db->beginTransaction();$service->claim(1,$service->resolve(['property'=>['kind'=>'unit','id'=>2]]),1);$db->commit();
    $check((int)$db->query('SELECT property_id FROM crm_customer_property_leads WHERE lead_id=1')->fetchColumn()===2,'Property change atomically replaces the same lead claim');
    $db->exec('UPDATE crm_lead_property_readiness SET enabled=0');
    $db->beginTransaction();
    try {$service->claim(1,$unit,4);$check(false,'Unreviewed migration must remain blocked');}
    catch(Staff\HttpError $error){$check($error->status===503,'Disabled claims must fail closed');}
    finally {$db->rollBack();}
    $applyBackfill=function()use($db){
        $sql=file_get_contents(__DIR__.'/../database/104-backfill-customer-property-leads.sql');
        $sql=preg_replace('/^DELIMITER .*$/m','',$sql);
        try {foreach(explode('$$',$sql) as $statement)if(trim($statement)!=='')$db->exec($statement);}
        finally {$db->exec('DROP PROCEDURE IF EXISTS v2_backfill_lead_property_claims');}
    };
    $before=$db->query('SELECT * FROM cc_leads ORDER BY id')->fetchAll();
    try {$applyBackfill();$check(false,'Unresolved history must block backfill');}
    catch(PDOException $error){$check($error->getCode()==='45000','Historical guard must report an actionable SQLSTATE');}
    $check($db->query('SELECT * FROM cc_leads ORDER BY id')->fetchAll()===$before,'Failed backfill must preserve every historical row');
    $check((int)$db->query('SELECT enabled FROM crm_lead_property_readiness')->fetchColumn()===0,'Failed backfill must not enable claims');
    // Explicit owner-resolution stand-in on disposable fictional records only. No history is deleted.
    $db->exec('DELETE FROM crm_customer_property_leads');
    $db->exec("UPDATE cc_customers SET phone='+93700000000' WHERE id=1");
    $db->exec("UPDATE cc_customers SET phone='+93700000001' WHERE id=2");
    $db->exec("INSERT INTO crm_phone_registry(phone,customer_id) VALUES ('+93700000001',2)");
    $db->exec("UPDATE cc_leads SET phone='+93700000000',project_id=1 WHERE customer_id=1");
    $db->exec("INSERT INTO inv_apartments(id,project_id,unit_number,serial_number,floor,area_sqm,direction,boundary_north,boundary_south,boundary_east,boundary_west,price_per_sqm,total_price,currency,status) VALUES (3,1,'A-3','FX-A-3',1,100,'N','N','S','E','W',10,1000,'USD','available')");
    $db->exec("UPDATE cc_leads SET apartment_id=3 WHERE serial='FX-L4'");
    $check(lead_property_preflight($db)['ready']===true,'Reviewed fictional resolutions must clear the report');
    $applyBackfill();
    $check((int)$db->query('SELECT enabled FROM crm_lead_property_readiness')->fetchColumn()===1,'Successful guarded backfill must activate enforcement');
    $check((int)$db->query('SELECT COUNT(*) FROM crm_customer_property_leads')->fetchColumn()===4,'Every existing qualified lead must have one claim');
    $check((int)$db->query('SELECT COUNT(*) FROM cc_leads')->fetchColumn()===4,'Backfill must not delete historical leads');
    echo "$checks canonical lead migration/preflight assertions passed ($name).\n";
} finally { $db->exec("DROP DATABASE `$name`"); }
