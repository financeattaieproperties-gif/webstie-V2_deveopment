<?php
declare(strict_types=1);
require_once __DIR__ . '/../../public/api/customer-agency-policy.php';
$assert=function(bool $cond,string $message):void{if(!$cond)throw new RuntimeException($message);};
$reject=function(callable $fn):void{try{$fn();}catch(InvalidArgumentException){return;}throw new RuntimeException('Expected rejection');};

$fields=customer_agency_application_fields([
    'legal_name'=>' Attaie Example Real Estate ',
    'public_name'=>' Example Agency ',
    'registration_reference'=>'REG-123',
    'description'=>'A fictional company',
]);
$assert($fields['legal_name']==='Attaie Example Real Estate','Legal name trimmed');
$assert($fields['registration_reference']==='REG-123','Registration reference retained');
$reject(fn()=>customer_agency_application_fields(['legal_name'=>'','public_name'=>'OK']));
$reject(fn()=>customer_agency_application_fields(['legal_name'=>'X','public_name'=>'']));
$reject(fn()=>customer_agency_application_fields(['legal_name'=>'X','public_name'=>'Y','verification_status'=>'verified']));
$reject(fn()=>customer_agency_application_fields(['legal_name'=>'X','public_name'=>'Y','owner_customer_id'=>2]));
$reject(fn()=>customer_agency_application_fields(['legal_name'=>'X','public_name'=>'Y','member_role'=>'owner']));
$reject(fn()=>customer_agency_application_fields(['legal_name'=>['X'],'public_name'=>'Y']));
$reject(fn()=>customer_agency_application_fields(['legal_name'=>'X','public_name'=>'Y','description'=>str_repeat('Z',2001)]));

$account=['id'=>12,'status'=>'active','email_verified'=>1,'phone_verified'=>0];
$agency=['id'=>33,'verification_status'=>'pending','operational_status'=>'active'];
$member=['agency_id'=>33,'customer_id'=>12,'membership_status'=>'active','member_role'=>'owner'];
$check=function($action,$ok,$reason)use($assert,$account,$agency,$member){
  $a=customer_agency_listing_decision($account,$agency,$member,$action);
  $assert($a===['allowed'=>$ok,'reason'=>$reason],"$action mismatch");
};
$check('create_draft',true,null);
$check('submit_for_review',true,null);
$check('publish',false,'agency_verification_required');
$verified=$agency;$verified['verification_status']='verified';
$assert(customer_agency_listing_decision($account,$verified,$member,'publish')['allowed'],'Verified agency can publish with authorized workflow');
$bad=$member;$bad['customer_id']=13;
$assert(customer_agency_listing_decision($account,$verified,$bad,'publish')['reason']==='agency_membership_required','Cannot publish other agency listings');
$bad=$member;$bad['member_role']='agent';
$assert(customer_agency_listing_decision($account,$verified,$bad,'publish')['reason']==='agency_membership_required','No agent publishing without delegation');
$bad=$member;$bad['membership_status']='revoked';
$assert(customer_agency_listing_decision($account,$verified,$bad,'publish')['reason']==='agency_membership_required','Revoked member excluded');
$bad=$account;$bad['status']='suspended';
$assert(customer_agency_listing_decision($bad,$verified,$member,'publish')['reason']==='account_or_agency_unavailable','Suspended customer excluded');
$bad=$agency;$bad['operational_status']='suspended';
$assert(customer_agency_listing_decision($account,$bad,$member,'submit_for_review')['reason']==='account_or_agency_unavailable','Suspended agency excluded');
$bad=$account;$bad['email_verified']=0;
$assert(customer_agency_listing_decision($bad,$verified,$member,'publish')['reason']==='verification_required','Unverified member excluded');
$bad['phone_verified']=1;
$assert(customer_agency_listing_decision($bad,$verified,$member,'publish')['allowed'],'Verified phone acceptable');
$reject(fn()=>customer_agency_listing_decision($account,$agency,$member,'admin_approve'));
echo "Agency validation, separate ownership and verification policies passed.\n";
