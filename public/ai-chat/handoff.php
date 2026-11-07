<?php
declare(strict_types=1);

/**
 * Attaie Properties — Explicit Customer Consent Lead & Human Handoff Endpoint (/ai-chat/handoff.php)
 *
 * Security & Privacy invariants:
 * - Requires explicit customer consent (`consent_given: true`).
 * - Validates contact details server-side.
 * - Prevents duplicate submissions using a deterministic hash.
 * - Forwards conversation transcript to the isolated Admin Live Chat store (`uploads/chat_store/conversations.json`)
 *   so human agents in the Admin CRM (`/admin/chat`) can reply immediately, and reports truthful delivery status.
 */

require_once __DIR__ . '/lib/Config.php';
require_once __DIR__ . '/lib/Crypto.php';
require_once __DIR__ . '/lib/Security.php';
require_once __DIR__ . '/lib/Storage.php';
require_once __DIR__ . '/lib/PropertyTools.php';

use Attaie\AiChat\Security;
use Attaie\AiChat\Storage;
use Attaie\AiChat\PropertyTools;

Security::applyCors();
Security::initSession();

if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    Security::jsonResponse(['error' => 'Method not allowed.'], 405);
}

Security::enforceRateLimit('handoff', 5, 60);

$rawBody = file_get_contents('php://input');
$body = is_string($rawBody) ? (json_decode($rawBody, true) ?? []) : [];
if (!is_array($body)) {
    Security::jsonResponse(['error' => 'Invalid JSON payload.'], 400);
}

$consent = (bool) ($body['consent_given'] ?? false);
if (!$consent) {
    Security::jsonResponse([
        'error' => 'برای ارسال مشخصات تماس به مشاور انسانی، تایید رضایت شما الزامی است. / Explicit consent is required before submitting contact details.',
        'code'  => 'CONSENT_REQUIRED',
    ], 400);
}

$name  = PropertyTools::sanitizeUntrustedText((string) ($body['name'] ?? ''), 100);
$phone = trim((string) ($body['phone'] ?? ''));
$email = trim((string) ($body['email'] ?? ''));
$notes = PropertyTools::sanitizeUntrustedText((string) ($body['notes'] ?? ''), 500);
$convId = trim((string) ($body['conversation_id'] ?? ''));

if ($name === '' || mb_strlen($name, 'UTF-8') < 2) {
    Security::jsonResponse(['error' => 'لطفاً نام معتبر وارد کنید. / Please enter a valid name.'], 400);
}
if (!preg_match('/^[0-9+\-\s()]{7,22}$/', $phone)) {
    Security::jsonResponse(['error' => 'لطفاً شماره تماس معتبر وارد کنید. / Please enter a valid phone number.'], 400);
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    Security::jsonResponse(['error' => 'ایمیل واردشده معتبر نیست. / Invalid email address.'], 400);
}

$ownerTokenHash = Security::getCustomerOwnerToken();
$leadHash = hash('sha256', strtolower($name) . '|' . preg_replace('/\D+/', '', $phone) . '|' . $convId);

try {
    $conv = Storage::loadOrCreateCustomerConversation($convId !== '' ? $convId : null, $ownerTokenHash);
} catch (\RuntimeException $e) {
    Security::jsonResponse(['error' => 'Unauthorized conversation ownership.'], 403);
}

if (!empty($conv['lead_submitted']) && ($conv['lead_hash'] ?? '') === $leadHash) {
    Security::jsonResponse([
        'error' => 'درخواست ارتباط با مشاور قبلاً برای این گفتگو ثبت شده است. / Handoff request was already submitted for this conversation.',
        'code'  => 'DUPLICATE_HANDOFF',
    ], 409);
}

// Forward into the isolated Admin Live Chat Inbox (`uploads/chat_store/conversations.json`)
$deliveredToAdminInbox = false;
$chatStoreDir = dirname(__DIR__) . '/uploads/chat_store';
if (!@is_dir($chatStoreDir)) {
    @mkdir($chatStoreDir, 0750, true);
}
$chatStoreFile = $chatStoreDir . '/conversations.json';
$fp = @fopen($chatStoreFile, 'c+');
if ($fp && @flock($fp, LOCK_EX)) {
    $raw = stream_get_contents($fp);
    $threads = is_string($raw) && $raw !== '' ? (json_decode($raw, true) ?? []) : [];
    if (!is_array($threads)) {
        $threads = [];
    }

    $summaryLines = [];
    foreach (array_slice($conv['messages'] ?? [], -6) as $m) {
        $who = ($m['sender'] ?? '') === 'customer' ? 'مشتری' : 'دستیار هوشمند';
        $summaryLines[] = "{$who}: " . mb_substr((string) ($m['text'] ?? ''), 0, 180, 'UTF-8');
    }
    if ($notes !== '') {
        $summaryLines[] = "یادداشت مشتری: {$notes}";
    }
    $handoffText = "🤝 [درخواست مشاور انسانی از چت هوشمند]\n" . implode("\n", $summaryLines);

    $now = gmdate('c');
    array_unshift($threads, [
        'id'              => $conv['id'],
        'customer_name'   => $name,
        'customer_phone'  => $phone,
        'customer_email'  => $email,
        'property_id'     => isset($conv['last_property_id']) ? (string) $conv['last_property_id'] : null,
        'property_name'   => $conv['page_context'] ?? 'AI Chat Handoff',
        'page_context'    => $conv['page_context'] ?? null,
        'status'          => 'open',
        'unread_admin'    => 1,
        'unread_customer' => 0,
        'created_at'      => $now,
        'updated_at'      => $now,
        'messages'        => [
            [
                'id'          => 'msg_' . bin2hex(random_bytes(6)),
                'sender'      => 'customer',
                'sender_name' => $name,
                'text'        => $handoffText,
                'created_at'  => $now,
            ],
        ],
    ]);

    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode(array_slice($threads, 0, 200), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    fflush($fp);
    @flock($fp, LOCK_UN);
    @fclose($fp);
    $deliveredToAdminInbox = true;
}

$systemConfirmMsg = [
    'id'         => 'msg_' . bin2hex(random_bytes(6)),
    'sender'     => 'system',
    'text'       => $deliveredToAdminInbox
        ? "درخواست شما با موفقیت در صندوق پیام مشاوران ثبت شد. مشاوران رهنمای معاملات عطایی از طریق شماره {$phone} با شما به تماس می‌شوند."
        : "مشخصات تماس شما ذخیره شد، اما صندوق پیام مشاوران نیاز به بررسی دارد.",
    'created_at' => gmdate('c'),
];

Storage::appendExchange(
    $conv['id'],
    $ownerTokenHash,
    [
        'id'         => 'msg_' . bin2hex(random_bytes(6)),
        'sender'     => 'customer',
        'text'       => "[ثبت درخواست تماس مشاور انسانی: {$name} — {$phone}]",
        'created_at' => gmdate('c'),
    ],
    $systemConfirmMsg,
    [
        'handoff_status' => $deliveredToAdminInbox ? 'delivered_to_crm' : 'stored_pending_setup',
        'lead_submitted' => true,
        'lead_hash'      => $leadHash,
    ]
);

Security::jsonResponse([
    'ok'              => true,
    'delivery_status' => $deliveredToAdminInbox ? 'delivered_to_crm' : 'stored_pending_setup',
    'delivered'       => $deliveredToAdminInbox,
    'message'         => $systemConfirmMsg['text'],
]);
