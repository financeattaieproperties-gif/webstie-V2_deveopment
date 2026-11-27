<?php
declare(strict_types=1);
require_once __DIR__ . '/../../public/api/customer-publication-policy.php';

function check_decision(array $account, string $risk, bool $allowed, ?string $reason): void {
    $actual = customer_property_submission_decision($account, $risk);
    if ($actual !== ['allowed' => $allowed, 'reason' => $reason]) {
        throw new RuntimeException('Unexpected property submission eligibility: ' . json_encode($actual));
    }
}
$active = ['status' => 'active', 'email_verified' => 0, 'phone_verified' => 0];
check_decision($active, 'standard', false, 'verification_required');
check_decision(['status'=>'active','email_verified'=>1,'phone_verified'=>0], 'standard', true, null);
check_decision(['status'=>'active','email_verified'=>0,'phone_verified'=>1], 'standard', true, null);
check_decision(['status'=>'active','email_verified'=>1,'phone_verified'=>1], 'standard', true, null);
check_decision(['status'=>'active','email_verified'=>1,'phone_verified'=>0], 'step_up', false, 'additional_verification_required');
check_decision(['status'=>'active','email_verified'=>0,'phone_verified'=>1], 'step_up', false, 'additional_verification_required');
check_decision(['status'=>'active','email_verified'=>1,'phone_verified'=>1], 'step_up', true, null);
check_decision(['status'=>'suspended','email_verified'=>1,'phone_verified'=>1], 'standard', false, 'account_unavailable');
check_decision(['status'=>'deleted','email_verified'=>1,'phone_verified'=>1], 'step_up', false, 'account_unavailable');
check_decision(['status'=>'active'], 'standard', false, 'verification_required');
check_decision(['status'=>'active','email_verified'=>'true','phone_verified'=>[]], 'standard', false, 'verification_required');
try {
    customer_property_submission_decision($active, 'client_supplied_low_risk');
    throw new RuntimeException('Unrecognized risk level unexpectedly accepted.');
} catch (InvalidArgumentException $expected) {
}
echo "Customer property submission eligibility policy checks passed.\n";
