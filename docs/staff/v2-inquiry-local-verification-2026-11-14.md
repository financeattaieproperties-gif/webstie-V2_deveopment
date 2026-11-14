# V2 website inquiry implementation and local verification

Date: 2026-11-14. Branch: `codex/v2-revised-workflows`. Base: `e4cbd10`.

## Delivered source

- Website inquiry transactions now return immutable, opaque receipts. Stable request UUIDs deduplicate retries and reject changed payloads. Fresh schema and an additive migration preserve legacy rows.
- Both public forms share an IndexedDB queue, startup/online delivery, bounded transient retries, explicit pending/error states, and downloadable printable Code 128 confirmations. Confirmed local records omit the submitted contact/message payload. English and Dari/RTL status strings are included.
- Website Admin can search receipt references and save versioned follow-up status, notes, and next-follow-up time. Website Admin session/CSRF checks protect writes; immutable receipt data and legacy stage/status fields remain separate.
- Website chat uses a private locked JSON store with atomic replacement, random customer capabilities, idempotent message UUIDs, explicit pending/confirmed state, and real cross-browser Admin replies. Local-only demo/outreach controls and synthetic inquiry mirroring are removed. Historical ID-only threads remain preserved for Admin; public reconnection requires a separate verified recovery process.

Main source areas: `public/api/{submit-lead.php,inquiry-service.php,admin/leads.php,schema.sql,migrations/2026-11-13-inquiry-receipts.sql,db.example.php}`, `public/chat-service.php`, `src/lib/{dbService.ts,inquiryOutbox.ts,inquiryReceipt.ts,chatService.ts}`, both public forms, the delivery status component, App startup listener, EN/FA locales, and Admin API/Leads/follow-up editor/ChatInbox.

## Observed local checks

| Command | Result |
| --- | --- |
| `node tests/website/inquiries-http.mjs` | Passed: 67 real MySQL/HTTP assertions, including eight separate concurrent connections, replay/conflict/lost-response behavior, additive legacy migration, Admin CSRF/denial/version checks, receipt search, and audit effects. |
| `node tests/website/inquiry-offline.mjs` | Passed: 24 browser assertions. Both forms, reload, two tabs, ambiguous upstream success, permanent errors, storage denial, independently decoded Code 128, escaped customer text, print controls, Dari/RTL and 375/768/1024/1440 component widths. |
| `node tests/website/inquiry-admin.mjs` | Passed: seven browser persistence/search assertions. |
| `node tests/website/chat-http.mjs` | Passed: 26 private-store/auth/deduplication assertions, including customer capability isolation, Admin CSRF, no synthetic inquiry, and corrupt-store preservation. |
| `node tests/website/chat-delivery.mjs` | Passed: eight cross-context browser assertions. Pending/reload/reconnect, one delivered customer message, Admin reply, and retained draft on transport failure. |
| `node --test tests/website/delivery-races.mjs` | Passed: three regressions, each observed failing before its fix. Enqueue during active inquiry delivery; stale chat GET versus newer pending message; another Admin tab rotating shared session/CSRF. |
| `npm.cmd run lint` | Passed public TypeScript check. |
| `npm.cmd run build:admin` | Passed Admin typecheck and production build. Existing self-hosted font-resolution and bundle-size warnings remain. |
| PHP syntax checks | Passed inquiry helper, submission endpoint and Admin follow-up endpoint. Chat was exercised through real local PHP requests. |
| `git diff --check` | Passed. |
| `npm.cmd --prefix apps/staff test` | Passed: 47 domain tests. This does not establish staff HTTP workflow readiness. |

Tests created random `attaie_v2_test_*` databases on isolated loopback MySQL port 3397 and removed those test databases afterward. They copied the public configuration template into private temporary fixtures; they did not read `.env.local` or real `public/api/db.php`. Customer/Admin credentials in these fixtures are public-template placeholders, not real accounts.

## Independent review

A fresh reviewer examined the inquiry plan through commit `7f4d58b`. Three findings were fixed in one regression-driven pass: pending chat message loss from a stale GET; queued inquiries stranded behind an active drain; and stale Admin CSRF tokens after another tab logs in. All three tests first failed, then passed, followed by the full inquiry suite. Chat cache writes now serialize and server conversation versions reject stale snapshots. Chat mutation retries preserve the exact request body/message UUID.

Rulings made during execution:

1. Used a new feature branch in the existing checkout to continue the user's workspace. Changes are visible in this checkout; no separate worktree was created.
2. Modeled ambiguous browser delivery with an upstream commit followed by a proxy 502 and explicit durable-state polling. Abrupt response loss is also covered at the HTTP boundary. Browser transport interception alone did not establish that the application retried.
3. Required secure capabilities for new customer threads. Historical ID-only data remains Admin-readable; automatically claiming old threads would expose private conversations.
4. Removed local-only Admin outreach/demo actions because they had no remote delivery path. Admin replies to actual customer-created threads remain supported.

No deferred review minors. Hosted checks were explicitly outside the review's evidence, as were the separate CRM/publication/packaging plans.

## Remaining work and uncertainty

This completes the **website inquiry/message source plan**, not the overall V2 readiness index. CRM customer/property uniqueness, publication revisions, integration acceptance, department onboarding, and a new audited manual upload package remain separate work. The existing staff HTTP completion fixture currently fails while inserting retired roles into the current canonical-role schema; that baseline failure must be resolved transparently before staff HTTP acceptance can be claimed.

No new release/upload ZIP was prepared here. Earlier packages may omit this migration or block chat. Follow [private chat migration](v2-website-chat-migration.md) when preparing the new package, and compose fresh versus additive website SQL separately. Do not import both schema alternatives into one database.

No hosted database import, upload, Firebase login, private-path check, Apache/HTTPS check, or real provider call was performed. `serverUploaded`, `databaseImported`, and `serverVerified` remain false. Keep V1 untouched and CTC disabled in the testing package until separately authorized provider testing.
