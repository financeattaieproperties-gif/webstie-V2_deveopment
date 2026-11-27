<?php
declare(strict_types=1);

/** Pure customer identity policies. Input MUST originate from verified Firebase accounts:lookup. */
function customer_identity_from_verified_account(array $account): array {
    $uid = $account['localId'] ?? null;
    if (!is_string($uid) || !preg_match('/^[\x21-\x7e]{1,128}$/D', $uid)) {
        throw new InvalidArgumentException('Invalid customer identity.');
    }

    $verifiedEmail = ($account['emailVerified'] ?? false) === true;
    $email = null;
    if ($verifiedEmail) {
        $candidate = $account['email'] ?? null;
        if (!is_string($candidate) || strlen($candidate) > 254 || !filter_var($candidate, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid verified email.');
        }
        $email = strtolower($candidate);
    }

    // Firebase Identity Toolkit exposes phoneNumber only for the verified phone-auth provider.
    // Client-supplied phone numbers are never accepted as verified.
    $phone = $account['phoneNumber'] ?? null;
    if ($phone !== null && (!is_string($phone) || !preg_match('/^\+[1-9][0-9]{7,14}$/D', $phone))) {
        throw new InvalidArgumentException('Invalid verified phone.');
    }
    if (!$verifiedEmail && $phone === null) {
        throw new InvalidArgumentException('Verify an email address or phone number before creating a customer account.');
    }
    return [
        'firebase_uid' => $uid,
        'email' => $email,
        'email_verified' => $verifiedEmail,
        'phone_e164' => $phone,
        'phone_verified' => $phone !== null,
    ];
}

function customer_profile_fields(array $input): array {
    $name = $input['display_name'] ?? '';
    $locale = $input['locale'] ?? 'en';
    if (!is_string($name) || (($length = preg_match_all('/./us', trim($name))) === false || $length > 160) || preg_match('/[\x00-\x1f\x7f]/u', $name)) {
        throw new InvalidArgumentException('Invalid display name.');
    }
    if (!is_string($locale) || !in_array($locale, ['en','fa','ps'], true)) {
        throw new InvalidArgumentException('Unsupported locale.');
    }
    if (array_diff(array_keys($input), ['display_name','locale'])) {
        throw new InvalidArgumentException('Unsupported customer profile field.');
    }
    return ['display_name' => trim($name), 'locale' => $locale];
}
