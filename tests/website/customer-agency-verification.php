<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/api/customer-agency-verification-policy.php';
function ok(bool $condition, string $reason):void{if(!$condition)throw new RuntimeException($reason);}
function deny(callable $fn):void {try{$fn();}catch(InvalidArgumentException|RuntimeException){return;}throw new RuntimeException('Expected rejection');}

$fields=agency_representative_fields([
  'representative_name'=>' Example Owner ',
  'representative_position'=>' Director ',
  'representative_contact_method'=>'email',
  'business_email'=>' Office@Example.com ',
  'business_phone_e164'=>'+93701234567'
]);
ok($fields['representative_name']==='Example Owner','Trim representative name');
ok($fields['representative_position']==='Director','Trim role');
ok($fields['business_email']==='office@example.com','Normalize business email');
ok($fields['business_phone_e164']==='+93701234567','Keep agency phone separate');
deny(fn()=>agency_representative_fields(['representative_name'=>'Owner','representative_position'=>'Manager','representative_contact_method'=>'email','verification_status'=>'verified']));
deny(fn()=>agency_representative_fields(['representative_name'=>'','representative_position'=>'Manager','representative_contact_method'=>'email']));
deny(fn()=>agency_representative_fields(['representative_name'=>'Owner','representative_position'=>'Manager','representative_contact_method'=>'sms']));
deny(fn()=>agency_representative_fields(['representative_name'=>'Owner','representative_position'=>'Manager','representative_contact_method'=>'phone','owner_customer_id'=>42]));
$base=['representative_name'=>'Owner','representative_position'=>'Director','representative_contact_method'=>'email'];
deny(fn()=>agency_representative_fields($base));
deny(fn()=>agency_representative_fields([...$base,'business_email'=>'broken-email']));
deny(fn()=>agency_representative_fields([...$base,'business_phone_e164'=>'0701234567']));
deny(fn()=>agency_representative_fields([...$base,'business_email'=>'owner@example.com','business_phone_e164'=>'','verification_status'=>'verified']));
ok(agency_representative_fields([...$base,'business_phone_e164'=>'+93701234567'])['business_email']===null,'Phone-only business contact allowed');
ok(agency_representative_fields([...$base,'business_email'=>'biz@example.com'])['business_phone_e164']===null,'Email-only business contact allowed');

$owner=['status'=>'active','email_verified'=>1,'phone_verified'=>0];
$agency=['operational_status'=>'active','representative_name'=>'Owner','representative_position'=>'Director','representative_contact_method'=>'email','business_email'=>'biz@example.com'];
ok(agency_approval_readiness($agency,$owner,1)['ready'],'One business doc + verified email');
ok(!agency_approval_readiness($agency,$owner,0)['ready'],'Missing business doc');
$missingContact=$agency; unset($missingContact['business_email']);
ok(agency_approval_readiness($missingContact,$owner,1)['reason']==='business_contact_required','Business contact required');
$phoneOnly=$missingContact;$phoneOnly['business_phone_e164']='+93701234567';
ok(agency_approval_readiness($phoneOnly,$owner,1)['ready'],'Business phone alone is enough with verified owner contact');
$agency['representative_contact_method']='phone';
ok(agency_approval_readiness($agency,$owner,1)['reason']==='verified_contact_required','Unverified phone rejected');
$owner['phone_verified']=1;
ok(agency_approval_readiness($agency,$owner,1)['ready'],'Verified phone accepted');
$agency['representative_name']='';
ok(agency_approval_readiness($agency,$owner,1)['reason']==='representative_required','Representative required');
$agency['representative_name']='Owner';
$owner['status']='suspended';
ok(agency_approval_readiness($agency,$owner,1)['reason']==='inactive_owner_or_agency','Suspended owner rejected');

$tmp=sys_get_temp_dir().'/attaie-verification-'.bin2hex(random_bytes(6));
mkdir($tmp,0700);
try {
  $doc=$tmp.'/license.pdf';
  file_put_contents($doc,"%PDF-1.4\nfixture-only");
  ok(agency_document_type($doc,filesize($doc))==='application/pdf','PDF verified by header+MIME');
  file_put_contents($doc,'not a document');
  deny(fn()=>agency_document_type($doc,filesize($doc)));
  file_put_contents($doc,str_repeat('A',5*1024*1024+1));
  deny(fn()=>agency_document_type($doc,filesize($doc)));
  // A directory under itself can never be an acceptable private child of a public root.
  $private=$tmp.'/private';
  mkdir($private,0700);
  deny(fn()=>agency_private_storage_dir($private,$tmp));
} finally {
  if(is_file($tmp.'/license.pdf'))unlink($tmp.'/license.pdf');
  if(is_dir($tmp.'/private'))rmdir($tmp.'/private');
  rmdir($tmp);
}
echo "Agency representative, verified contact, document and private storage policy checks passed.\n";
