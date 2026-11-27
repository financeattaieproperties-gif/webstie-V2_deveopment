<?php
declare(strict_types=1);

/** Website Admin-only attachment retrieval. Private files MUST be outside webroot. */
require_once __DIR__.'/../bootstrap.php';
require_once __DIR__.'/../customer-agency-verification-policy.php';
cors();
require_admin();
header('Cache-Control: no-store, private');
if (($_SERVER['REQUEST_METHOD']??'')!=='GET') json_out(['error'=>'Method not allowed'],405);
$agencyId=filter_var($_GET['agency_id']??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
$documentId=filter_var($_GET['document_id']??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
if (!$agencyId) json_out(['error'=>'Valid agency ID required'],422);
try {
    $db=db();
    $dir=agency_private_storage_dir((string)(getenv('CUSTOMER_AGENCY_PRIVATE_DIR')?:''),(string)($_SERVER['DOCUMENT_ROOT']??''));
    $list=$db->prepare('SELECT id,document_type,mime_type,original_filename,byte_size,uploaded_at,is_current,superseded_at FROM customer_agency_documents WHERE agency_id=? ORDER BY id DESC LIMIT 30');
    if (!$list) throw new RuntimeException('Document query unavailable');
    $list->bind_param('i',$agencyId);
    if (!$list->execute()) throw new RuntimeException('Document query failed');
    if (!$documentId) {
        $out=[];
        $rows=$list->get_result();
        while ($row=$rows->fetch_assoc()) {
            $row['id']=(int)$row['id'];
            $row['byte_size']=(int)$row['byte_size'];
            $row['is_current']=(bool)$row['is_current'];
            $out[]=$row;
        }
        json_out(['documents'=>$out]);
    }
    $stmt=$db->prepare('SELECT storage_key,mime_type,original_filename,byte_size,sha256 FROM customer_agency_documents WHERE agency_id=? AND id=? LIMIT 1');
    if (!$stmt) throw new RuntimeException('Document retrieval unavailable');
    $stmt->bind_param('ii',$agencyId,$documentId);
    if (!$stmt->execute()) throw new RuntimeException('Document retrieval failed');
    $row=$stmt->get_result()->fetch_assoc();
    if (!$row) json_out(['error'=>'Document not found'],404);
    $key=(string)$row['storage_key'];
    if (!preg_match('/^[a-f0-9]{64}$/D',$key)) throw new RuntimeException('Invalid storage reference');
    $file=realpath($dir.DIRECTORY_SEPARATOR.$key);
    if (!$file || !str_starts_with(str_replace('\\','/',$file),$dir.'/') || !is_file($file)) {
        json_out(['error'=>'Private document unavailable'],404);
    }
    if (filesize($file)!==(int)$row['byte_size'] || !hash_equals((string)$row['sha256'],hash_file('sha256',$file))) {
        throw new RuntimeException('Document integrity failure');
    }
    $name=preg_replace('/[^a-zA-Z0-9._-]/','_',basename((string)$row['original_filename'])) ?: 'document';
    header('X-Content-Type-Options: nosniff');
    header('Content-Security-Policy: sandbox');
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="'.$name.'"');
    header('Content-Length: '.(int)$row['byte_size']);
    readfile($file);
    exit;
} catch (Throwable $e) {
    error_log('Private agency document access failed');
    json_out(['error'=>'Unable to retrieve agency documents'],503);
}
