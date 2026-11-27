<?php
declare(strict_types=1);

/**
 * Phase 2 — Customer agency application
 *
 * GET: fetch authenticated customer's own agency application (if one exists)
 * POST: apply for one agency; always PENDING until administrator verification
 *
 * No client endpoint may set verified status, agency owner ID, or assign listings.
 * Manual Website database migrations 2026-11-27-customer-{identity,agencies}.sql
 * must both be applied on V2 staging before enabling this endpoint.
 */
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../customer-identity.php';
require_once __DIR__ . '/../customer-cors.php';
require_once __DIR__ . '/../customer-firebase-auth.php';
require_once __DIR__ . '/../customer-agency-policy.php';

customer_api_cors();
header('Cache-Control: no-store, private');

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if (!in_array($method, ['GET','POST'],true)) {
    header('Allow: GET, POST, OPTIONS');
    json_out(['error'=>'Method not allowed'],405);
}
$authorization = (string)($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
if (!preg_match('/^Bearer ([A-Za-z0-9_.-]{20,16384})$/D',$authorization,$tokenMatch)) {
    json_out(['error'=>'Authentication required'],401);
}
$project = ctc_env('CUSTOMER_FIREBASE_PROJECT_ID');
$key = ctc_env('CUSTOMER_FIREBASE_API_KEY');
if ($project === '' || $key === '') {
    json_out(['error'=>'Customer authentication is not configured'],503);
}
try {
    $verifier = new \AttaieCustomer\CustomerFirebaseAuth($project,$key);
    $identity = customer_identity_from_verified_account($verifier->verify($tokenMatch[1]));
} catch (\AttaieCustomer\CustomerFirebaseAuthException | InvalidArgumentException $error) {
    json_out(['error'=>'Verified customer authentication required'],401);
} catch (Throwable $error) {
    error_log('Agency identity verification unavailable.');
    json_out(['error'=>'Customer authentication temporarily unavailable'],503);
}

$db = db();
$uid = $identity['firebase_uid'];

$agencyPublic = static function(array $row):array {
    return [
        'id'=>(int)$row['id'],
        'legal_name'=>$row['legal_name'],
        'public_name'=>$row['public_name'],
        'registration_reference'=>$row['registration_reference'],
        'description'=>$row['description'],
        'verification_status'=>$row['verification_status'],
        'version'=>(int)$row['version'],
        'review_round'=>(int)$row['review_round'],
        'operational_status'=>$row['operational_status'],
        'rejection_reason'=>$row['rejection_reason'],
        'created_at'=>$row['created_at'],
        'updated_at'=>$row['updated_at'],
    ];
};
$findAgency = static function(int $customerId) use($db):?array {
    $stmt=$db->prepare('SELECT id,legal_name,public_name,registration_reference,description,verification_status,operational_status,rejection_reason,version,review_round,created_at,updated_at FROM customer_agencies WHERE owner_customer_id = ? LIMIT 1');
    if (!$stmt) throw new RuntimeException('Agency lookup unavailable');
    $stmt->bind_param('i',$customerId);
    if (!$stmt->execute()) throw new RuntimeException('Agency lookup failed');
    return $stmt->get_result()->fetch_assoc() ?: null;
};

try {
    $userStmt=$db->prepare('SELECT id,status,email_verified,phone_verified FROM customer_accounts WHERE firebase_uid=? LIMIT 1');
    if (!$userStmt) throw new RuntimeException('Customer lookup unavailable');
    $userStmt->bind_param('s',$uid);
    if (!$userStmt->execute()) throw new RuntimeException('Customer lookup failed');
    $customer=$userStmt->get_result()->fetch_assoc();
    if (!$customer) json_out(['error'=>'Create a customer account before applying for an agency'],404);
    if ($customer['status']!=='active') json_out(['error'=>'Customer account unavailable'],403);
    $customerId=(int)$customer['id'];

    if ($method==='GET') {
        $agency=$findAgency($customerId);
        json_out(['agency'=>$agency ? $agencyPublic($agency) : null]);
    }

    // Only allowed public profile information can be supplied by the customer.
    // Owner and verification status are taken exclusively from the server.
    try {
        $input=customer_agency_application_fields(body());
    } catch (InvalidArgumentException $error) {
        json_out(['error'=>$error->getMessage()],422);
    }

    $db->begin_transaction();
    try {
        $lock=$db->prepare('SELECT id,status,email_verified,phone_verified FROM customer_accounts WHERE id=? FOR UPDATE');
        if (!$lock) throw new RuntimeException('Customer lock unavailable');
        $lock->bind_param('i',$customerId);
        if (!$lock->execute()) throw new RuntimeException('Customer lock failed');
        $fresh=$lock->get_result()->fetch_assoc();
        if (!$fresh || $fresh['status']!=='active') {
            $db->rollback();
            json_out(['error'=>'Customer account unavailable'],403);
        }
        $verifiedEmail=in_array($fresh['email_verified'],[true,1,'1'],true);
        $verifiedPhone=in_array($fresh['phone_verified'],[true,1,'1'],true);
        if (!$verifiedEmail && !$verifiedPhone) {
            $db->rollback();
            json_out(['error'=>'Verify an email or phone before applying'],403);
        }
        if ($findAgency($customerId)) {
            $db->rollback();
            json_out(['error'=>'Agency application already exists'],409);
        }

        $legalName=$input['legal_name'];
        $publicName=$input['public_name'];
        $registrationReference=$input['registration_reference'] ?: null;
        $description=$input['description'] ?: null;
        $create=$db->prepare('INSERT INTO customer_agencies(owner_customer_id,legal_name,public_name,registration_reference,description) VALUES (?,?,?,?,?)');
        if (!$create) throw new RuntimeException('Agency creation unavailable');
        $create->bind_param('issss',$customerId,$legalName,$publicName,$registrationReference,$description);
        if (!$create->execute()) throw new RuntimeException('Agency creation failed');
        $agencyId=(int)$db->insert_id;

        $membership=$db->prepare("INSERT INTO customer_agency_members(agency_id,customer_id,member_role) VALUES (?,?,'owner')");
        if (!$membership) throw new RuntimeException('Membership creation unavailable');
        $membership->bind_param('ii',$agencyId,$customerId);
        if (!$membership->execute()) throw new RuntimeException('Membership creation failed');

        $setType=$db->prepare("UPDATE customer_accounts SET account_type='agency', version=version+1 WHERE id=? AND status='active'");
        if (!$setType) throw new RuntimeException('Account update unavailable');
        $setType->bind_param('i',$customerId);
        if (!$setType->execute()) throw new RuntimeException('Account update failed');

        $db->commit();
    } catch (Throwable $error) {
        $db->rollback();
        throw $error;
    }

    $agency=$findAgency($customerId);
    if (!$agency) throw new RuntimeException('Agency confirmation unavailable');
    json_out(['agency'=>$agencyPublic($agency)],201);
} catch (Throwable $error) {
    error_log('Customer agency request failed.');
    json_out(['error'=>'Unable to confirm agency application'],503);
}
