<?php
declare(strict_types=1);

/** Require bootstrap, customer-identity and customer-firebase-auth before including. */
function require_customer_context(mysqli $db): array {
    $header=(string)($_SERVER['HTTP_AUTHORIZATION']??$_SERVER['REDIRECT_HTTP_AUTHORIZATION']??'');
    if (!preg_match('/^Bearer ([A-Za-z0-9_.-]{20,16384})$/D',$header,$m)) {
        json_out(['error'=>'Authentication required'],401);
    }
    $project=ctc_env('CUSTOMER_FIREBASE_PROJECT_ID');
    $key=ctc_env('CUSTOMER_FIREBASE_API_KEY');
    if ($project==='' || $key==='') json_out(['error'=>'Customer authentication is not configured'],503);
    try {
        $verified=(new \AttaieCustomer\CustomerFirebaseAuth($project,$key))->verify($m[1]);
        $identity=customer_identity_from_verified_account($verified);
    } catch (\AttaieCustomer\CustomerFirebaseAuthException | InvalidArgumentException $e) {
        json_out(['error'=>'Verified customer authentication required'],401);
    }
    $uid=$identity['firebase_uid'];
    $stmt=$db->prepare('SELECT id,status,email_verified,phone_verified FROM customer_accounts WHERE firebase_uid=? LIMIT 1');
    if (!$stmt) throw new RuntimeException('Customer identity database unavailable');
    $stmt->bind_param('s',$uid);
    if (!$stmt->execute()) throw new RuntimeException('Customer lookup failed');
    $row=$stmt->get_result()->fetch_assoc();
    if (!$row) json_out(['error'=>'Create a customer account first'],404);
    if ($row['status']!=='active') json_out(['error'=>'Customer account unavailable'],403);
    return $row;
}
