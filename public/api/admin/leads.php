<?php
require_once __DIR__ . '/../bootstrap.php';
cors();
require_admin();
require_once __DIR__ . '/../inquiry-service.php';

function website_admin_inquiry_row(array $row): array {
    $row['id'] = (int)$row['id'];
    $row['version'] = (int)$row['version'];
    return $row;
}

try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $db = db();
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $search = $_GET['search'] ?? '';
        if (!is_string($search) || strlen($search) > 1000) json_out(['error'=>'Invalid search'], 422);
        $search = trim($search);
        $stmt = $db->prepare('SELECT * FROM leads WHERE ? = \'\' OR LOCATE(?,name)>0 OR LOCATE(?,email)>0 OR LOCATE(?,phone)>0 OR LOCATE(?,property_name)>0 OR LOCATE(?,message)>0 OR LOCATE(?,receipt_reference)>0 ORDER BY created_at DESC,id DESC');
        $stmt->bind_param('sssssss', $search, $search, $search, $search, $search, $search, $search);
        $stmt->execute();
        json_out(array_map('website_admin_inquiry_row', $stmt->get_result()->fetch_all(MYSQLI_ASSOC)));
    }
    if ($_SERVER['REQUEST_METHOD'] !== 'PUT') json_out(['error'=>'Method not allowed'], 405);
    $input = body();
    $id = $input['id'] ?? null;
    $version = $input['version'] ?? null;
    $status = $input['status'] ?? null;
    $notes = $input['notes'] ?? null;
    $followupAt = $input['followupAt'] ?? null;
    if (!is_int($id) || $id < 1 || !is_int($version) || $version < 1 || !in_array($status, ['new','in_progress','resolved'], true) || !is_string($notes) || strlen($notes) > 16000) {
        json_out(['error'=>'Valid inquiry, version, status and notes required'], 422);
    }
    if ($followupAt !== null) {
        $date = is_string($followupAt) ? DateTimeImmutable::createFromFormat('!Y-m-d\TH:i:s\Z', $followupAt, new DateTimeZone('UTC')) : false;
        if (!$date || $date->format('Y-m-d\TH:i:s\Z') !== $followupAt) json_out(['error'=>'Follow-up time must be a valid UTC timestamp'], 422);
        $followupAt = $date->format('Y-m-d H:i:s');
    }
    $db->begin_transaction();
    try {
        $stmt = $db->prepare('SELECT * FROM leads WHERE id = ? FOR UPDATE');
        $stmt->bind_param('i', $id); $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if (!$row) throw new WebsiteInquiryException('Inquiry not found', 404);
        if ((int)$row['version'] !== $version) throw new WebsiteInquiryException('Inquiry changed. Reload before saving.', 409);
        $stmt = $db->prepare('UPDATE leads SET followup_status=?,followup_notes=?,followup_at=?,version=version+1 WHERE id=? AND version=?');
        $stmt->bind_param('sssii', $status, $notes, $followupAt, $id, $version); $stmt->execute();
        $nextVersion = $version + 1;
        $actor = (string)($_SESSION['admin_user'] ?? 'admin');
        $event = $db->prepare('INSERT INTO website_inquiry_events (inquiry_id,actor,previous_status,next_status,notes,followup_at,version,created_at) VALUES (?,?,?,?,?,?,?,UTC_TIMESTAMP())');
        $event->bind_param('isssssi', $id, $actor, $row['followup_status'], $status, $notes, $followupAt, $nextVersion); $event->execute();
        $stmt = $db->prepare('SELECT * FROM leads WHERE id=?'); $stmt->bind_param('i',$id); $stmt->execute();
        $updated = $stmt->get_result()->fetch_assoc();
        $db->commit();
        json_out(website_admin_inquiry_row($updated));
    } catch (Throwable $error) { $db->rollback(); throw $error; }
} catch (WebsiteInquiryException $error) {
    json_out(['error'=>$error->getMessage()], $error->getCode());
} catch (Throwable $error) {
    json_out(['error'=>'Unable to manage inquiries'], 500);
}
