<?php
declare(strict_types=1);

/**
 * Customer identity bootstrap:
 * GET  /api/customer/me.php: authenticated, registered customer profile
 * POST /api/customer/me.php: create/sync from a verified Firebase identity
 *
 * The frontend sends a Firebase ID token as Authorization: Bearer <token>.
 * NEVER accept a client-supplied UID, verified flag, account role or phone.
 * Deploy the 2026-11-27-customer-identity.sql migration manually first.
 */
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../customer-identity.php';
require_once __DIR__ . '/../customer-firebase-auth.php';

cors();
header('Cache-Control: no-store, private');

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST, OPTIONS');
    json_out(['error'=>'Method not allowed'], 405);
}

$authHeader = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
if (!preg_match('/^Bearer ([A-Za-z0-9_.-]{20,16384})$/D', $authHeader, $match)) {
    json_out(['error'=>'Authentication required'], 401);
}

$project = ctc_env('CUSTOMER_FIREBASE_PROJECT_ID');
$key = ctc_env('CUSTOMER_FIREBASE_API_KEY');
if ($project === '' || $key === '') {
    json_out(['error'=>'Customer authentication is not configured'], 503);
}

try {
    $verifier = new \AttaieCustomer\CustomerFirebaseAuth($project, $key);
    $identity = customer_identity_from_verified_account($verifier->verify($match[1]));
} catch (\AttaieCustomer\CustomerFirebaseAuthException | InvalidArgumentException $error) {
    json_out(['error'=>'Verified customer authentication required'], 401);
} catch (Throwable $error) {
    error_log('Customer identity verification unavailable.');
    json_out(['error'=>'Customer authentication temporarily unavailable'], 503);
}

$db = db();
$uid = $identity['firebase_uid'];
$get = static function () use ($db, $uid): ?array {
    $stmt = $db->prepare('SELECT id,display_name,email,email_verified,phone_e164,phone_verified,account_type,status,locale,created_at,updated_at FROM customer_accounts WHERE firebase_uid = ? LIMIT 1');
    if (!$stmt) throw new RuntimeException('Customer database unavailable.');
    $stmt->bind_param('s', $uid);
    if (!$stmt->execute()) throw new RuntimeException('Customer lookup failed.');
    return $stmt->get_result()->fetch_assoc() ?: null;
};
$public = static function (array $row): array {
    return [
        'id'=>(int) $row['id'], 'display_name'=>$row['display_name'],
        'email'=>$row['email'], 'email_verified'=>(bool)$row['email_verified'],
        'phone_e164'=>$row['phone_e164'], 'phone_verified'=>(bool)$row['phone_verified'],
        'account_type'=>$row['account_type'], 'status'=>$row['status'],
        'locale'=>$row['locale'], 'created_at'=>$row['created_at'], 'updated_at'=>$row['updated_at'],
    ];
};

try {
    if ($method === 'GET') {
        $row = $get();
        if (!$row) json_out(['error'=>'Customer account not created'], 404);
        if ($row['status'] !== 'active') json_out(['error'=>'Customer account unavailable'], 403);
        json_out(['customer'=>$public($row)]);
    }

    $profile = customer_profile_fields(body());
    $existing = $get();
    if ($existing && $existing['status'] !== 'active') {
        json_out(['error'=>'Customer account unavailable'], 403);
    }
    $name = $profile['display_name'];
    $locale = $profile['locale'];
    $email = $identity['email'];
    $emailVerified = (int)$identity['email_verified'];
    $phone = $identity['phone_e164'];
    $phoneVerified = (int)$identity['phone_verified'];
    $stmt = $db->prepare(
        'INSERT INTO customer_accounts (firebase_uid,display_name,email,email_verified,phone_e164,phone_verified,locale)
         VALUES (?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           email=VALUES(email),email_verified=VALUES(email_verified),
           phone_e164=VALUES(phone_e164),phone_verified=VALUES(phone_verified),
           display_name=IF(VALUES(display_name) = \'\',display_name,VALUES(display_name)),
           locale=VALUES(locale),version=version+1'
    );
    if (!$stmt) throw new RuntimeException('Customer registration unavailable.');
    $stmt->bind_param('sssisis', $uid, $name, $email, $emailVerified, $phone, $phoneVerified, $locale);
    if (!$stmt->execute()) throw new RuntimeException('Customer registration failed.');
    $row = $get();
    if (!$row || $row['status'] !== 'active') {
        throw new RuntimeException('Customer account could not be confirmed.');
    }
    json_out(['customer'=>$public($row)], $existing ? 200 : 201);
} catch (InvalidArgumentException $error) {
    json_out(['error'=>$error->getMessage()], 422);
} catch (Throwable $error) {
    error_log('Customer profile request failed.');
    json_out(['error'=>'Unable to confirm customer profile'], 503);
}
