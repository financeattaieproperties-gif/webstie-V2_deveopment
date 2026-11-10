<?php
/**
 * Public Visual Configuration Read Endpoint
 * ZERO MySQL calls. Returns published JSON configuration.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/lib/VisualConfigStore.php';

$data = VisualConfigStore::readPublished();

if (!$data) {
    // If not yet initialized on server, return 404 so client uses built-in default
    http_response_code(404);
    echo json_encode(['error' => 'No published visual configuration found']);
    exit;
}

// Calculate ETag for browser caching
$etag = md5(json_encode($data));
header('ETag: "' . $etag . '"');
header('Cache-Control: public, max-age=60, stale-while-revalidate=300');

if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH'], '"') === $etag) {
    http_response_code(304);
    exit;
}

echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
