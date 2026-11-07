<?php
declare(strict_types=1);

namespace Attaie\AiChat;

final class Security
{
    public static function initSession(): void
    {
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
            @session_start();
        }
    }

    public static function applyCors(): void
    {
        header('Vary: Origin');
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
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

    public static function jsonResponse(array $payload, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function getCsrfToken(): string
    {
        self::initSession();
        if (empty($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    public static function verifyCsrfToken(): void
    {
        $expected = self::getCsrfToken();
        $provided = trim((string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''));
        if ($provided === '' || !hash_equals($expected, $provided)) {
            self::jsonResponse(['error' => 'Invalid or missing CSRF token.'], 403);
        }
    }

    public static function requireAdminAuth(): void
    {
        self::initSession();
        if (empty($_SESSION['admin'])) {
            self::jsonResponse(['error' => 'Unauthorized administrator access.'], 401);
        }
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        if (in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'], true)) {
            self::verifyCsrfToken();
        }
    }

    /**
     * Returns a cryptographic session ownership token bound to the visitor's server session.
     * Prevents one customer from reading or modifying another customer's conversation by ID alone.
     */
    public static function getCustomerOwnerToken(): string
    {
        self::initSession();
        if (empty($_SESSION['ai_chat_owner_token']) || !is_string($_SESSION['ai_chat_owner_token'])) {
            $_SESSION['ai_chat_owner_token'] = bin2hex(random_bytes(24));
        }
        return hash('sha256', $_SESSION['ai_chat_owner_token']);
    }

    public static function getClientIpHash(): string
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        return hash('sha256', 'attaie_rl_' . $ip);
    }

    /**
     * Enforces IP + session rate limits resistant to trivial session resets.
     */
    public static function enforceRateLimit(string $bucket = 'chat', int $maxRequests = Config::RATE_LIMIT_MAX_REQUESTS, int $windowSec = Config::RATE_LIMIT_WINDOW_SEC): void
    {
        $ipHash = self::getClientIpHash();
        $file = Config::getPrivateDir() . '/rate_limits.json';
        $now = time();

        $fp = @fopen($file, 'c+');
        if (!$fp) {
            return;
        }
        @flock($fp, LOCK_EX);
        $raw = stream_get_contents($fp);
        $data = is_string($raw) && $raw !== '' ? (json_decode($raw, true) ?? []) : [];
        if (!is_array($data)) {
            $data = [];
        }

        $key = $bucket . ':' . $ipHash;
        $timestamps = isset($data[$key]) && is_array($data[$key]) ? $data[$key] : [];
        $timestamps = array_values(array_filter($timestamps, static fn($ts) => is_int($ts) && ($now - $ts) < $windowSec));

        if (count($timestamps) >= $maxRequests) {
            @flock($fp, LOCK_UN);
            @fclose($fp);
            self::jsonResponse([
                'error' => 'تعداد پیام‌های شما در دقیقه بیش از حد مجاز است. لطفاً چند لحظه صبر کنید. / Rate limit exceeded. Please wait a moment.',
                'code'  => 'RATE_LIMITED',
            ], 429);
        }

        $timestamps[] = $now;
        $data[$key] = $timestamps;

        // Prune expired buckets
        if (count($data) > 500) {
            foreach ($data as $k => $list) {
                if (!is_array($list)) {
                    unset($data[$k]);
                    continue;
                }
                $filtered = array_values(array_filter($list, static fn($ts) => is_int($ts) && ($now - $ts) < $windowSec));
                if (empty($filtered)) {
                    unset($data[$k]);
                } else {
                    $data[$k] = $filtered;
                }
            }
        }

        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($data));
        fflush($fp);
        @flock($fp, LOCK_UN);
        @fclose($fp);
    }

    /**
     * Redacts sensitive patterns (API keys, Bearer tokens, phone numbers) before writing diagnostic logs.
     */
    public static function redactSecrets(string $text): string
    {
        $patterns = [
            '/\bsk-[A-Za-z0-9_\-]{12,}\b/'          => '[REDACTED_OPENAI_KEY]',
            '/\bsk-ant-[A-Za-z0-9_\-]{12,}\b/'      => '[REDACTED_ANTHROPIC_KEY]',
            '/\bAIza[0-9A-Za-z_\-]{20,}\b/'         => '[REDACTED_GEMINI_KEY]',
            '/Bearer\s+[A-Za-z0-9._\-]+/i'          => 'Bearer [REDACTED]',
            '/x-api-key:\s*[^\s,;]+/i'              => 'x-api-key: [REDACTED]',
            '/x-goog-api-key:\s*[^\s,;]+/i'         => 'x-goog-api-key: [REDACTED]',
        ];
        return (string) preg_replace(array_keys($patterns), array_values($patterns), $text);
    }

    public static function logDiagnostic(string $event, array $context = []): void
    {
        $logFile = Config::getPrivateDir() . '/ai_diagnostic.log';
        $safeContext = self::redactSecrets((string) json_encode($context, JSON_UNESCAPED_UNICODE));
        $line = sprintf("[%s] %s %s\n", gmdate('c'), $event, $safeContext);
        @file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);
    }
}
