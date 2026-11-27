<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/api/customer-agency-verification-policy.php';
function ok(bool $condition, string $reason):void{if(!$condition)throw new RuntimeException($reason);}
function deny(callable $fn):void {try{$fn();}catch(InvalidArgumentException|RuntimeException){return;}throw new RuntimeException('Expected rejection');}

$fields=agency_representative_fields([
  'representative_name'=>' Example Owner ',
  'representative_position'=>' Director ',
  'representative_contact_method'=>'email'
]);
ok($fields['representative_name']==='Example Owner','Trim representative name');
ok($fields['representative_position']==='Director','Trim role');
deny(fn()=>agency_representative_fields(['representative_name'=>'Owner','representative_position'=>'Manager','representative_contact_method'=>'email','verification_status'=>'verified']));
deny(fn()=>agency_representative_fields(['representative_name'=>'','representative_position'=>'Manager','representative_contact_method'=>'email']));
deny(fn()=>agency_representative_fields(['representative_name'=>'Owner','representative_position'=>'Manager','representative_contact_method'=>'sms']));
deny(fn()=>agency_representative_fields(['representative_name'=>'Owner','representative_position'=>'Manager','representative_contact_method'=>'phone','owner_customer_id'=>42]));

$owner=['status'=>'active','email_verified'=>1,'phone_verified'=>0];
$agency=['operational_status'=>'active','representative_name'=>'Owner','representative_position'=>'Director','representative_contact_method'=>'email'];
ok(agency_approval_readiness($agency,$owner,1)['ready'],'One business doc + verified email');
ok(!agency_approval_readiness($agency,$owner,0)['ready'],'Missing business doc');
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
