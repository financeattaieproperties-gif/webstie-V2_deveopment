<?php
declare(strict_types=1);

/**
 * Agency registration and listing ownership checks.
 * This file contains PURE policy; all account and agency rows must be queried
 * from the server's own Website MySQL database, never client JSON.
 */
function customer_agency_application_fields(array $payload): array {
    $allowed = ['legal_name','public_name','registration_reference','description'];
    foreach (array_keys($payload) as $key) {
        if (!in_array($key, $allowed, true)) {
            throw new InvalidArgumentException('Unsupported agency application field.');
        }
    }
    $result = [];
    foreach (['legal_name'=>200,'public_name'=>200,'registration_reference'=>100,'description'=>2000] as $field=>$max) {
        $value = $payload[$field] ?? '';
        if (!is_string($value)) throw new InvalidArgumentException('Invalid agency field.');
        $value = trim($value);
        $length = preg_match_all('/./us', $value);
        if ($length === false || $length > $max || preg_match('/[\x00-\x1f\x7f]/u', $value)) {
            throw new InvalidArgumentException('Invalid agency field.');
        }
        if (($field==='legal_name' || $field==='public_name') && $value==='') {
            throw new InvalidArgumentException('Agency name is required.');
        }
        $result[$field] = $value;
    }
    return $result;
}

/** A pending agency can prepare drafts, but cannot publish under a verified badge. */
function customer_agency_listing_decision(array $account, array $agency, array $membership, string $action): array {
    if (!in_array($action,['create_draft','submit_for_review','publish'],true)) {
        throw new InvalidArgumentException('Unknown listing action.');
    }
    if (($account['status'] ?? null)!=='active' || ($agency['operational_status'] ?? null)!=='active') {
        return ['allowed'=>false,'reason'=>'account_or_agency_unavailable'];
    }
    if ((string)($membership['agency_id'] ?? '') !== (string)($agency['id'] ?? '')
        || (string)($membership['customer_id'] ?? '') !== (string)($account['id'] ?? '')
        || ($membership['membership_status'] ?? '')!=='active'
        || !in_array($membership['member_role'] ?? null,['owner','manager'],true)) {
        return ['allowed'=>false,'reason'=>'agency_membership_required'];
    }
    $verifiedEmail=in_array($account['email_verified'] ?? null,[true,1,'1'],true);
    $verifiedPhone=in_array($account['phone_verified'] ?? null,[true,1,'1'],true);
    if (!$verifiedEmail && !$verifiedPhone) {
        return ['allowed'=>false,'reason'=>'verification_required'];
    }
    if ($action==='publish' && ($agency['verification_status'] ?? null)!=='verified') {
        return ['allowed'=>false,'reason'=>'agency_verification_required'];
    }
    return ['allowed'=>true,'reason'=>null];
}
