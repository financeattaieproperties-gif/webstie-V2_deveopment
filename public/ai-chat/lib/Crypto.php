<?php
declare(strict_types=1);

namespace Attaie\AiChat;

final class Crypto
{
    /**
     * Encrypts plaintext using AEAD (libsodium secretbox or OpenSSL AES-256-GCM).
     */
    public static function encrypt(string $plaintext): string
    {
        if ($plaintext === '') {
            return '';
        }
        $key = Config::getMasterEncryptionKey();

        if (function_exists('sodium_crypto_secretbox')) {
            $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
            $cipher = sodium_crypto_secretbox($plaintext, $nonce, $key);
            return 'v1:sodium:' . base64_encode($nonce . $cipher);
        }

        $iv = random_bytes(12);
        $tag = '';
        $cipher = openssl_encrypt($plaintext, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag, '', 16);
        if ($cipher === false) {
            throw new \RuntimeException('Failed to encrypt credential.');
        }
        return 'v1:gcm:' . base64_encode($iv . $tag . $cipher);
    }

    /**
     * Decrypts ciphertext encrypted by self::encrypt().
     */
    public static function decrypt(string $payload): string
    {
        if ($payload === '') {
            return '';
        }
        $key = Config::getMasterEncryptionKey();

        if (strpos($payload, 'v1:sodium:') === 0) {
            if (!function_exists('sodium_crypto_secretbox_open')) {
                return '';
            }
            $raw = base64_decode(substr($payload, 10), true);
            if (!is_string($raw) || strlen($raw) <= SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) {
                return '';
            }
            $nonce = substr($raw, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
            $cipher = substr($raw, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
            $plain = sodium_crypto_secretbox_open($cipher, $nonce, $key);
            return is_string($plain) ? $plain : '';
        }

        if (strpos($payload, 'v1:gcm:') === 0) {
            $raw = base64_decode(substr($payload, 7), true);
            if (!is_string($raw) || strlen($raw) <= 28) {
                return '';
            }
            $iv = substr($raw, 0, 12);
            $tag = substr($raw, 12, 16);
            $cipher = substr($raw, 28);
            $plain = openssl_decrypt($cipher, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
            return is_string($plain) ? $plain : '';
        }

        return '';
    }

    /**
     * Masks an API key so the full secret is never returned after saving.
     */
    public static function maskKey(string $apiKey): string
    {
        $trimmed = trim($apiKey);
        $len = strlen($trimmed);
        if ($len === 0) {
            return '';
        }
        if ($len <= 8) {
            return '••••••••';
        }
        $prefix = substr($trimmed, 0, min(6, (int) floor($len / 4)));
        $suffix = substr($trimmed, -4);
        return $prefix . '••••••••••••' . $suffix;
    }
}
