<?php
declare(strict_types=1);

namespace Attaie\AiChat;

/**
 * Isolated storage for AI Provider Settings, Conversations, Messages, and Handoffs.
 *
 * Complies with AGENTS.md Rule 2: Never modifies the existing V1 MySQL database.
 * Stores encrypted credentials and conversation records in Config::getPrivateDir()
 * outside public_html (with reviewable additive SQL migration provided separately).
 */
final class Storage
{
    private static function getSettingsFile(): string
    {
        return Config::getPrivateDir() . '/ai_provider_settings.json';
    }

    private static function getConversationsFile(): string
    {
        return Config::getPrivateDir() . '/ai_conversations_store.json';
    }

    /**
     * Reads provider settings from isolated storage.
     */
    public static function getSettings(): array
    {
        $defaults = [
            'enabled'             => true,
            'active_provider'     => 'gemini',
            'active_model'        => 'gemini-2.5-flash',
            'allow_fallback'      => false,
            'max_output_tokens'   => 600,
            'daily_request_limit' => 500,
            'retention_days'      => Config::DEFAULT_RETENTION_DAYS,
            'handoff_channel'     => 'leads_crm',
            'providers'           => [
                'openai'    => ['encrypted_key' => '', 'masked_key' => '', 'model' => 'gpt-4o-mini', 'updated_at' => null, 'last_test_ok' => null],
                'gemini'    => ['encrypted_key' => '', 'masked_key' => '', 'model' => 'gemini-2.5-flash', 'updated_at' => null, 'last_test_ok' => null],
                'anthropic' => ['encrypted_key' => '', 'masked_key' => '', 'model' => 'claude-3-5-haiku-latest', 'updated_at' => null, 'last_test_ok' => null],
            ],
        ];

        $file = self::getSettingsFile();
        if (!@is_file($file)) {
            return $defaults;
        }
        $raw = @file_get_contents($file);
        $decoded = is_string($raw) ? json_decode($raw, true) : null;
        if (!is_array($decoded)) {
            return $defaults;
        }

        return array_replace_recursive($defaults, $decoded);
    }

    /**
     * Returns safe admin view of settings (masked keys only — never returns raw or encrypted keys).
     */
    public static function getPublicAdminSettings(): array
    {
        $settings = self::getSettings();
        $providersOut = [];
        foreach (Config::PROVIDERS as $id => $meta) {
            $saved = $settings['providers'][$id] ?? [];
            $hasKey = !empty($saved['encrypted_key']);
            $providersOut[$id] = [
                'id'             => $id,
                'label'          => $meta['label'],
                'models'         => $meta['models'],
                'default_model'  => $meta['default_model'],
                'billing_note'   => $meta['billing_note'],
                'selected_model' => $saved['model'] ?? $meta['default_model'],
                'has_key'        => $hasKey,
                'masked_key'     => $hasKey ? ($saved['masked_key'] ?? '••••••••••••') : '',
                'updated_at'     => $saved['updated_at'] ?? null,
                'last_test_ok'   => $saved['last_test_ok'] ?? null,
            ];
        }

        return [
            'enabled'               => (bool) ($settings['enabled'] ?? true),
            'active_provider'       => (string) ($settings['active_provider'] ?? 'gemini'),
            'active_model'          => (string) ($settings['active_model'] ?? 'gemini-2.5-flash'),
            'allow_fallback'        => (bool) ($settings['allow_fallback'] ?? false),
            'max_output_tokens'     => (int) ($settings['max_output_tokens'] ?? 600),
            'daily_request_limit'   => (int) ($settings['daily_request_limit'] ?? 500),
            'retention_days'        => (int) ($settings['retention_days'] ?? Config::DEFAULT_RETENTION_DAYS),
            'handoff_channel'       => (string) ($settings['handoff_channel'] ?? 'leads_crm'),
            'storage_outside_webroot' => Config::isOutsideDocumentRoot(),
            'providers'             => $providersOut,
        ];
    }

    public static function saveSettings(array $newSettings): void
    {
        $file = self::getSettingsFile();
        $fp = @fopen($file, 'c+');
        if (!$fp) {
            throw new \RuntimeException('Unable to write AI settings file.');
        }
        @flock($fp, LOCK_EX);
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($newSettings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        fflush($fp);
        @flock($fp, LOCK_UN);
        @fclose($fp);
        @chmod($file, 0600);
    }

    /**
     * Decrypts and returns the API key for a given provider (server-side only).
     */
    public static function getDecryptedApiKey(string $provider): string
    {
        $settings = self::getSettings();
        $encrypted = (string) ($settings['providers'][$provider]['encrypted_key'] ?? '');
        if ($encrypted === '') {
            return '';
        }
        return Crypto::decrypt($encrypted);
    }

    /**
     * Reads all stored conversations under an exclusive lock and performs retention cleanup.
     */
    public static function withConversationsLock(callable $callback)
    {
        $file = self::getConversationsFile();
        $fp = @fopen($file, 'c+');
        if (!$fp) {
            throw new \RuntimeException('Unable to access conversation storage.');
        }
        @flock($fp, LOCK_EX);
        $raw = stream_get_contents($fp);
        $conversations = is_string($raw) && $raw !== '' ? (json_decode($raw, true) ?? []) : [];
        if (!is_array($conversations)) {
            $conversations = [];
        }

        $result = $callback($conversations);

        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode(array_values($conversations), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        fflush($fp);
        @flock($fp, LOCK_UN);
        @fclose($fp);
        @chmod($file, 0600);

        return $result;
    }

    /**
     * Loads or creates a session-owned conversation.
     * Prevents a customer from reading or hijacking another customer's conversation ID.
     */
    public static function loadOrCreateCustomerConversation(?string $requestedId, string $ownerTokenHash, array $meta = []): array
    {
        return self::withConversationsLock(function (array &$conversations) use ($requestedId, $ownerTokenHash, $meta): array {
            $now = gmdate('c');
            if ($requestedId !== null && $requestedId !== '') {
                foreach ($conversations as &$conv) {
                    if (($conv['id'] ?? '') === $requestedId) {
                        // Strict server-side ownership check
                        if (!hash_equals((string) ($conv['owner_token_hash'] ?? ''), $ownerTokenHash)) {
                            throw new \RuntimeException('CONVERSATION_OWNERSHIP_MISMATCH');
                        }
                        return $conv;
                    }
                }
                unset($conv);
            }

            $newId = 'aichat_' . bin2hex(random_bytes(10));
            $newConv = [
                'id'                    => $newId,
                'owner_token_hash'      => $ownerTokenHash,
                'provider'              => (string) ($meta['provider'] ?? 'gemini'),
                'model'                 => (string) ($meta['model'] ?? 'gemini-2.5-flash'),
                'language'              => (string) ($meta['language'] ?? 'fa'),
                'last_property_id'      => isset($meta['last_property_id']) ? (int) $meta['last_property_id'] : null,
                'page_context'          => isset($meta['page_context']) ? mb_substr((string) $meta['page_context'], 0, 200, 'UTF-8') : null,
                'handoff_status'        => 'none',
                'lead_submitted'        => false,
                'lead_hash'             => null,
                'created_at'            => $now,
                'updated_at'            => $now,
                'messages'              => [],
            ];
            array_unshift($conversations, $newConv);
            if (count($conversations) > 300) {
                $conversations = array_slice($conversations, 0, 300);
            }
            return $newConv;
        });
    }

    /**
     * Appends user and assistant messages and updates conversation metadata.
     */
    public static function appendExchange(
        string $conversationId,
        string $ownerTokenHash,
        array $userMsg,
        array $assistantMsg,
        array $updates = []
    ): array {
        return self::withConversationsLock(function (array &$conversations) use ($conversationId, $ownerTokenHash, $userMsg, $assistantMsg, $updates): array {
            foreach ($conversations as &$conv) {
                if (($conv['id'] ?? '') === $conversationId) {
                    if (!hash_equals((string) ($conv['owner_token_hash'] ?? ''), $ownerTokenHash)) {
                        throw new \RuntimeException('CONVERSATION_OWNERSHIP_MISMATCH');
                    }
                    $conv['messages'][] = $userMsg;
                    $conv['messages'][] = $assistantMsg;
                    // Bound stored message history
                    if (count($conv['messages']) > Config::MAX_HISTORY_MESSAGES * 2) {
                        $conv['messages'] = array_slice($conv['messages'], -(Config::MAX_HISTORY_MESSAGES * 2));
                    }
                    foreach ($updates as $k => $v) {
                        $conv[$k] = $v;
                    }
                    $conv['updated_at'] = gmdate('c');
                    return $conv;
                }
            }
            throw new \RuntimeException('Conversation not found.');
        });
    }

    /**
     * Purges conversations older than configured retention_days.
     */
    public static function purgeExpiredConversations(): int
    {
        $settings = self::getSettings();
        $days = max(1, (int) ($settings['retention_days'] ?? Config::DEFAULT_RETENTION_DAYS));
        $cutoff = time() - ($days * 86400);

        return self::withConversationsLock(function (array &$conversations) use ($cutoff): int {
            $before = count($conversations);
            $conversations = array_values(array_filter($conversations, static function ($c) use ($cutoff): bool {
                $updated = strtotime((string) ($c['updated_at'] ?? $c['created_at'] ?? ''));
                return $updated === false || $updated >= $cutoff;
            }));
            return $before - count($conversations);
        });
    }
}
