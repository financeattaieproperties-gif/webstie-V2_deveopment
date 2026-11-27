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
    if ($agency['verification_status']!=='pending') {
        json_out(['error'=>'Contact support to update a reviewed agency'],409);
    }
    try {
        $fields=agency_representative_fields(body());
    } catch (InvalidArgumentException $e) {
        json_out(['error'=>$e->getMessage()],422);
    }
    // Client-selected contact method must already be verified on the account.
    if (!agency_verified_contact_available($owner,$fields['representative_contact_method'])) {
        json_out(['error'=>'Verify your selected contact method first'],403);
    }
    $stmt=$db->prepare("UPDATE customer_agencies SET representative_name=?,representative_position=?,representative_contact_method=?,business_email=?,business_phone_e164=?,business_contact_reviewed_at=NULL,business_contact_reviewed_by=NULL,version=version+1 WHERE id=? AND owner_customer_id=? AND verification_status='pending'");
    if (!$stmt) throw new RuntimeException('Agency update unavailable');
    $stmt->bind_param('sssssii',$fields['representative_name'],$fields['representative_position'],$fields['representative_contact_method'],$fields['business_email'],$fields['business_phone_e164'],$agency['id'],$customerId);
    if (!$stmt->execute()) throw new RuntimeException('Agency update failed');
    if ($stmt->affected_rows!==1) json_out(['error'=>'Agency status changed; refresh and retry'],409);
    json_out(['success'=>true,'verification_status'=>'pending']);
} catch (Throwable $e) {
    error_log('Agency representative verification request failed');
    json_out(['error'=>'Agency request temporarily unavailable'],503);
}
