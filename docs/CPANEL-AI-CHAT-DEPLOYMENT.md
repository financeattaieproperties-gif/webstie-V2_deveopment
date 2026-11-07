# cPanel Deployment & Security Guide — AI Real-Estate Customer Chat Agent

This document covers staging and production deployment of the Attaie Properties AI Real-Estate Customer Chat Agent on shared cPanel hosting (`https://www.attaieproperties.com` / `https://website.attaieproperties.com`).

> **Mandatory Safety Rule (`AGENTS.md`)**: Do **not** deploy to production, run database migrations against the live database, or alter existing `public/api/` endpoints without explicit owner approval.

---

## 1. Required PHP Version & Extensions

In **cPanel → Select PHP Version** (or **MultiPHP Manager**):
- **PHP Version**: `8.1`, `8.2` (recommended), or `8.3`
- **Required PHP Extensions**:
  - `curl` (HTTPS communication with OpenAI, Google Gemini, and Anthropic Claude APIs)
  - `openssl` and/or `sodium` (AEAD encryption for saved provider API keys)
  - `mysqli` (read-only parameterized queries against `properties` and `projects`)
  - `mbstring` (UTF-8 Afghan Dari & Pashto text normalization)
  - `json` (enabled by default in PHP 8+)

---

## 2. Frontend Build & Upload Steps

1. Build the Admin CRM into `public/admin/`:
   ```bash
   npm --prefix admin-panel run typecheck
   npm --prefix admin-panel run web:build
   ```
2. Build the Public Website SPA + static assets into `dist/`:
   ```bash
   npm run build
   ```
3. When deploying to a **staging subdomain** (e.g. `https://website.attaieproperties.com`) or, once approved, the main domain:
   - Upload the contents of `dist/` (which includes `ai-chat/`, `admin/`, `chat-service.php`, `seo.php`, `.htaccess`) into the target document root.
   - **Never overwrite** `public_html/api/db.php` or `public_html/uploads/` on the server.

---

## 3. PHP Endpoint Placement & Routing

All AI Chat backend files live in `public_html/ai-chat/` (completely separate from `public_html/api/`):
- `public_html/ai-chat/chat.php` — Customer AI chat & grounded property lookup endpoint.
- `public_html/ai-chat/admin-settings.php` — Administrator-only AI provider, API key, and model configuration endpoint.
- `public_html/ai-chat/handoff.php` — Explicit-consent customer lead & human agent handoff endpoint.
- `public_html/ai-chat/cron-cleanup.php` — Retention cleanup script for cPanel Cron Jobs.
- `public_html/ai-chat/lib/.htaccess` — Blocks direct HTTP access (`Require all denied`) to internal PHP classes (`Config.php`, `Crypto.php`, `Security.php`, `DariNormalizer.php`, `PropertyTools.php`, `Providers.php`, `Storage.php`).

The existing `public_html/.htaccess` rule (`RewriteCond %{REQUEST_FILENAME} -f [OR] RewriteCond %{REQUEST_FILENAME} -d RewriteRule ^ - [L]`) automatically serves `/ai-chat/*.php` directly without additional rewrite rules.

---

## 4. Secure Configuration & Encryption Secret Outside `public_html`

- By default, `Attaie\AiChat\Config::getPrivateDir()` automatically creates `/home/CPANEL_USER/.attaie_ai_private/` (one level **above** `public_html`) with `0700` permissions.
- Inside `/home/CPANEL_USER/.attaie_ai_private/`:
  - `ai_master_secret.key` (`0600`) — 256-bit master key used by `Crypto::encrypt()` (`sodium_crypto_secretbox` or `aes-256-gcm`).
  - `ai_provider_settings.json` (`0600`) — stores encrypted API keys (`v1:sodium:...` or `v1:gcm:...`), masked previews, active provider/model, and spending caps.
  - `ai_conversations_store.json` (`0600`) — isolated conversation & message storage.
  - `rate_limits.json` & `ai_diagnostic.log` (with automatic secret redaction).
- You can also set a custom path or master secret in cPanel environment variables:
  - `ATTAIE_AI_PRIVATE_DIR=/home/CPANEL_USER/.attaie_ai_private`
  - `ATTAIE_AI_ENCRYPTION_KEY=<your-64-char-random-secret>`

---

## 5. Read-Only Property Database Permissions & Separately Scoped Storage

To enforce least privilege in **cPanel → MySQL® Databases**:
1. Create a dedicated read-only MySQL user (e.g. `cpaneluser_ai_ro`) and grant it **ONLY `SELECT`** privileges on the database containing `properties`, `projects`, and `project_units`.
2. Set environment variables (in `.htaccess` `SetEnv` or PHP environment):
   ```apache
   SetEnv AI_READONLY_DB_HOST localhost
   SetEnv AI_READONLY_DB_USER cpaneluser_ai_ro
   SetEnv AI_READONLY_DB_PASS "your_strong_readonly_password"
   SetEnv AI_READONLY_DB_NAME cpaneluser_attaie_db
   ```
3. Even if `AI_READONLY_DB_USER` is not set, `PropertyTools::getReadOnlyDb()` immediately executes `SET SESSION TRANSACTION READ ONLY` and `SET SESSION max_execution_time = 3000` on connection so the AI assistant can never modify property records.
4. Conversations and handoffs are stored in isolated storage outside the existing MySQL database. An optional additive SQL schema for a separate database is provided in `docs/ai-chat-separate-db-migration.sql`.

---

## 6. Retention Cleanup via cPanel Cron Jobs

In **cPanel → Cron Jobs**, add a daily cleanup job (e.g. `15 3 * * *` — 03:15 AM daily):
```bash
/usr/local/bin/php -q /home/CPANEL_USER/public_html/ai-chat/cron-cleanup.php >/dev/null 2>&1
```
This purges conversations older than the configured `retention_days` (default: 30 days).

---

## 7. Staging Verification, Backups, Rollback & Instant Disable Switch

- **Staging Verification**: Deploy to `website.attaieproperties.com` first with a read-only database user. Log into `/admin/settings`, save a provider API key, click **Test Connection**, and test the three benchmark Afghan Dari queries (`«در کابل یک اپارتمان سه اتاقه برای کرایه دارین؟»`, `«کرایه‌اش چند است؟»`, `«این اپارتمان هنوز موجود است؟»`).
- **Instant Disable Switch**: Uncheck **Enable AI Customer Chat Assistant** in `/admin/settings` and click **Activate & Save Policy** to immediately disable AI replies without affecting the website or human chat.
- **Rollback**: Remove `public_html/ai-chat/` and restore the previous `dist/` build archive. Because zero changes were made to `public_html/api/` or the V1 MySQL database, rollback is immediate and stateless.
