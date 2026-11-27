<?php
declare(strict_types=1);
/** Return metadata about the authenticated agency owner's private documents. */
require_once __DIR__.'/../bootstrap.php';
require_once __DIR__.'/../customer-cors.php';
require_once __DIR__.'/../customer-identity.php';
require_once __DIR__.'/../customer-firebase-auth.php';
require_once __DIR__.'/../customer-auth-context.php';
customer_api_cors();
header('Cache-Control: private, no-store');
if (($_SERVER['REQUEST_METHOD']??'')!=='GET') json_out(['error'=>'Method not allowed'],405);
try {
    $db=db();
    $owner=require_customer_context($db);
    $id=(int)$owner['id'];
    $stmt=$db->prepare('SELECT id,verification_status FROM customer_agencies WHERE owner_customer_id=? LIMIT 1');
    if (!$stmt) throw new RuntimeException('Agency lookup unavailable');
    $stmt->bind_param('i',$id);
    if (!$stmt->execute()) throw new RuntimeException('Agency lookup failed');
    $agency=$stmt->get_result()->fetch_assoc();
    if (!$agency) json_out(['error'=>'Agency application required'],404);
    $agencyId=(int)$agency['id'];
    $stmt=$db->prepare('SELECT id,document_type,original_filename,byte_size,uploaded_at FROM customer_agency_documents WHERE agency_id=? ORDER BY id DESC LIMIT 30');
    if (!$stmt) throw new RuntimeException('Document lookup unavailable');
    $stmt->bind_param('i',$agencyId);
    if (!$stmt->execute()) throw new RuntimeException('Document lookup failed');
    $items=[];
    $res=$stmt->get_result();
    while($row=$res->fetch_assoc()){
        $row['id']=(int)$row['id'];
        $row['byte_size']=(int)$row['byte_size'];
        $items[]=$row;
    }
    json_out(['documents'=>$items,'verification_status'=>$agency['verification_status']]);
} catch(Throwable $e) {
    error_log('Customer agency document list failed');
    json_out(['error'=>'Unable to load agency document status'],503);
}
