<?php
declare(strict_types=1);

/**
 * Attaie Properties — AI Real-Estate Assistant Configuration
 *
 * Security invariants:
 * - Master encryption key and isolated storage live OUTSIDE public_html whenever allowed by open_basedir.
 * - Provider API endpoints and tool-capable models are strictly allowlisted.
 * - Automatic cross-provider fallback is disabled by default.
 */

namespace Attaie\AiChat;

final class Config
{
    public const MAX_MESSAGE_CHARS       = 1200;
    public const MAX_HISTORY_MESSAGES    = 14;
    public const MAX_TOOL_ROUNDS         = 3;
    public const MAX_SEARCH_RESULTS      = 6;
    public const PROVIDER_TIMEOUT_SEC    = 22;
    public const RATE_LIMIT_WINDOW_SEC   = 60;
    public const RATE_LIMIT_MAX_REQUESTS = 12;
    public const DEFAULT_RETENTION_DAYS  = 30;

    /**
     * Fixed allowlist of AI providers, official HTTPS endpoints, and tool-capable models.
     * Arbitrary base URLs are never accepted.
     */
    public const PROVIDERS = [
        'openai' => [
            'label'    => 'OpenAI',
            'endpoint' => 'https://api.openai.com/v1/chat/completions',
            'models'   => [
                'gpt-4o-mini' => 'GPT-4o Mini (Fast, Tool-Capable)',
                'gpt-4o'      => 'GPT-4o (High Accuracy, Tool-Capable)',
                'gpt-4.1-mini'=> 'GPT-4.1 Mini (Tool-Capable)',
                'gpt-4.1'     => 'GPT-4.1 (Flagship, Tool-Capable)',
            ],
            'default_model' => 'gpt-4o-mini',
            'billing_note'  => 'Requires an OpenAI Platform API key with active API billing (ChatGPT Plus consumer subscriptions do not include API usage).',
        ],
        'gemini' => [
            'label'    => 'Google Gemini',
            'endpoint' => 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
            'models'   => [
                'gemini-2.5-flash' => 'Gemini 2.5 Flash (Recommended, Tool-Capable)',
                'gemini-2.5-pro'   => 'Gemini 2.5 Pro (Advanced Reasoning, Tool-Capable)',
                'gemini-2.0-flash' => 'Gemini 2.0 Flash (Fast, Tool-Capable)',
            ],
            'default_model' => 'gemini-2.5-flash',
            'billing_note'  => 'Requires a Google AI Studio / Vertex AI API key with API quota enabled (Gemini Advanced consumer plans do not include API usage).',
        ],
        'anthropic' => [
            'label'    => 'Anthropic Claude',
            'endpoint' => 'https://api.anthropic.com/v1/messages',
            'models'   => [
                'claude-sonnet-4-20250514' => 'Claude Sonnet 4 (Tool-Capable)',
                'claude-3-7-sonnet-latest' => 'Claude 3.7 Sonnet (Tool-Capable)',
                'claude-3-5-sonnet-latest' => 'Claude 3.5 Sonnet (Tool-Capable)',
                'claude-3-5-haiku-latest'  => 'Claude 3.5 Haiku (Fast, Tool-Capable)',
            ],
            'default_model' => 'claude-3-5-haiku-latest',
            'billing_note'  => 'Requires an Anthropic Console API key with prepaid API credits (Claude Pro consumer subscriptions do not include API usage).',
        ],
    ];

    /**
     * Resolves a private directory outside the public web root whenever possible.
     * Falls back to an .htaccess-protected directory only if open_basedir restricts parent directories.
     */
    public static function getPrivateDir(): string
    {
        $candidates = [];

        $envDir = getenv('ATTAIE_AI_PRIVATE_DIR');
        if (is_string($envDir) && trim($envDir) !== '') {
            $candidates[] = rtrim(trim($envDir), '/\\');
        }

        $docRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
        if (is_string($docRoot) && trim($docRoot) !== '') {
            $parent = dirname(rtrim($docRoot, '/\\'));
            if ($parent && $parent !== $docRoot) {
                $candidates[] = $parent . '/.attaie_ai_private';
            }
        }

        // Parent of public/ in repository layout
        $repoRoot = dirname(__DIR__, 3);
        if ($repoRoot && basename(dirname(__DIR__, 2)) === 'public') {
            $candidates[] = $repoRoot . '/.attaie_ai_private';
        }

        // Fallback inside uploads with strict .htaccess deny if cPanel open_basedir blocks outside public_html
        $candidates[] = dirname(__DIR__, 2) . '/uploads/.attaie_ai_private';

        foreach ($candidates as $dir) {
            if (@is_dir($dir) && @is_writable($dir)) {
                self::hardenDirectory($dir);
                return $dir;
            }
            if (@mkdir($dir, 0700, true)) {
                self::hardenDirectory($dir);
                return $dir;
            }
        }

        $fallback = sys_get_temp_dir() . '/attaie_ai_private';
        if (!@is_dir($fallback)) {
            @mkdir($fallback, 0700, true);
        }
        self::hardenDirectory($fallback);
        return $fallback;
    }

    private static function hardenDirectory(string $dir): void
    {
        $htaccess = $dir . '/.htaccess';
        if (!@file_exists($htaccess)) {
            @file_put_contents(
                $htaccess,
                "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order deny,allow\n  Deny from all\n</IfModule>\n"
            );
        }
        $index = $dir . '/index.html';
        if (!@file_exists($index)) {
            @file_put_contents($index, '');
        }
    }

    /**
     * Returns whether the current private directory is outside DOCUMENT_ROOT.
     */
    public static function isOutsideDocumentRoot(): bool
    {
        $docRoot = realpath((string) ($_SERVER['DOCUMENT_ROOT'] ?? '')) ?: '';
        $privDir = realpath(self::getPrivateDir()) ?: self::getPrivateDir();
        if ($docRoot === '') {
            return true;
        }
        return strpos($privDir, $docRoot) !== 0;
    }

    /**
     * Loads or generates the 32-byte encryption secret stored outside the database and public web root.
     */
    public static function getMasterEncryptionKey(): string
    {
        $envKey = getenv('ATTAIE_AI_ENCRYPTION_KEY');
        if (is_string($envKey) && strlen(trim($envKey)) >= 32) {
            return hash('sha256', trim($envKey), true);
        }

        $keyFile = self::getPrivateDir() . '/ai_master_secret.key';
        if (@is_file($keyFile) && @is_readable($keyFile)) {
            $raw = trim((string) @file_get_contents($keyFile));
            $decoded = base64_decode($raw, true);
            if (is_string($decoded) && strlen($decoded) === 32) {
                return $decoded;
            }
        }

        $newKey = random_bytes(32);
        @file_put_contents($keyFile, base64_encode($newKey), LOCK_EX);
        @chmod($keyFile, 0600);
        return $newKey;
    }

    public static function isValidProvider(string $provider): bool
    {
        return isset(self::PROVIDERS[$provider]);
    }

    public static function isValidModel(string $provider, string $model): bool
    {
        return isset(self::PROVIDERS[$provider]['models'][$model]);
    }
}
