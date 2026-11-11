<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-store');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('X-Content-Type-Options: nosniff');
$app = getenv('STAFF_APP_DIRECTORY');
$configFile = null;
$locator = __DIR__ . '/paths.php';
if (is_file($locator)) {
    $paths = require $locator;
    if (!is_array($paths) || !is_string($paths['app_directory'] ?? null) || !is_string($paths['config_file'] ?? null)) {
        http_response_code(503);
        echo json_encode(['error'=>['code'=>'NOT_CONFIGURED','message'=>'Private staff paths are not configured.']]);
        exit;
    }
    $app = $paths['app_directory'];
    $configFile = $paths['config_file'];
}
$root = realpath($_SERVER['DOCUMENT_ROOT'] ?? __DIR__);
$resolved = $app ? realpath($app) : false;
if (!$resolved || !$root || str_starts_with(str_replace('\\', '/', $resolved) . '/', rtrim(str_replace('\\', '/', $root), '/') . '/') || !is_file($resolved . '/src/App.php')) {
    http_response_code(503);
    echo json_encode(['error'=>['code'=>'NOT_CONFIGURED','message'=>'Staff service is not configured. Contact your administrator.']]);
    exit;
}
require $resolved . '/src/App.php';
Staff\App::run($resolved, $configFile);
