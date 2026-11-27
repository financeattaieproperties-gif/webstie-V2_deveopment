<?php
declare(strict_types=1);

/** Owner-only representative verification details. Does not approve any agency. */
require_once __DIR__.'/../bootstrap.php';
require_once __DIR__.'/../customer-cors.php';
require_once __DIR__.'/../customer-identity.php';
require_once __DIR__.'/../customer-firebase-auth.php';
require_once __DIR__.'/../customer-auth-context.php';
require_once __DIR__.'/../customer-agency-verification-policy.php';
customer_api_cors();
header('Cache-Control: private, no-store');
$method=strtoupper($_SERVER['REQUEST_METHOD']??'GET');
if (!in_array($method,['GET','POST'],true)) json_out(['error'=>'Method not allowed'],405);
try {
    $db=db();
    $owner=require_customer_context($db);
    $customerId=(int)$owner['id'];
    $stmt=$db->prepare('SELECT id,representative_name,representative_position,representative_contact_method,business_email,business_phone_e164,verification_status,version FROM customer_agencies WHERE owner_customer_id=? LIMIT 1');
    if (!$stmt) throw new RuntimeException('Agency database unavailable');
    $stmt->bind_param('i',$customerId);
    if (!$stmt->execute()) throw new RuntimeException('Agency lookup failed');
    $agency=$stmt->get_result()->fetch_assoc();
    if (!$agency) json_out(['error'=>'Agency application required'],404);
    if ($method==='GET') json_out(['agency'=>[
        'id'=>(int)$agency['id'],
        'representative_name'=>$agency['representative_name'],
        'representative_position'=>$agency['representative_position'],
        'representative_contact_method'=>$agency['representative_contact_method'],
        'business_email'=>$agency['business_email'],
        'business_phone_e164'=>$agency['business_phone_e164'],
        'verification_status'=>$agency['verification_status'],
    ]]);
    $input=body();
    $version=$input['version']??null;
    if (!is_int($version) || $version<1) {
        json_out(['error'=>'Current agency version required'],422);
    }
    unset($input['version']);
    try {
        $fields=agency_representative_fields($input);
    } catch (InvalidArgumentException $e) {
        json_out(['error'=>$e->getMessage()],422);
    }
    if (!agency_verified_contact_available($owner,$fields['representative_contact_method'])) {
        json_out(['error'=>'Verify your selected contact method first'],403);
    }
    $db->begin_transaction();
    try {
        $lock=$db->prepare('SELECT id,verification_status,review_round FROM customer_agencies WHERE owner_customer_id=? AND version=? FOR UPDATE');
        if (!$lock) throw new RuntimeException('Agency lock unavailable');
        $lock->bind_param('ii',$customerId,$version);
        if (!$lock->execute()) throw new RuntimeException('Agency lock failed');
        $current=$lock->get_result()->fetch_assoc();
        if (!$current || !in_array($current['verification_status'],['pending','revision'],true)) {
            $db->rollback();
            json_out(['error'=>'Agency changed or already reviewed; refresh and retry'],409);
        }
        $agencyId=(int)$current['id'];
        $stmt=$db->prepare("UPDATE customer_agencies SET representative_name=?,representative_position=?,
            representative_contact_method=?,business_email=?,business_phone_e164=?,
            business_contact_reviewed_at=NULL,business_contact_reviewed_by=NULL,version=version+1
            WHERE id=? AND version=? AND verification_status IN ('pending','revision')");
        if (!$stmt) throw new RuntimeException('Agency update unavailable');
        $stmt->bind_param('sssssii',$fields['representative_name'],$fields['representative_position'],
            $fields['representative_contact_method'],$fields['business_email'],$fields['business_phone_e164'],
            $agencyId,$version);
        if (!$stmt->execute() || $stmt->affected_rows!==1) throw new RuntimeException('Agency update conflict');
        $audit=$db->prepare('INSERT INTO customer_agency_verification_events (agency_id,previous_status,next_status,reason,review_round) VALUES (?,?,?,?,?)');
        if (!$audit) throw new RuntimeException('Agency contact audit unavailable');
        $state=$current['verification_status'];
        $reason='Owner updated representative and business contact details (version '.$version.' to '.($version+1).')';
        $round=(int)$current['review_round'];
        $audit->bind_param('isssi',$agencyId,$state,$state,$reason,$round);
        if (!$audit->execute()) throw new RuntimeException('Agency contact audit failed');
        $db->commit();
    } catch (Throwable $e) {
        $db->rollback();
        throw $e;
    }
    json_out(['success'=>true,'verification_status'=>$current['verification_status'],'version'=>$version+1]);
} catch (Throwable $e) {
    error_log('Agency representative verification request failed');
    json_out(['error'=>'Agency request temporarily unavailable'],503);
}
