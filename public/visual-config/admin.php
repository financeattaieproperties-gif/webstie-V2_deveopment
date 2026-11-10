<?php
/**
 * Admin Visual Configuration Management Endpoint
 * Supports GET (fetch draft), PUT (save draft), POST (publish draft).
 * ZERO MySQL calls.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, PUT, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Session check
$isAdmin = !empty($_SESSION['admin']) || !empty($_SESSION['admin_user']);
// For development or if authenticated
if (!$isAdmin && getenv('APP_ENV') !== 'development' && $_SERVER['SERVER_NAME'] !== 'localhost') {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

require_once __DIR__ . '/lib/VisualConfigStore.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $data = VisualConfigStore::readDraft();
    if (!$data) {
        $data = VisualConfigStore::readPublished();
    }
    echo json_encode($data ?: ['schemaVersion' => 1, 'projects' => []]);
    exit;
}

if ($method === 'PUT') {
    $body = file_get_contents('php://input');
    $payload = json_decode($body, true);
    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON payload']);
        exit;
    }

    $ok = VisualConfigStore::writeDraft($payload);
    if ($ok) {
        echo json_encode(['success' => true, 'revision' => isset($payload['revision']) ? $payload['revision'] : 'rev_' . time()]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save draft']);
    }
    exit;
}

if ($method === 'POST') {
    $body = file_get_contents('php://input');
    $payload = json_decode($body, true);
    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON payload']);
        exit;
    }

    $ok = VisualConfigStore::publishDraft($payload);
    if ($ok) {
        echo json_encode(['success' => true, 'revision' => isset($payload['revision']) ? $payload['revision'] : 'pub_' . time()]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to publish configuration']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
