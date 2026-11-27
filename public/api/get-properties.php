<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/property-visibility.php';
cors();
header('Content-Type: application/json; charset=utf-8');

$db     = db();
$where  = [public_property_visibility_sql()];
$params = [];
$types  = '';

$requestedStatus = public_property_requested_status($_GET['status'] ?? null);
if ($requestedStatus === '__not_public__') {
    json_out([], 200);
}
if ($requestedStatus !== null) {
    $where[]  = 'status = ?';
    $params[] = $requestedStatus;
    $types   .= 's';
}
if (!empty($_GET['type'])) {
    $where[]  = 'type = ?';
    $params[] = $_GET['type'];
    $types   .= 's';
}
if (!empty($_GET['listing_type'])) {
    $where[]  = 'listing_type = ?';
    $params[] = $_GET['listing_type'];
    $types   .= 's';
}
if (!empty($_GET['serial_number'])) {
    $where[] = 'serial_number = ?';
    $params[] = trim($_GET['serial_number']);
    $types .= 's';
} elseif (!empty($_GET['search'])) {
    $where[] = '(serial_number = ? OR title LIKE ? OR location LIKE ?)';
    $term = trim($_GET['search']);
    $params[] = $term; $params[] = '%' . $term . '%'; $params[] = '%' . $term . '%';
    $types .= 'sss';
}

$sql  = 'SELECT * FROM properties WHERE ' . implode(' AND ', $where) . ' ORDER BY created_at DESC';
$stmt = $db->prepare($sql);
if (!$stmt) {
    echo json_encode([]);
    exit;
}
if ($params) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();
$rows   = [];
while ($row = $result->fetch_assoc()) {
    $row['id']    = (int) $row['id'];
    $row['price'] = (float) $row['price'];
    $row['beds']  = $row['beds']  !== null ? (int) $row['beds']   : null;
    $row['baths'] = $row['baths'] !== null ? (int) $row['baths']  : null;
    $row['area']  = $row['area']  !== null ? (float) $row['area'] : null;
    $row['floor'] = $row['floor'] !== null ? (int) $row['floor']  : null;
    // Decode gallery_images JSON string → array
    if (!empty($row['gallery_images'])) {
        $decoded = json_decode($row['gallery_images'], true);
        $row['gallery_images'] = is_array($decoded) ? $decoded : [];
    } else {
        $row['gallery_images'] = [];
    }
    $row['floor_plan_url']   = !empty($row['floor_plan_url']) ? $row['floor_plan_url'] : null;
    $row['three_d_plan_url'] = !empty($row['three_d_plan_url']) ? $row['three_d_plan_url'] : null;
    $rows[] = $row;
}
echo json_encode($rows);


