<?php
declare(strict_types=1);

/**
 * Attaie Properties — Administrator AI Provider & Model Settings Endpoint (/ai-chat/admin-settings.php)
 *
 * Security invariants:
 * - Requires administrator authentication ($_SESSION['admin']) + CSRF token verification.
 * - Rate-limited against credential brute-force or connection test abuse.
 * - Encrypts API keys server-side via AEAD; never returns full keys after saving.
 * - Enforces fixed provider endpoints and allowlisted tool-capable models.
 */

require_once __DIR__ . '/lib/Config.php';
require_once __DIR__ . '/lib/Crypto.php';
require_once __DIR__ . '/lib/Security.php';
require_once __DIR__ . '/lib/DariNormalizer.php';
require_once __DIR__ . '/lib/Storage.php';
require_once __DIR__ . '/lib/PropertyTools.php';
require_once __DIR__ . '/lib/Providers.php';

use Attaie\AiChat\Config;
use Attaie\AiChat\Crypto;
use Attaie\AiChat\Security;
use Attaie\AiChat\Storage;
use Attaie\AiChat\Providers;

Security::applyCors();
Security::requireAdminAuth();
Security::enforceRateLimit('admin_ai_settings', 25, 60);

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET') {
    Security::jsonResponse([
        'ok'       => true,
        'settings' => Storage::getPublicAdminSettings(),
    ]);
}

if ($method !== 'POST') {
    Security::jsonResponse(['error' => 'Method not allowed.'], 405);
}

$rawBody = file_get_contents('php://input');
$body = is_string($rawBody) ? (json_decode($rawBody, true) ?? []) : [];
if (!is_array($body)) {
    Security::jsonResponse(['error' => 'Invalid JSON body.'], 400);
}

$action   = (string) ($body['action'] ?? '');
$settings = Storage::getSettings();

if ($action === 'save_provider_key') {
    $provider = strtolower(trim((string) ($body['provider'] ?? '')));
    $apiKey   = trim((string) ($body['api_key'] ?? ''));
    $model    = trim((string) ($body['model'] ?? ''));

    if (!Config::isValidProvider($provider)) {
        Security::jsonResponse(['error' => 'Unsupported AI provider.'], 400);
    }
    if ($model === '') {
        $model = Config::PROVIDERS[$provider]['default_model'];
    }
    if (!Config::isValidModel($provider, $model)) {
        Security::jsonResponse(['error' => 'Selected model is not in the approved tool-capable model allowlist.'], 400);
    }
    if ($apiKey === '' || strlen($apiKey) < 12) {
        Security::jsonResponse(['error' => 'Please enter a valid API key.'], 400);
    }

    $settings['providers'][$provider] = [
        'encrypted_key' => Crypto::encrypt($apiKey),
        'masked_key'    => Crypto::maskKey($apiKey),
        'model'         => $model,
        'updated_at'    => gmdate('c'),
        'last_test_ok'  => null,
    ];

    Storage::saveSettings($settings);
    Security::logDiagnostic('admin_saved_provider_key', ['provider' => $provider, 'model' => $model]);

    Security::jsonResponse([
        'ok'       => true,
        'message'  => Config::PROVIDERS[$provider]['label'] . ' API key encrypted and saved.',
        'settings' => Storage::getPublicAdminSettings(),
    ]);
}

if ($action === 'delete_provider_key') {
    $provider = strtolower(trim((string) ($body['provider'] ?? '')));
    if (!Config::isValidProvider($provider)) {
        Security::jsonResponse(['error' => 'Unsupported AI provider.'], 400);
    }

    $settings['providers'][$provider] = [
        'encrypted_key' => '',
        'masked_key'    => '',
        'model'         => Config::PROVIDERS[$provider]['default_model'],
        'updated_at'    => gmdate('c'),
        'last_test_ok'  => null,
    ];

    Storage::saveSettings($settings);
    Security::logDiagnostic('admin_deleted_provider_key', ['provider' => $provider]);

    Security::jsonResponse([
        'ok'       => true,
        'message'  => Config::PROVIDERS[$provider]['label'] . ' credentials deleted.',
        'settings' => Storage::getPublicAdminSettings(),
    ]);
}

if ($action === 'activate_provider') {
    $provider = strtolower(trim((string) ($body['provider'] ?? $settings['active_provider'] ?? 'gemini')));
    $model    = trim((string) ($body['model'] ?? ''));

    if (!Config::isValidProvider($provider)) {
        Security::jsonResponse(['error' => 'Unsupported AI provider.'], 400);
    }
    if ($model === '') {
        $model = (string) ($settings['providers'][$provider]['model'] ?? Config::PROVIDERS[$provider]['default_model']);
    }
    if (!Config::isValidModel($provider, $model)) {
        Security::jsonResponse(['error' => 'Selected model is not supported for tool calling.'], 400);
    }

    $settings['active_provider']       = $provider;
    $settings['active_model']          = $model;
    $settings['providers'][$provider]['model'] = $model;

    if (isset($body['enabled'])) {
        $settings['enabled'] = (bool) $body['enabled'];
    }
    if (isset($body['allow_fallback'])) {
        $settings['allow_fallback'] = (bool) $body['allow_fallback'];
    }
    if (isset($body['max_output_tokens']) && is_numeric($body['max_output_tokens'])) {
        $settings['max_output_tokens'] = max(150, min(1200, (int) $body['max_output_tokens']));
    }
    if (isset($body['daily_request_limit']) && is_numeric($body['daily_request_limit'])) {
        $settings['daily_request_limit'] = max(20, min(10000, (int) $body['daily_request_limit']));
    }
    if (isset($body['retention_days']) && is_numeric($body['retention_days'])) {
        $settings['retention_days'] = max(1, min(365, (int) $body['retention_days']));
    }

    Storage::saveSettings($settings);
    Security::logDiagnostic('admin_updated_ai_config', [
        'active_provider' => $provider,
        'active_model'    => $model,
        'enabled'         => $settings['enabled'],
        'allow_fallback'  => $settings['allow_fallback'],
    ]);

    Security::jsonResponse([
        'ok'       => true,
        'message'  => 'AI Assistant configuration updated.',
        'settings' => Storage::getPublicAdminSettings(),
    ]);
}

if ($action === 'test_connection') {
    $provider = strtolower(trim((string) ($body['provider'] ?? '')));
    $model    = trim((string) ($body['model'] ?? ''));
    $rawKey   = trim((string) ($body['api_key'] ?? ''));

    if (!Config::isValidProvider($provider)) {
        Security::jsonResponse(['error' => 'Unsupported AI provider.'], 400);
    }
    if ($model === '') {
        $model = (string) ($settings['providers'][$provider]['model'] ?? Config::PROVIDERS[$provider]['default_model']);
    }
    if (!Config::isValidModel($provider, $model)) {
        Security::jsonResponse(['error' => 'Selected model is not supported.'], 400);
    }

    $keyToTest = $rawKey !== '' ? $rawKey : Storage::getDecryptedApiKey($provider);
    if ($keyToTest === '') {
        Security::jsonResponse([
            'ok'    => false,
            'error' => 'No API key found for ' . Config::PROVIDERS[$provider]['label'] . '. Please enter and save an API key first.',
        ], 400);
    }

    $testRes = Providers::testConnection($provider, $keyToTest, $model);
    $settings['providers'][$provider]['last_test_ok'] = (bool) ($testRes['ok'] ?? false);
    Storage::saveSettings($settings);

    Security::jsonResponse([
        'ok'       => (bool) ($testRes['ok'] ?? false),
        'message'  => $testRes['message'] ?? null,
        'sample'   => $testRes['sample'] ?? null,
        'error'    => $testRes['error'] ?? null,
        'settings' => Storage::getPublicAdminSettings(),
    ], ($testRes['ok'] ?? false) ? 200 : 400);
}

Security::jsonResponse(['error' => 'Unknown action.'], 400);
