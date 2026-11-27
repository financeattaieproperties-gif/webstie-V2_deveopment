<?php
declare(strict_types=1);
/** Website Admin-only read-only audit history, including customer resubmissions. */
require_once __DIR__.'/../bootstrap.php';
cors();
require_admin();
header('Cache-Control: private, no-store');
if (($_SERVER['REQUEST_METHOD']??'')!=='GET') json_out(['error'=>'Method not allowed'],405);
$id=filter_var($_GET['agency_id']??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
if (!$id) json_out(['error'=>'Valid agency ID required'],422);
try {
    $db=db();
    $stmt=$db->prepare('SELECT id,previous_status,next_status,reason,reviewer_username,review_round,created_at
        FROM customer_agency_verification_events WHERE agency_id=? ORDER BY id DESC LIMIT 100');
    if (!$stmt) throw new RuntimeException('Audit query unavailable');
    $stmt->bind_param('i',$id);
    if (!$stmt->execute()) throw new RuntimeException('Audit query failed');
    $events=[];
    $res=$stmt->get_result();
    while ($row=$res->fetch_assoc()) {
        $row['id']=(int)$row['id'];
        $row['review_round']=$row['review_round']===null?null:(int)$row['review_round'];
        $events[]=$row;
    }
    json_out(['events'=>$events]);
} catch(Throwable $e) {
    error_log('Agency audit history unavailable');
    json_out(['error'=>'Unable to retrieve agency review history'],503);
}
