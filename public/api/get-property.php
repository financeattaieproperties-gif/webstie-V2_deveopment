<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/property-visibility.php';
cors();
header('Content-Type: application/json; charset=utf-8');

$id = intval($_GET['id'] ?? 0);
if (!$id) {
    json_out(['error' => 'id required'], 400);
}

$stmt = db()->prepare('SELECT * FROM properties WHERE id = ? AND ' . public_property_detail_visibility_sql() . ' LIMIT 1');
if (!$stmt) {
    json_out(['error' => 'Not found'], 404);
}
$stmt->bind_param('i', $id);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
if (!$row) {
    json_out(['error' => 'Not found'], 404);
}

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

echo json_encode($row);


