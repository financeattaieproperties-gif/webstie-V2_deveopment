<?php
declare(strict_types=1);
/**
 * Rejected agency correction workflow: rejected -> revision -> pending.
 * No client-supplied review state, agency owner, or reviewer identity accepted.
 */
require_once __DIR__.'/../bootstrap.php';
require_once __DIR__.'/../customer-cors.php';
require_once __DIR__.'/../customer-identity.php';
require_once __DIR__.'/../customer-firebase-auth.php';
require_once __DIR__.'/../customer-auth-context.php';
require_once __DIR__.'/../customer-agency-verification-policy.php';
customer_api_cors();
header('Cache-Control: no-store, private');
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') json_out(['error'=>'POST only'],405);
$input=body();
if (array_diff(array_keys($input),['action','version']) ||
    !in_array($input['action']??null,['start_revision','resubmit'],true) ||
    !is_int($input['version']??null) || $input['version']<1) {
    json_out(['error'=>'Valid action and current version required'],422);
}
$action=$input['action'];
try {
    $db=db();
    $owner=require_customer_context($db);
    $customerId=(int)$owner['id'];
    $db->begin_transaction();
    try {
        $stmt=$db->prepare('SELECT * FROM customer_agencies WHERE owner_customer_id=? FOR UPDATE');
        if (!$stmt) throw new RuntimeException('Agency lock unavailable');
        $stmt->bind_param('i',$customerId);
        if (!$stmt->execute()) throw new RuntimeException('Agency lookup failed');
        $agency=$stmt->get_result()->fetch_assoc();
        if (!$agency) { $db->rollback();json_out(['error'=>'Agency application required'],404); }
        if ((int)$agency['version']!==$input['version']) {
            $db->rollback();json_out(['error'=>'Agency changed; reload and retry'],409);
        }
        if ($agency['operational_status']!=='active') {
            $db->rollback();json_out(['error'=>'Agency unavailable'],403);
        }
        $previous=$agency['verification_status'];
        $expected=$action==='start_revision'?'rejected':'revision';
        if ($previous!==$expected) {
            $db->rollback();json_out(['error'=>'Agency is not in the required review state'],409);
        }
        if ($action==='resubmit') {
            $count=$db->prepare('SELECT COUNT(*) AS total FROM customer_agency_documents WHERE agency_id=? AND is_current=1');
            if (!$count) throw new RuntimeException('Document check unavailable');
            $agencyId=(int)$agency['id'];
            $count->bind_param('i',$agencyId);
            if (!$count->execute()) throw new RuntimeException('Document check failed');
            $total=(int)$count->get_result()->fetch_assoc()['total'];
            $readiness=agency_approval_readiness($agency,$owner,$total);
            if (!$readiness['ready']) {
                $db->rollback();json_out(['error'=>'Application incomplete: '.$readiness['reason']],422);
            }
        }
        $next=$action==='start_revision'?'revision':'pending';
        $agencyId=(int)$agency['id'];
        $stmt=$db->prepare("UPDATE customer_agencies SET verification_status=?,rejection_reason=IF(?='pending',NULL,rejection_reason),
            business_contact_reviewed_at=NULL,business_contact_reviewed_by=NULL,
            resubmitted_at=IF(?='pending',UTC_TIMESTAMP(),resubmitted_at),
            review_round=IF(?='pending',review_round+1,review_round),version=version+1
            WHERE id=? AND owner_customer_id=? AND version=? AND verification_status=?");
        if (!$stmt) throw new RuntimeException('Agency update unavailable');
        $stmt->bind_param('ssssiiis',$next,$next,$next,$next,$agencyId,$customerId,$input['version'],$expected);
        if (!$stmt->execute() || $stmt->affected_rows!==1) throw new RuntimeException('Agency revision conflict');
        $stmt=$db->prepare('INSERT INTO customer_agency_verification_events (agency_id,previous_status,next_status,reason,review_round) VALUES (?,?,?,?,?)');
        if (!$stmt) throw new RuntimeException('Agency audit unavailable');
        $reason=$action==='resubmit'?'Customer submitted revised application':'Customer opened correction window';
        $round=(int)$agency['review_round']+($action==='resubmit'?1:0);
        $stmt->bind_param('isssi',$agencyId,$previous,$next,$reason,$round);
        if (!$stmt->execute()) throw new RuntimeException('Agency audit failed');
        $db->commit();
        json_out(['agency_id'=>$agencyId,'verification_status'=>$next,'version'=>$input['version']+1,'review_round'=>$round]);
    } catch (Throwable $e) {
        $db->rollback();
        throw $e;
    }
} catch (Throwable $e) {
    error_log('Agency revision request failed');
    json_out(['error'=>'Agency revision temporarily unavailable'],503);
}
