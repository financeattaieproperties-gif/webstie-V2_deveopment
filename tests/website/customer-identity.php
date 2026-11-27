<?php
declare(strict_types=1);
require_once __DIR__ . '/../../public/api/customer-identity.php';

function customer_test(bool $ok, string $message): void {
    if (!$ok) throw new RuntimeException($message);
}
function must_reject(callable $fn, string $label): void {
    try { $fn(); } catch (InvalidArgumentException) { return; }
    throw new RuntimeException("Should reject: $label");
}
$uid = 'customer-uid-123';
$email = customer_identity_from_verified_account([
    'localId'=>$uid, 'email'=>'Owner@Example.test', 'emailVerified'=>true
]);
customer_test($email['firebase_uid'] === $uid, 'UID must come from provider');
customer_test($email['email'] === 'owner@example.test', 'Verified email normalized');
customer_test($email['phone_e164'] === null && $email['phone_verified'] === false, 'Email path must not invent a verified phone');
$phone = customer_identity_from_verified_account([
    'localId'=>$uid, 'phoneNumber'=>'+93701234567', 'emailVerified'=>false,
    'email'=>'unverified@example.test'
]);
customer_test($phone['email'] === null && $phone['phone_e164'] === '+93701234567', 'Phone path must not trust unverified email');
$both = customer_identity_from_verified_account([
    'localId'=>$uid, 'email'=>'owner@example.test', 'emailVerified'=>true, 'phoneNumber'=>'+93701234567'
]);
customer_test($both['email_verified'] && $both['phone_verified'], 'Linked providers should remain one account');
must_reject(fn()=>customer_identity_from_verified_account(['localId'=>$uid,'email'=>'x@e.test','emailVerified'=>false]), 'unverified email only');
must_reject(fn()=>customer_identity_from_verified_account(['localId'=>'','phoneNumber'=>'+93701234567']), 'empty UID');
must_reject(fn()=>customer_identity_from_verified_account(['localId'=>$uid,'phoneNumber'=>'0701234567']), 'non E164 phone');
must_reject(fn()=>customer_identity_from_verified_account(['localId'=>$uid,'phoneNumber'=>'+930']), 'short phone');
must_reject(fn()=>customer_identity_from_verified_account(['localId'=>$uid,'email'=>'broken','emailVerified'=>true]), 'bad verified email');
$profile = customer_profile_fields(['display_name'=>' Customer One ', 'locale'=>'fa']);
customer_test($profile['display_name'] === 'Customer One' && $profile['locale'] === 'fa', 'Profile normalized');
must_reject(fn()=>customer_profile_fields(['role'=>'admin']), 'role escalation');
must_reject(fn()=>customer_profile_fields(['phone_verified'=>true]), 'client phone verification');
must_reject(fn()=>customer_profile_fields(['email_verified'=>true]), 'client email verification');
must_reject(fn()=>customer_profile_fields(['locale'=>'unknown']), 'invalid locale');
echo "Customer identity policy tests passed.\n";
