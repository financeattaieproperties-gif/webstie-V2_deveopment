<?php
declare(strict_types=1);

/** Restricted CORS for token-based customer APIs, independent of legacy admin sessions. */
function customer_api_cors(): void {
    header('Vary: Origin');
    // Legacy bootstrap may set broader CORS; customer routes must override it.
    header_remove('Access-Control-Allow-Origin');
    header_remove('Access-Control-Allow-Credentials');

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = [
        'https://attaieproperties.com',
        'https://www.attaieproperties.com',
        'https://attaieproperties.af',
        'https://www.attaieproperties.af',
        'https://website.attaieproperties.com',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
    ];
    $configured = getenv('CUSTOMER_ALLOWED_ORIGINS');
    if (is_string($configured) && $configured !== '') {
        foreach (explode(',', $configured) as $item) {
            $value = trim($item);
            if (preg_match('#^https://[a-z0-9.-]+(?::[0-9]{2,5})?$#iD', $value)) {
                $allowed[] = $value;
            }
        }
    }
    if (in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    }
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 300');
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(in_array($origin, $allowed, true) ? 204 : 403);
        exit;
    }
}
