<?php
// Copy this file to db.php and fill in real values before deploying to cPanel.
mysqli_report(MYSQLI_REPORT_OFF);

define('DB_HOST',    'localhost');
define('DB_USER',    'your_cpanel_db_user');
define('DB_PASS',    'your_cpanel_db_password');
define('DB_NAME',    'your_cpanel_db_name');
define('ADMIN_USER', 'admin');
define('ADMIN_PASS', 'choose_a_strong_password');

// V2 chat: set this to an existing private directory OUTSIDE every web document root.
// Copy and verify existing chat data before switching; see docs/staff/v2-website-chat-migration.md.
// An empty, public, inaccessible, or corrupt store fails closed; no local delivery is fabricated.
define('WEBSITE_CHAT_STORE_DIR', '');

// ── Etisalat CPaaS Click-to-Call (CTC) Configuration ───────────────────────────
// Fill these in from your Etisalat CPaaS account manager (or set via cPanel Env Vars):
define('CTC_BASE_URL',          ''); // e.g. 'https://cpaas.etisalat.af/Cpaas/api/clicktocall'
define('CTC_USERNAME',          ''); // Your Etisalat CPaaS API username
define('CTC_PASSWORD',          ''); // Your Etisalat CPaaS API password
define('CTC_CLI',               ''); // Caller ID number provided by Etisalat (e.g. '93782222279')
define('CTC_CALLCENTER_NUMBER', '93782222279'); // Your call-center/agent number that rings FIRST (apartyno)

function ctc_env(string $key, string $default = ''): string {
    $envVal = getenv($key);
    if ($envVal !== false && trim((string) $envVal) !== '') {
        return trim((string) $envVal);
    }
    if (!empty($_ENV[$key])) {
        return trim((string) $_ENV[$key]);
    }
    if (!empty($_SERVER[$key])) {
        return trim((string) $_SERVER[$key]);
    }
    if (defined($key) && trim((string) constant($key)) !== '') {
        return trim((string) constant($key));
    }
    return $default;
}

function db(): mysqli {
    static $conn = null;
    if ($conn === null) {
        $conn = mysqli_init();
        if ($conn && defined('MYSQLI_OPT_INT_AND_FLOAT_NATIVE')) {
            $conn->options(MYSQLI_OPT_INT_AND_FLOAT_NATIVE, 1);
        }
        $connected = $conn ? @$conn->real_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME) : false;
        if (!$connected || $conn->connect_error) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'DB connection failed']);
            exit;
        }
        $conn->set_charset('utf8mb4');
    }
    return $conn;
}

function init_secure_session(): void {
    if (session_status() === PHP_SESSION_NONE) {
        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'secure'   => $isHttps,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }
}

function csrf_token(): string {
    init_secure_session();
    if (empty($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_csrf_token(): void {
    $expected = csrf_token();
    $provided = trim((string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''));
    if ($provided === '' || !hash_equals($expected, $provided)) {
        json_out(['error' => 'Invalid or missing CSRF token'], 403);
    }
}

function cors(): void {
    header('Vary: Origin');
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = [
        'https://attaieproperties.af',
        'https://www.attaieproperties.af',
        'https://attaieproperties.com',
        'https://www.attaieproperties.com',
        'https://website.attaieproperties.com',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:8888',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
    ];
    $extra = ctc_env('ALLOWED_ORIGINS', '');
    if ($extra !== '') {
        foreach ( explode(',', $extra) as $item ) {
            $trimmed = trim($item);
            if ($trimmed !== '') $allowed[] = $trimmed;
        }
    }
    $isAllowed = in_array($origin, $allowed, true)
        || (bool) preg_match('#^https://[a-z0-9-]+\.run\.app$#i', $origin)
        || strpos($origin, 'file://') === 0;

    if ($origin !== '' && $isAllowed) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Credentials: true');
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

function json_out(mixed $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function require_admin(): void {
    init_secure_session();
    if (empty($_SESSION['admin'])) {
        json_out(['error' => 'Unauthorized'], 401);
    }
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if (in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'], true)) {
        verify_csrf_token();
    }
}

function body(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}


