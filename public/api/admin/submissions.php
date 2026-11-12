<?php
/**
 * Isolated Admin Website Publishing Tasks Endpoint (Phase 5 - UDR-001/002/003)
 *
 * Reads and updates ONLY the isolated Submission Database (`sub_posts`, `sub_post_photos`, `sub_publish_events`)
 * and publishes approved property listings into the Website Database (`properties`).
 * Admin NEVER reads or writes the Internal Office CRM Database (`inv_*`, `cc_*`, `crm_*`, `hr_*`, `fin_*`, `eng_*`).
 */
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../sitemap-helper.php';
cors();
require_admin();

function submission_db(): mysqli {
    static $subConn = null;
    if ($subConn !== null) return $subConn;
    $host = getenv('SUBMISSION_DB_HOST') ?: (defined('SUBMISSION_DB_HOST') ? SUBMISSION_DB_HOST : DB_HOST);
    $user = getenv('SUBMISSION_DB_USER') ?: (defined('SUBMISSION_DB_USER') ? SUBMISSION_DB_USER : DB_USER);
    $pass = getenv('SUBMISSION_DB_PASS') ?: (defined('SUBMISSION_DB_PASS') ? SUBMISSION_DB_PASS : DB_PASS);
    $name = getenv('SUBMISSION_DB_NAME') ?: (defined('SUBMISSION_DB_NAME') ? SUBMISSION_DB_NAME : DB_NAME);
    $subConn = new mysqli($host, $user, $pass, $name);
    if ($subConn->connect_error) {
        json_out(['error' => 'Submission database connection failed'], 500);
    }
    $subConn->set_charset('utf8mb4');
    return $subConn;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sdb = submission_db();
    $res = $sdb->query('SELECT * FROM sub_posts ORDER BY submitted_at DESC');
    if (!$res) {
        json_out([]);
    }
    $items = [];
    while ($row = $res->fetch_assoc()) {
        $postId = (int) $row['id'];
        $photoStmt = $sdb->prepare('SELECT photo_url FROM sub_post_photos WHERE sub_post_id = ? ORDER BY sort_order ASC');
        $photoStmt->bind_param('i', $postId);
        $photoStmt->execute();
        $photoRes = $photoStmt->get_result();
        $photos = [];
        while ($p = $photoRes->fetch_assoc()) {
            $photos[] = $p['photo_url'];
        }
        $items[] = [
            'id' => $postId,
            'marketingEntryId' => (int) $row['marketing_entry_id'],
            'serialNumber' => $row['serial_number'],
            'customerName' => $row['customer_name'],
            'address' => $row['address'],
            'propertyType' => $row['property_type'],
            'propertyInfoNote' => $row['property_info_note'],
            'photos' => $photos,
            'socialPlatform' => $row['social_platform'],
            'publishStatus' => $row['publish_status'],
            'rejectionReason' => $row['rejection_reason'],
            'submittedBy' => $row['submitted_by_name'],
            'submittedAt' => $row['submitted_at'],
            'reviewedAt' => $row['reviewed_at'],
            'publishedAt' => $row['published_at'],
            'websitePropertyId' => $row['website_property_id'] !== null ? (int) $row['website_property_id'] : null,
            'version' => (int) $row['version'],
        ];
    }
    json_out($items);
}

if ($method === 'PUT' || $method === 'POST') {
    $b = body();
    $id = intval($b['id'] ?? 0);
    $action = trim((string) ($b['action'] ?? ''));
    if (!$id || !in_array($action, ['approve', 'publish', 'reject'], true)) {
        json_out(['error' => 'Valid submission id and action (approve|publish|reject) required'], 400);
    }

    $sdb = submission_db();
    $stmt = $sdb->prepare('SELECT * FROM sub_posts WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $current = $stmt->get_result()->fetch_assoc();
    if (!$current) {
        json_out(['error' => 'Submission not found'], 404);
    }

    $prevStatus = $current['publish_status'];

    if ($action === 'approve') {
        if ($prevStatus !== 'Submitted') {
            json_out(['error' => 'Only Submitted entries can be approved'], 409);
        }
        $nextStatus = 'Approved';
        $upd = $sdb->prepare("UPDATE sub_posts SET publish_status = 'Approved', reviewed_at = UTC_TIMESTAMP(), version = version + 1 WHERE id = ?");
        $upd->bind_param('i', $id);
        $upd->execute();
    } elseif ($action === 'reject') {
        if ($prevStatus === 'Published') {
            json_out(['error' => 'Published entries cannot be rejected'], 409);
        }
        $reason = trim((string) ($b['reason'] ?? 'Rejected by Admin'));
        $nextStatus = 'Rejected';
        $upd = $sdb->prepare("UPDATE sub_posts SET publish_status = 'Rejected', rejection_reason = ?, reviewed_at = UTC_TIMESTAMP(), version = version + 1 WHERE id = ?");
        $upd->bind_param('si', $reason, $id);
        $upd->execute();
    } else {
        // action === 'publish'
        if ($prevStatus !== 'Approved') {
            json_out(['error' => 'Submission must be Approved before publishing to website'], 409);
        }
        $nextStatus = 'Published';
        $websitePropId = !empty($b['websitePropertyId']) ? intval($b['websitePropertyId']) : null;
        $upd = $sdb->prepare("UPDATE sub_posts SET publish_status = 'Published', published_at = UTC_TIMESTAMP(), website_property_id = ?, version = version + 1 WHERE id = ?");
        $upd->bind_param('ii', $websitePropId, $id);
        $upd->execute();
    }

    $evt = $sdb->prepare("INSERT INTO sub_publish_events (sub_post_id, actor_role, previous_status, next_status, notes) VALUES (?, 'admin', ?, ?, ?)");
    $note = trim((string) ($b['reason'] ?? $b['note'] ?? ''));
    $evt->bind_param('isss', $id, $prevStatus, $nextStatus, $note);
    $evt->execute();

    json_out(['success' => true, 'id' => $id, 'publishStatus' => $nextStatus]);
}
