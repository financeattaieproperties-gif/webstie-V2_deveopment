<?php
declare(strict_types=1);
/**
 * Website Admin ONLY: inspect agency applications and approve/reject.
 * Reuses existing Website Admin session + CSRF, never staff CRM permissions.
 * Document reads are a separate authenticated attachment-only endpoint.
 */
require_once __DIR__.'/../bootstrap.php';
require_once __DIR__.'/../customer-agency-verification-policy.php';
cors();
require_admin();

$method=strtoupper($_SERVER['REQUEST_METHOD']??'GET');
if (!in_array($method,['GET','POST'],true)) json_out(['error'=>'Method not allowed'],405);

try {
    $db=db();
    if ($method==='GET') {
        $filter=$_GET['status']??'pending';
        if (!is_string($filter) || !in_array($filter,['pending','verified','rejected','all'],true)) {
            json_out(['error'=>'Invalid review status filter'],422);
        }
        $sql="SELECT a.id,a.owner_customer_id,a.legal_name,a.public_name,a.registration_reference,
                 a.representative_name,a.representative_position,a.representative_contact_method,
                 a.verification_status,a.operational_status,a.rejection_reason,a.version,
                 a.created_at,a.updated_at,c.display_name AS owner_name,
                 c.email,c.email_verified,c.phone_e164,c.phone_verified,c.status AS owner_status,
                 (SELECT COUNT(*) FROM customer_agency_documents d WHERE d.agency_id=a.id) AS document_count
              FROM customer_agencies a JOIN customer_accounts c ON c.id=a.owner_customer_id";
        if ($filter!=='all') $sql.=" WHERE a.verification_status=?";
        $sql.=" ORDER BY a.created_at DESC,a.id DESC LIMIT 100";
        $stmt=$db->prepare($sql);
        if (!$stmt) throw new RuntimeException('Agency review query unavailable');
        if ($filter!=='all') $stmt->bind_param('s',$filter);
        $stmt->execute();
        $items=[];
        $rows=$stmt->get_result();
        while ($row=$rows->fetch_assoc()) {
            foreach (['id','owner_customer_id','document_count','version'] as $k) $row[$k]=(int)$row[$k];
            foreach (['email_verified','phone_verified'] as $k) $row[$k]=(bool)$row[$k];
            $items[]=$row;
        }
        json_out(['items'=>$items]);
    }
    $input=body();
    if (array_diff(array_keys($input),['agency_id','version','decision','reason'])) {
        json_out(['error'=>'Unsupported review field'],422);
    }
    $agencyId=filter_var($input['agency_id']??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
    $version=filter_var($input['version']??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
    $decision=$input['decision']??null;
    $reason=$input['reason']??'';
    if (!$agencyId || !$version || !is_string($decision) || !in_array($decision,['verified','rejected'],true)
        || !is_string($reason) || strlen($reason)>1000 ||
        ($decision==='rejected' && trim($reason)==='')) {
        json_out(['error'=>'Valid agency, version, decision and rejection reason required'],422);
    }
    $reason=trim($reason);
    $reviewer=substr((string)($_SESSION['admin_user']??'website-admin'),0,120);
    $db->begin_transaction();
    try {
        $stmt=$db->prepare("SELECT a.*, c.status AS owner_status,c.email_verified,c.phone_verified
            FROM customer_agencies a JOIN customer_accounts c ON c.id=a.owner_customer_id
            WHERE a.id=? FOR UPDATE");
        if (!$stmt) throw new RuntimeException('Agency review lock unavailable');
        $stmt->bind_param('i',$agencyId);
        if (!$stmt->execute()) throw new RuntimeException('Agency review failed');
        $agency=$stmt->get_result()->fetch_assoc();
        if (!$agency) { $db->rollback();json_out(['error'=>'Agency not found'],404); }
        if ($agency['verification_status']!=='pending' || (int)$agency['version']!==$version) {
            $db->rollback();json_out(['error'=>'Agency changed; reload before reviewing'],409);
        }
        if ($decision==='verified') {
            $owner=[
              'status'=>$agency['owner_status'],
              'email_verified'=>$agency['email_verified'],
              'phone_verified'=>$agency['phone_verified']
            ];
            $count=$db->prepare('SELECT COUNT(*) AS total FROM customer_agency_documents WHERE agency_id=?');
            if (!$count) throw new RuntimeException('Document review unavailable');
            $count->bind_param('i',$agencyId);
            $count->execute();
            $total=(int)$count->get_result()->fetch_assoc()['total'];
            $readiness=agency_approval_readiness($agency,$owner,$total);
            if (!$readiness['ready']) {
                $db->rollback();json_out(['error'=>'Agency not ready: '.$readiness['reason']],422);
            }
        }
        $stmt=$db->prepare("UPDATE customer_agencies
            SET verification_status=?,rejection_reason=?,verified_at=IF(?='verified',UTC_TIMESTAMP(),NULL),
                verified_by_username=IF(?='verified',?,NULL),reviewed_version=version,version=version+1
            WHERE id=? AND version=? AND verification_status='pending'");
        if (!$stmt) throw new RuntimeException('Agency review update unavailable');
        $reviewReason=$decision==='rejected'?$reason:null;
        $stmt->bind_param('sssssii',$decision,$reviewReason,$decision,$decision,$reviewer,$agencyId,$version);
        if (!$stmt->execute() || $stmt->affected_rows!==1) throw new RuntimeException('Agency review update conflict');
        $event=$db->prepare('INSERT INTO customer_agency_verification_events(agency_id,previous_status,next_status,reason,reviewer_username) VALUES (?,?,?,?,?)');
        if (!$event) throw new RuntimeException('Review audit unavailable');
        $prior='pending';
        $eventReason=$reason!==''?$reason:null;
        $event->bind_param('issss',$agencyId,$prior,$decision,$eventReason,$reviewer);
        if (!$event->execute()) throw new RuntimeException('Review audit write failed');
        $db->commit();
        json_out(['agency_id'=>$agencyId,'verification_status'=>$decision,'version'=>$version+1]);
    } catch (Throwable $e) {
        $db->rollback();throw $e;
    }
} catch (Throwable $e) {
    error_log('Agency review request failed');
    json_out(['error'=>'Agency review temporarily unavailable'],503);
}
