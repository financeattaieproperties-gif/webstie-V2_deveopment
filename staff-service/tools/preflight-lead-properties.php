<?php
declare(strict_types=1);
require_once __DIR__.'/../src/Domain.php';

/** Read-only report. Never merge customers, delete leads, backfill claims or activate enforcement. */
function lead_property_preflight(PDO $db): array {
    $issues=[];$claims=[];$phones=[];$customers=[];
    foreach ($db->query('SELECT id,phone FROM cc_customers ORDER BY id')->fetchAll(PDO::FETCH_ASSOC) as $row) {
        try { $phone=Staff\Domain::phone($row['phone']); }
        catch (InvalidArgumentException $error) { $issues[]=['type'=>'invalid_customer_phone','customerId'=>(int)$row['id']];continue; }
        $customers[(int)$row['id']]=$phone;$phones[$phone][]=(int)$row['id'];
    }
    $registry=[];
    foreach ($db->query('SELECT phone,customer_id FROM crm_phone_registry')->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $registry[$row['phone']]=(int)$row['customer_id'];
    }
    foreach ($phones as $phone=>$ids) {
        if (count($ids)>1) $issues[]=['type'=>'ambiguous_customer','customerIds'=>$ids];
        elseif (($registry[$phone] ?? null)!==$ids[0]) $issues[]=['type'=>'registry_mismatch','customerIds'=>$ids];
    }
    $projects=[];$units=[];
    foreach ($db->query('SELECT id FROM inv_projects')->fetchAll(PDO::FETCH_ASSOC) as $row) $projects[(int)$row['id']]=true;
    foreach ($db->query('SELECT id,project_id FROM inv_apartments')->fetchAll(PDO::FETCH_ASSOC) as $row) $units[(int)$row['id']]=(int)$row['project_id'];
    $pairs=[];
    foreach ($db->query('SELECT id,customer_id,phone,status,project_id,apartment_id,property_kind,property_id FROM cc_leads ORDER BY id')->fetchAll(PDO::FETCH_ASSOC) as $lead) {
        if ($lead['status']==='draft') continue;
        $id=(int)$lead['id'];$customerId=(int)$lead['customer_id'];
        if (!isset($customers[$customerId])) {$issues[]=['type'=>'missing_customer','leadIds'=>[$id]];continue;}
        try {$phone=Staff\Domain::phone($lead['phone']);}
        catch (InvalidArgumentException $error) {$issues[]=['type'=>'invalid_lead_phone','leadIds'=>[$id]];continue;}
        if ($customers[$customerId]!==$phone) {$issues[]=['type'=>'customer_phone_mismatch','leadIds'=>[$id]];continue;}
        $kind=$lead['property_kind'];$propertyId=(int)$lead['property_id'];
        if ($kind===null && $propertyId===0) {
            if ($lead['apartment_id']) {$kind='unit';$propertyId=(int)$lead['apartment_id'];}
            elseif ($lead['project_id']) {$kind='project';$propertyId=(int)$lead['project_id'];}
        }
        if (!in_array($kind,['project','unit'],true) || !$propertyId) {$issues[]=['type'=>'missing_property','leadIds'=>[$id]];continue;}
        if (($kind==='project' && !isset($projects[$propertyId])) || ($kind==='unit' && !isset($units[$propertyId]))) {$issues[]=['type'=>'invalid_property','leadIds'=>[$id]];continue;}
        if (($kind==='unit' && $lead['project_id'] && (int)$lead['project_id']!==$units[$propertyId]) || ($kind==='unit' && $lead['apartment_id'] && (int)$lead['apartment_id']!==$propertyId) || ($kind==='project' && ($lead['apartment_id'] || ($lead['project_id'] && (int)$lead['project_id']!==$propertyId)))) {$issues[]=['type'=>'inconsistent_property','leadIds'=>[$id]];continue;}
        $key=$phone . ':' . $kind . ':' . $propertyId;
        $pairs[$key][]=$id;
        $claims[]=['customerId'=>$registry[$phone] ?? $customerId,'kind'=>$kind,'propertyId'=>$propertyId,'leadId'=>$id];
    }
    foreach ($pairs as $leadIds) if(count($leadIds)>1) $issues[]=['type'=>'duplicate_pair','leadIds'=>$leadIds];
    return ['ready'=>count($issues)===0,'issues'=>$issues,'claims'=>$claims];
}

if (PHP_SAPI==='cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '')===__FILE__) {
    try {
        $file=getenv('STAFF_CONFIG_FILE');
        if (!$file || !is_file($file)) throw new RuntimeException('Private staff configuration required');
        $config=require $file;
        $db=new PDO($config['dsn'],$config['database_user'],$config['database_password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_EMULATE_PREPARES=>false,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
        $report=lead_property_preflight($db);
        echo json_encode($report,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR).PHP_EOL;
        exit($report['ready']?0:2);
    } catch (Throwable $error) {fwrite(STDERR,"Lead property preflight unavailable. Verify the private V2 configuration and migration.\n");exit(1);}
}
