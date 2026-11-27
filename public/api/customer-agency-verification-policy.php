<?php
declare(strict_types=1);

/** Customer may submit representative details, never any approval field. */
function agency_representative_fields(array $input): array {
    $allowed = ['representative_name','representative_position','representative_contact_method','business_email','business_phone_e164'];
    if (array_diff(array_keys($input), $allowed)) {
        throw new InvalidArgumentException('Unsupported representative field.');
    }
    $out = [];
    foreach (['representative_name'=>160, 'representative_position'=>120] as $key=>$max) {
        $val=$input[$key] ?? null;
        if (!is_string($val) || trim($val)==='' ||
            ($len=preg_match_all('/./us',trim($val)))===false || $len>$max ||
            preg_match('/[\x00-\x1f\x7f]/u',$val)) {
            throw new InvalidArgumentException('Representative name and position required.');
        }
        $out[$key]=trim($val);
    }
    $method=$input['representative_contact_method'] ?? null;
    if (!in_array($method,['email','phone'],true)) {
        throw new InvalidArgumentException('Choose a verified email or phone contact.');
    }
    $out['representative_contact_method']=$method;
    $businessEmail=$input['business_email'] ?? '';
    $businessPhone=$input['business_phone_e164'] ?? '';
    if (!is_string($businessEmail) || !is_string($businessPhone)) {
        throw new InvalidArgumentException('Invalid agency business contact.');
    }
    $businessEmail=strtolower(trim($businessEmail));
    $businessPhone=trim($businessPhone);
    if ($businessEmail!=='' && (strlen($businessEmail)>254 || !filter_var($businessEmail,FILTER_VALIDATE_EMAIL))) {
        throw new InvalidArgumentException('Invalid agency business email.');
    }
    if ($businessPhone!=='' && !preg_match('/^\\+[1-9][0-9]{7,14}$/D',$businessPhone)) {
        throw new InvalidArgumentException('Business phone must use international E.164 format.');
    }
    if ($businessEmail==='' && $businessPhone==='') {
        throw new InvalidArgumentException('Supply at least one agency business contact.');
    }
    $out['business_email']=$businessEmail!==''?$businessEmail:null;
    $out['business_phone_e164']=$businessPhone!==''?$businessPhone:null;
    return $out;
}

/** Only server-fetched owner verification flags may satisfy the contact requirement. */
function agency_verified_contact_available(array $customer, string $method): bool {
    if (!in_array($method,['email','phone'],true)) return false;
    $flag=$customer[$method === 'email' ? 'email_verified' : 'phone_verified'] ?? false;
    return in_array($flag,[true,1,'1'],true);
}

/** Approval requires license/registration document plus verified representative contact. */
function agency_approval_readiness(array $agency, array $owner, int $documents): array {
    if (($owner['status'] ?? null)!=='active' || ($agency['operational_status'] ?? null)!=='active') {
        return ['ready'=>false,'reason'=>'inactive_owner_or_agency'];
    }
    if (trim((string)($agency['representative_name']??''))==='' ||
        trim((string)($agency['representative_position']??''))==='') {
        return ['ready'=>false,'reason'=>'representative_required'];
    }
    if (!agency_verified_contact_available($owner,(string)($agency['representative_contact_method']??''))) {
        return ['ready'=>false,'reason'=>'verified_contact_required'];
    }
    $email=$agency['business_email']??null;
    $phone=$agency['business_phone_e164']??null;
    if ((!is_string($email) || !filter_var($email,FILTER_VALIDATE_EMAIL)) &&
        (!is_string($phone) || !preg_match('/^\\+[1-9][0-9]{7,14}$/D',$phone))) {
        return ['ready'=>false,'reason'=>'business_contact_required'];
    }
    if ($documents<1) return ['ready'=>false,'reason'=>'business_document_required'];
    return ['ready'=>true,'reason'=>null];
}

/** Fail closed if document could be publicly served from the configured webroot. */
function agency_private_storage_dir(string $configuredRoot, string $documentRoot): string {
    $root=realpath($configuredRoot);
    $public=realpath($documentRoot);
    if (!$root || !$public || !is_dir($root) || !is_writable($root)) {
        throw new RuntimeException('Private document storage is not configured.');
    }
    $root=rtrim(str_replace('\\','/',$root),'/');
    $public=rtrim(str_replace('\\','/',$public),'/');
    if ($root===$public || str_starts_with($root.'/',$public.'/')) {
        throw new RuntimeException('Agency documents must remain outside the public document root.');
    }
    return $root;
}

/** Check MIME and actual file signature; never rely on a filename extension. */
function agency_document_type(string $path, int $byteSize): string {
    if ($byteSize<1 || $byteSize>5*1024*1024 || !is_file($path)) {
        throw new InvalidArgumentException('Upload a document smaller than 5 MB.');
    }
    $mime=(new finfo(FILEINFO_MIME_TYPE))->file($path);
    $fp=fopen($path,'rb');
    if ($fp===false) throw new InvalidArgumentException('Invalid document.');
    try {$head=fread($fp,8);} finally {fclose($fp);}
    $allowed=[
        'application/pdf'=>is_string($head)&&str_starts_with($head,'%PDF-'),
        'image/png'=>is_string($head)&&str_starts_with($head,"\x89PNG\r\n\x1a\n"),
        'image/jpeg'=>is_string($head)&&str_starts_with($head,"\xff\xd8\xff"),
    ];
    if (!isset($allowed[$mime]) || !$allowed[$mime]) {
        throw new InvalidArgumentException('Only PDF, JPEG or PNG business documents are accepted.');
    }
    if ($mime==='image/png' || $mime==='image/jpeg') {
        if (@getimagesize($path)===false) throw new InvalidArgumentException('Invalid image document.');
    }
    return $mime;
}
