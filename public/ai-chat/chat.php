<?php
declare(strict_types=1);

/**
 * Attaie Properties — Customer AI Real-Estate Chat Endpoint (/ai-chat/chat.php)
 *
 * Strictly separate from public/api/ (complies with AGENTS.md Rule 3).
 */

require_once __DIR__ . '/lib/Config.php';
require_once __DIR__ . '/lib/Crypto.php';
require_once __DIR__ . '/lib/Security.php';
require_once __DIR__ . '/lib/DariNormalizer.php';
require_once __DIR__ . '/lib/Storage.php';
require_once __DIR__ . '/lib/PropertyTools.php';
require_once __DIR__ . '/lib/Providers.php';

use Attaie\AiChat\Config;
use Attaie\AiChat\Security;
use Attaie\AiChat\Storage;
use Attaie\AiChat\Providers;

Security::applyCors();
Security::initSession();

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$action = $_GET['action'] ?? '';
$ownerTokenHash = Security::getCustomerOwnerToken();

if ($method === 'GET') {
    $settings = Storage::getSettings();
    $activeProvider = (string) ($settings['active_provider'] ?? 'gemini');
    $providerLabel  = Config::PROVIDERS[$activeProvider]['label'] ?? 'Google Gemini';

    $convId = isset($_GET['conversation_id']) ? trim((string) $_GET['conversation_id']) : '';
    $conversation = null;

    if ($convId !== '') {
        try {
            $loaded = Storage::loadOrCreateCustomerConversation($convId, $ownerTokenHash);
            unset($loaded['owner_token_hash'], $loaded['lead_hash']);
            $conversation = $loaded;
        } catch (\Throwable $e) {
            // Do not leak another customer's conversation; return null conversation so client starts fresh
            $conversation = null;
        }
    }

    Security::jsonResponse([
        'ok'                    => true,
        'enabled'               => (bool) ($settings['enabled'] ?? true),
        'active_provider'       => $activeProvider,
        'active_provider_label' => $providerLabel,
        'csrf_token'            => Security::getCsrfToken(),
        'conversation'          => $conversation,
    ]);
}

if ($method !== 'POST') {
    Security::jsonResponse(['error' => 'Method not allowed.'], 405);
}

Security::enforceRateLimit('chat', Config::RATE_LIMIT_MAX_REQUESTS, Config::RATE_LIMIT_WINDOW_SEC);

$rawBody = file_get_contents('php://input');
$body = is_string($rawBody) ? (json_decode($rawBody, true) ?? []) : [];
if (!is_array($body)) {
    Security::jsonResponse(['error' => 'Invalid JSON request body.'], 400);
}

$settings = Storage::getSettings();
if (empty($settings['enabled'])) {
    Security::jsonResponse([
        'error' => 'دستیار هوشمند موقتاً غیرفعال است. لطفاً از گزینه ارتباط با مشاور انسانی استفاده کنید. / AI Assistant is currently disabled.',
        'code'  => 'AI_DISABLED',
    ], 503);
}

$message = trim((string) ($body['message'] ?? ''));
if ($message === '') {
    Security::jsonResponse(['error' => 'لطفاً پیام خود را بنویسید. / Message cannot be empty.'], 400);
}
if (mb_strlen($message, 'UTF-8') > Config::MAX_MESSAGE_CHARS) {
    Security::jsonResponse([
        'error' => 'پیام شما بیش از حد طولانی است (حداکثر ۱۲۰۰ حرف). / Message exceeds maximum length.',
        'code'  => 'MESSAGE_TOO_LONG',
    ], 400);
}

$requestedConvId = isset($body['conversation_id']) && is_string($body['conversation_id'])
    ? trim($body['conversation_id'])
    : '';
$pageContext = isset($body['page_context']) && is_string($body['page_context'])
    ? trim($body['page_context'])
    : '';
$contextPropertyId = isset($body['property_id']) && is_numeric($body['property_id'])
    ? (int) $body['property_id']
    : null;

try {
    $conv = Storage::loadOrCreateCustomerConversation($requestedConvId, $ownerTokenHash, [
        'provider'         => $settings['active_provider'] ?? 'gemini',
        'model'            => $settings['active_model'] ?? 'gemini-2.5-flash',
        'last_property_id' => $contextPropertyId,
        'page_context'     => $pageContext,
    ]);
} catch (\RuntimeException $e) {
    if ($e->getMessage() === 'CONVERSATION_OWNERSHIP_MISMATCH') {
        Security::jsonResponse([
            'error' => 'دسترسی به این گفتگو مجاز نیست. / Unauthorized conversation access.',
            'code'  => 'OWNERSHIP_MISMATCH',
        ], 403);
    }
    Security::jsonResponse(['error' => 'Could not initialize conversation.'], 500);
}

// Duplicate request protection (reject identical consecutive message sent within 4 seconds)
$messages = is_array($conv['messages'] ?? null) ? $conv['messages'] : [];
if (!empty($messages)) {
    $lastUserMsg = null;
    for ($i = count($messages) - 1; $i >= 0; $i--) {
        if (($messages[$i]['sender'] ?? '') === 'customer') {
            $lastUserMsg = $messages[$i];
            break;
        }
    }
    if ($lastUserMsg && ($lastUserMsg['text'] ?? '') === $message) {
        $lastTs = strtotime((string) ($lastUserMsg['created_at'] ?? ''));
        if ($lastTs !== false && (time() - $lastTs) < 4) {
            Security::jsonResponse([
                'error' => 'این پیام همین لحظه ارسال شد. / Duplicate request detected.',
                'code'  => 'DUPLICATE_REQUEST',
            ], 409);
        }
    }
}

$effectivePropertyId = $contextPropertyId ?? (isset($conv['last_property_id']) ? (int) $conv['last_property_id'] : null);

$orchestrated = Providers::orchestrateTurn($message, $messages, $effectivePropertyId);

$now = gmdate('c');
$userMsgRecord = [
    'id'         => 'msg_' . bin2hex(random_bytes(6)),
    'sender'     => 'customer',
    'text'       => $message,
    'created_at' => $now,
];
$assistantMsgRecord = [
    'id'              => 'msg_' . bin2hex(random_bytes(6)),
    'sender'          => 'assistant',
    'text'            => (string) ($orchestrated['reply'] ?? ''),
    'cards'           => $orchestrated['cards'] ?? [],
    'provider'        => $orchestrated['provider'] ?? 'grounded_db',
    'model'           => $orchestrated['model'] ?? '',
    'suggest_handoff' => (bool) ($orchestrated['suggest_handoff'] ?? false),
    'created_at'      => $now,
];

$updatedConv = Storage::appendExchange(
    $conv['id'],
    $ownerTokenHash,
    $userMsgRecord,
    $assistantMsgRecord,
    [
        'last_property_id' => $orchestrated['last_property_id'] ?? $effectivePropertyId,
        'language'         => $orchestrated['language'] ?? 'fa',
        'page_context'     => $pageContext !== '' ? $pageContext : ($conv['page_context'] ?? null),
    ]
);

unset($updatedConv['owner_token_hash'], $updatedConv['lead_hash']);

Security::jsonResponse([
    'ok'           => true,
    'conversation' => $updatedConv,
    'reply'        => $assistantMsgRecord,
]);
