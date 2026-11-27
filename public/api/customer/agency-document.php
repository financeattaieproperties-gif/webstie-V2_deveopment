<?php
declare(strict_types=1);

/**
 * Owner-only private agency license / business registration upload.
 * Set CUSTOMER_AGENCY_PRIVATE_DIR to a pre-created writable directory OUTSIDE
 * all web document roots (and protect it from web-server static file serving).
 * Never expose paths or document bytes via customer/public responses.
 */
require_once __DIR__.'/../bootstrap.php';
require_once __DIR__.'/../customer-cors.php';
require_once __DIR__.'/../customer-identity.php';
require_once __DIR__.'/../customer-firebase-auth.php';
require_once __DIR__.'/../customer-auth-context.php';
require_once __DIR__.'/../customer-agency-verification-policy.php';
customer_api_cors();
header('Cache-Control: private, no-store');
if (($_SERVER['REQUEST_METHOD']??'')!=='POST') json_out(['error'=>'Method not allowed'],405);
try {
    $db=db();
    $owner=require_customer_context($db);
    $ownerId=(int)$owner['id'];
    $type=$_POST['document_type']??null;
    $version=filter_var($_POST['version']??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
    if (!$version) json_out(['error'=>'Current agency version required'],422);
    if (!is_string($type) || !in_array($type,['registration','license'],true)) {
        json_out(['error'=>'Select registration or license document'],422);
    }
    $uploaded=$_FILES['document']??null;
    if (!is_array($uploaded) || ($uploaded['error']??null)!==UPLOAD_ERR_OK ||
        !is_string($uploaded['tmp_name']??null) ||
        !is_uploaded_file($uploaded['tmp_name'])) {
        json_out(['error'=>'A valid uploaded document is required'],422);
    }
    $bytes=(int)($uploaded['size']??0);
    try {
        $mime=agency_document_type($uploaded['tmp_name'],$bytes);
    } catch (InvalidArgumentException $e) {
        json_out(['error'=>$e->getMessage()],422);
    }
    $dir=agency_private_storage_dir((string)(getenv('CUSTOMER_AGENCY_PRIVATE_DIR')?:''),(string)($_SERVER['DOCUMENT_ROOT']??''));
    $stmt=$db->prepare('SELECT id,verification_status FROM customer_agencies WHERE owner_customer_id=? LIMIT 1');
    if (!$stmt) throw new RuntimeException('Agency lookup unavailable');
    $stmt->bind_param('i',$ownerId);
    if (!$stmt->execute()) throw new RuntimeException('Agency lookup failed');
    $agency=$stmt->get_result()->fetch_assoc();
    if (!$agency) json_out(['error'=>'Agency application required'],404);
    if (!in_array($agency['verification_status'],['pending','revision'],true)) json_out(['error'=>'Reviewed agency documents cannot be changed'],409);
    $agencyId=(int)$agency['id'];
    // No real names in storage keys. Never allow user-supplied paths.
    $key=bin2hex(random_bytes(32));
    $dest=$dir.DIRECTORY_SEPARATOR.$key;
    if (!move_uploaded_file($uploaded['tmp_name'],$dest)) {
        throw new RuntimeException('Private document write failed');
    }
    @chmod($dest,0600);
    $sha=hash_file('sha256',$dest);
    if (!is_string($sha) || !preg_match('/^[a-f0-9]{64}$/D',$sha)) {
        @unlink($dest);
        throw new RuntimeException('Private document checksum unavailable');
    }
    $original=basename((string)($uploaded['name']??'document'));
    $original=preg_replace('/[^a-zA-Z0-9._-]/','_',$original);
    $original=substr($original?:'document',0,180);
    try {
        $db->begin_transaction();
        $lock=$db->prepare('SELECT id,verification_status,review_round,version FROM customer_agencies WHERE id=? AND owner_customer_id=? FOR UPDATE');
        if (!$lock) throw new RuntimeException('Agency lock unavailable');
        $lock->bind_param('ii',$agencyId,$ownerId);
        if (!$lock->execute()) throw new RuntimeException('Agency lock failed');
        $lockedAgency=$lock->get_result()->fetch_assoc();
        if (!$lockedAgency || (int)$lockedAgency['version']!==$version ||
            !in_array($lockedAgency['verification_status'],['pending','revision'],true)) {
            $db->rollback();
            @unlink($dest);
            json_out(['error'=>'Agency review state changed'],409);
        }
        // Superseded documents are never deleted by customers; cap total lifetime
        // uploads to prevent unbounded private storage consumption.
        $lifetime=$db->prepare('SELECT COUNT(*) AS total FROM customer_agency_documents WHERE agency_id=?');
        if (!$lifetime) throw new RuntimeException('Document retention limit unavailable');
        $lifetime->bind_param('i',$agencyId);
        if (!$lifetime->execute()) throw new RuntimeException('Document retention limit unavailable');
        if ((int)$lifetime->get_result()->fetch_assoc()['total']>=30) {
            $db->rollback();
            @unlink($dest);
            json_out(['error'=>'Document replacement limit reached; contact Website Admin'],429);
        }
        $replace=$db->prepare('UPDATE customer_agency_documents SET is_current=0,superseded_at=UTC_TIMESTAMP() WHERE agency_id=? AND document_type=? AND is_current=1');
        if (!$replace) throw new RuntimeException('Document replacement unavailable');
        $replace->bind_param('is',$agencyId,$type);
        if (!$replace->execute()) throw new RuntimeException('Document replacement failed');
        // Replaced documents remain private, immutable and in the audit history.
        $count=$db->prepare('SELECT COUNT(*) AS total FROM customer_agency_documents WHERE agency_id=? AND is_current=1');
        if (!$count) throw new RuntimeException('Document limit unavailable');
        $count->bind_param('i',$agencyId);
        if (!$count->execute()) throw new RuntimeException('Document limit unavailable');
        if ((int)$count->get_result()->fetch_assoc()['total']>=6) {
            $db->rollback();
            @unlink($dest);
            json_out(['error'=>'A maximum of six verification documents is allowed'],429);
        }
        $insert=$db->prepare('INSERT INTO customer_agency_documents (agency_id,document_type,storage_key,sha256,mime_type,original_filename,byte_size) VALUES (?,?,?,?,?,?,?)');
        if (!$insert) throw new RuntimeException('Document record unavailable');
        $insert->bind_param('isssssi',$agencyId,$type,$key,$sha,$mime,$original,$bytes);
        if (!$insert->execute()) throw new RuntimeException('Document metadata write failed');
        $documentId=(int)$db->insert_id;
        // Invalidate stale admin review snapshots whenever documents change.
        $bump=$db->prepare("UPDATE customer_agencies SET version=version+1,
            business_contact_reviewed_at=NULL,business_contact_reviewed_by=NULL
            WHERE id=? AND version=? AND verification_status IN ('pending','revision')");
        if (!$bump) throw new RuntimeException('Agency document version update unavailable');
        $bump->bind_param('ii',$agencyId,$version);
        if (!$bump->execute() || $bump->affected_rows!==1) throw new RuntimeException('Agency document version conflict');
        $audit=$db->prepare('INSERT INTO customer_agency_verification_events (agency_id,previous_status,next_status,reason,review_round) VALUES (?,?,?,?,?)');
        if (!$audit) throw new RuntimeException('Document audit unavailable');
        $state=$lockedAgency['verification_status'];
        $reason='Owner uploaded '.$type.' document #'.$documentId.' (previous '.$type.' documents superseded; version '.$version.' to '.($version+1).')';
        $round=(int)$lockedAgency['review_round'];
        $audit->bind_param('isssi',$agencyId,$state,$state,$reason,$round);
        if (!$audit->execute()) throw new RuntimeException('Document audit failed');
        $db->commit();
    } catch (Throwable $e) {
        $db->rollback();
        @unlink($dest);
        throw $e;
    }
    json_out(['id'=>$documentId,'document_type'=>$type,'verification_status'=>$agency['verification_status'],'version'=>$version+1],201);
} catch (Throwable $e) {
    error_log('Agency private document upload failed');
    json_out(['error'=>'Could not securely store agency document'],503);
}
