<?php
declare(strict_types=1);
// Only fictional databases created by this test harness may be queried or removed.
if (getenv('STAFF_LOCAL_TEST') !== '1') throw new RuntimeException('Fixture opt-in required');
$name = getenv('WEBSITE_TEST_DATABASE');
if (!is_string($name) || !preg_match('/^attaie_v2_test_[a-f0-9]{20}$/D', $name)) {
    throw new RuntimeException('Refusing nonfixture database');
}
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$db = new mysqli('127.0.0.1', 'root', '', '', 3397);
$action = $argv[1] ?? 'setup';
if ($action === 'drop') { $db->query("DROP DATABASE IF EXISTS `$name`"); exit; }
if ($action === 'setup') $db->query("CREATE DATABASE `$name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$db->select_db($name);
if ($db->query('SELECT DATABASE()')->fetch_row()[0] !== $name) throw new RuntimeException('Wrong target');
if ($action === 'count') { echo $db->query('SELECT COUNT(*) FROM leads')->fetch_row()[0]; exit; }
if ($action === 'events') { echo json_encode($db->query('SELECT inquiry_id,previous_status,next_status,notes,version FROM website_inquiry_events ORDER BY id')->fetch_all(MYSQLI_ASSOC)); exit; }
if ($action === 'race') {
    require __DIR__ . '/../../../public/api/inquiry-service.php';
    echo json_encode(save_website_inquiry($db, json_decode(getenv('WEBSITE_TEST_PAYLOAD'), true, 512, JSON_THROW_ON_ERROR)));
    exit;
}
if ($action === 'upgrade') {
    // Exercise additive SQL on the historical shape, with a row that must survive unchanged.
    $db->query('DROP TABLE website_inquiry_events');
    $db->query('ALTER TABLE leads DROP INDEX uq_inquiry_request, DROP INDEX uq_inquiry_receipt,
        DROP COLUMN client_request_id, DROP COLUMN payload_hash, DROP COLUMN receipt_reference,
        DROP COLUMN receipt_submitted_at, DROP COLUMN followup_status, DROP COLUMN followup_notes,
        DROP COLUMN followup_at, DROP COLUMN version');
    $db->query("INSERT INTO leads (name,email,phone,stage,status) VALUES ('Legacy fixture','legacy@example.test','0700000000','Contacted','Existing')");
    $db->multi_query(file_get_contents(__DIR__ . '/../../../public/api/migrations/2026-11-13-inquiry-receipts.sql'));
    do { if ($result = $db->store_result()) $result->free(); } while ($db->more_results() && $db->next_result());
    echo json_encode($db->query("SELECT name,stage,status,receipt_reference,client_request_id,followup_status,version FROM leads WHERE email='legacy@example.test'")->fetch_assoc());
    exit;
}
if ($action === 'setup') {
    $db->multi_query(file_get_contents(__DIR__ . '/../../../public/api/schema.sql'));
    do { if ($result = $db->store_result()) $result->free(); } while ($db->more_results() && $db->next_result());
}
