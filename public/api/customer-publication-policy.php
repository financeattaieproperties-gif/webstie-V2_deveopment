<?php
declare(strict_types=1);

/**
 * Server-only eligibility policy for CUSTOMER property submission.
 *
 * Standard: one verified Firebase factor (email OR phone), active account.
 * Step-up: both verified factors where an authorized SERVER-SIDE risk review
 * requires additional identity assurance. Never accept riskLevel from a client.
 *
 * This is a policy helper, not a publication/submission endpoint. The future
 * listing write service must call it with a fresh account from the website DB
 * and a risk decision computed on the server.
 */
function customer_property_submission_decision(array $account, string $serverRiskLevel = 'standard'): array {
    if (!in_array($serverRiskLevel, ['standard', 'step_up'], true)) {
        throw new InvalidArgumentException('Unknown server risk level.');
    }
    if (($account['status'] ?? null) !== 'active') {
        return ['allowed' => false, 'reason' => 'account_unavailable'];
    }
    $emailFlag = $account['email_verified'] ?? null;
    $phoneFlag = $account['phone_verified'] ?? null;
    $emailVerified = $emailFlag === true || $emailFlag === 1 || $emailFlag === '1';
    $phoneVerified = $phoneFlag === true || $phoneFlag === 1 || $phoneFlag === '1';

    if (!$emailVerified && !$phoneVerified) {
        return ['allowed' => false, 'reason' => 'verification_required'];
    }
    if ($serverRiskLevel === 'step_up' && !($emailVerified && $phoneVerified)) {
        return ['allowed' => false, 'reason' => 'additional_verification_required'];
    }
    return ['allowed' => true, 'reason' => null];
}
