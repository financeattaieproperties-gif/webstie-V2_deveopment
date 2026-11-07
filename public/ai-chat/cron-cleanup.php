<?php
declare(strict_types=1);

/**
 * Attaie Properties — AI Conversation Retention Cleanup Cron Script
 *
 * Run via cPanel Cron Jobs (e.g. daily at 03:15 AM):
 * /usr/local/bin/php /home/CPANEL_USER/public_html/ai-chat/cron-cleanup.php
 */

require_once __DIR__ . '/lib/Config.php';
require_once __DIR__ . '/lib/Security.php';
require_once __DIR__ . '/lib/Storage.php';

use Attaie\AiChat\Security;
use Attaie\AiChat\Storage;

// Only allow CLI execution or authenticated Administrator request
if (PHP_SAPI !== 'cli') {
    Security::requireAdminAuth();
}

$purged = Storage::purgeExpiredConversations();
Security::logDiagnostic('retention_cleanup_completed', ['purged_conversations' => $purged]);

if (PHP_SAPI === 'cli') {
    echo "Attaie AI Chat Retention Cleanup: Purged {$purged} expired conversation(s).\n";
    exit(0);
}

Security::jsonResponse([
    'ok'     => true,
    'purged' => $purged,
]);
