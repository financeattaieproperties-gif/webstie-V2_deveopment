<?php
declare(strict_types=1);
/** Authenticated agency owner may edit the business profile only in revision. */
require_once __DIR__.'/../bootstrap.php';
require_once __DIR__.'/../customer-cors.php';
require_once __DIR__.'/../customer-identity.php';
require_once __DIR__.'/../customer-firebase-auth.php';
require_once __DIR__.'/../customer-auth-context.php';
require_once __DIR__.'/../customer-agency-policy.php';
customer_api_cors();
header('Cache-Control: no-store, private');
if (($_SERVER['REQUEST_METHOD']??'')!=='POST') json_out(['error'=>'POST only'],405);
$body=body();
try {
    if (!is_int($body['version']??null) || $body['version']<1) throw new InvalidArgumentException('Agency version required');
    $version=$body['version'];
    unset($body['version']);
    $profile=customer_agency_application_fields($body);
} catch (InvalidArgumentException $e) {
    json_out(['error'=>$e->getMessage()],422);
}
try {
    $db=db();
    $owner=require_customer_context($db);
    $customerId=(int)$owner['id'];
    $name=$profile['legal_name'];
    $public=$profile['public_name'];
    $registration=$profile['registration_reference'] ?: null;
    $description=$profile['description'] ?: null;
    $db->begin_transaction();
    try {
        $lock=$db->prepare("SELECT id,review_round FROM customer_agencies WHERE owner_customer_id=? AND version=? AND verification_status='revision' AND operational_status='active' FOR UPDATE");
        if (!$lock) throw new RuntimeException('Agency lock unavailable');
        $lock->bind_param('ii',$customerId,$version);
        if (!$lock->execute()) throw new RuntimeException('Agency lock failed');
        $agency=$lock->get_result()->fetch_assoc();
        if (!$agency) {
            $db->rollback();
            json_out(['error'=>'Agency review state changed; refresh and retry'],409);
        }
        $stmt=$db->prepare("UPDATE customer_agencies SET legal_name=?,public_name=?,registration_reference=?,description=?,
            business_contact_reviewed_at=NULL,business_contact_reviewed_by=NULL,version=version+1
            WHERE id=? AND version=? AND verification_status='revision'");
        if (!$stmt) throw new RuntimeException('Agency profile update unavailable');
        $agencyId=(int)$agency['id'];
        $stmt->bind_param('ssssii',$name,$public,$registration,$description,$agencyId,$version);
        if (!$stmt->execute() || $stmt->affected_rows!==1) throw new RuntimeException('Agency profile update conflict');
        $audit=$db->prepare('INSERT INTO customer_agency_verification_events (agency_id,previous_status,next_status,reason,review_round) VALUES (?,?,?,?,?)');
        if (!$audit) throw new RuntimeException('Agency profile audit unavailable');
        $state='revision';
        $reason='Owner updated agency business profile (version '.$version.' to '.($version+1).')';
        $round=(int)$agency['review_round'];
        $audit->bind_param('isssi',$agencyId,$state,$state,$reason,$round);
        if (!$audit->execute()) throw new RuntimeException('Agency profile audit failed');
        $db->commit();
    } catch (Throwable $e) {
        $db->rollback();
        throw $e;
    }
    json_out(['success'=>true,'version'=>$version+1,'verification_status'=>'revision']);
} catch (Throwable $e) {
    error_log('Agency profile revision failed');
    json_out(['error'=>'Unable to update agency profile'],503);
}
