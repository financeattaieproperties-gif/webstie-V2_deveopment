<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/api/customer-agency-revision-policy.php';
function check(bool $ok,string $reason):void{if(!$ok)throw new RuntimeException($reason);}
check(agency_revision_next_status('rejected','start_revision')==='revision','Rejected agency must enter correction window');
check(agency_revision_next_status('revision','resubmit')==='pending','Only corrected revision can return for review');
foreach (['pending','verified','revision'] as $status) {
    try { agency_revision_next_status($status,'start_revision'); throw new RuntimeException('Unauthorized revision'); }
    catch(DomainException $expected) {}
}
foreach (['pending','verified','rejected'] as $status) {
    try { agency_revision_next_status($status,'resubmit'); throw new RuntimeException('Unauthorized resubmit'); }
    catch(DomainException $expected) {}
}
try { agency_revision_next_status('rejected','approve'); throw new RuntimeException('Customer could approve agency'); }
catch(DomainException $expected) {}
echo "Agency rejection/revision/resubmission state policy passed.\n";
