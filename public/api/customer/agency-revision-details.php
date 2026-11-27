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
    $stmt=$db->prepare("UPDATE customer_agencies SET legal_name=?,public_name=?,registration_reference=?,description=?,
        business_contact_reviewed_at=NULL,business_contact_reviewed_by=NULL,version=version+1
        WHERE owner_customer_id=? AND version=? AND verification_status='revision' AND operational_status='active'");
    if (!$stmt) throw new RuntimeException('Agency profile update unavailable');
    $stmt->bind_param('ssssii',$name,$public,$registration,$description,$customerId,$version);
    if (!$stmt->execute()) throw new RuntimeException('Agency profile update failed');
    if ($stmt->affected_rows!==1) json_out(['error'=>'Agency review state changed; refresh and retry'],409);
    json_out(['success'=>true,'version'=>$version+1,'verification_status'=>'revision']);
} catch (Throwable $e) {
    error_log('Agency profile revision failed');
    json_out(['error'=>'Unable to update agency profile'],503);
}
