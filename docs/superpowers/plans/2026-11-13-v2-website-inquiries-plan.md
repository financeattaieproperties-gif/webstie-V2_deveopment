# V2 Website Inquiries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Receive website forms/messages exclusively in website Admin, support offline form delivery, and issue confirmed barcode receipts.

**Architecture:** Website inquiries stay in the website database. A shared IndexedDB outbox submits stable request IDs to an idempotent PHP endpoint; receipts exist only after commit. Website chat retains its isolated locked-file backend with private storage and truthful delivery states.

**Tech Stack:** Existing React/TypeScript, react-hook-form/zod, PHP/mysqli, IndexedDB, Code 128, Playwright, node:test.

**Spec:** `docs/superpowers/specs/2026-11-13-v2-website-crm-boundaries-design.md`

## Global Constraints

- Apply every constraint in `2026-11-13-v2-readiness-index.md`.
- No website form/message writes to CRM or creates staff tasks; no third-database inquiry queue.
- Barcode contains only the opaque reference, never customer contact information or a public lookup credential.
- Keep both form entry points and their existing validation compatible; queue only validated payloads.
- No receipt before server confirmation; no guarantee of submission while the browser is closed.

## Review Focus

- Lost responses after commit must replay the same inquiry/receipt, not duplicate it (Task 1).
- Different payloads reusing an ID must be rejected without mutating the original (Task 1).
- Storage denial, reloads, two tabs, and connectivity flapping must preserve pending forms honestly (Task 2).
- Staff credentials must not authorize website follow-up mutations or receipt lookup (Task 3).
- Separate browser contexts must see server-delivered chat without local demo data (Task 4).

## File map

- Server: `public/api/submit-lead.php`, new `public/api/inquiry-service.php`, `public/api/admin/leads.php`, `public/api/schema.sql`, new `public/api/migrations/2026-11-13-inquiry-receipts.sql`.
- Browser: `src/lib/dbService.ts`, new `src/lib/inquiryOutbox.ts`, new `src/components/forms/InquiryDeliveryStatus.tsx`, `src/components/forms/InquiryForm.tsx`, `src/pages/ContactPage.tsx`, `src/App.tsx`, `src/i18n/locales/en.json`, `fa.json`.
- Admin: `admin-panel/src/api.ts`, `admin-panel/src/pages/Leads.tsx`.
- Chat: `src/lib/chatService.ts`, `src/components/chat/CustomerChatWidget.tsx`, `public/chat-service.php`, `admin-panel/src/api.ts`, `admin-panel/src/pages/ChatInbox.tsx`, `public/api/db.example.php` (configuration template only).
- Test fixtures: new `tests/website/support/fixture.php` and `server.mjs`, modeled on existing isolated staff test helpers. Use random `attaie_v2_test_*` database names, private temporary config, and `STAFF_LOCAL_TEST=1`; refuse nonfixture destructive operations. Never read `.env.local` or real `db.php`.

## Task 1: Idempotent website inquiry receipt and schema

**Interfaces:** Keep `createLead(lead: Lead)`; extend `Lead` with optional `clientRequestId: string`. Return `InquirySubmissionResult = {success: true; id: number; receipt: {reference: string; submittedAt: string; customerName: string; propertyName: string}}`. Add server `save_website_inquiry(mysqli $db, array $input): array` in `inquiry-service.php`.

- [x] Create `tests/website/inquiries-http.mjs` with executable assertions: replaying one UUID/body returns identical `id` and receipt, row count is one; changed body with same UUID returns 409; concurrent equal submissions return one receipt; invalid input creates no row; legacy payload without UUID remains accepted. Force a response loss after a committed fixture transaction and retry.
- [x] Run `node tests/website/inquiries-http.mjs`; confirm failures identify the missing receipt/idempotency behavior.
- [x] Add nullable unique `client_request_id`, payload hash, nullable unique `receipt_reference`, and receipt timestamp to website `leads`; add follow-up fields `followup_status`, `followup_notes`, `followup_at`, and `version`, plus `website_inquiry_events`. Supply additive upgrade SQL and matching fresh schema. Preserve legacy columns and rows; do not require bulk historical receipt generation.
- [x] Implement one transaction for inquiry/receipt creation, canonical validated payload hashing, unique-key race recovery, opaque random references, server UTC timestamps, prepared statements, and generic failure responses. Preserve `success` and `id`. Update `dbService.ts` types without breaking callers.
- [x] Rerun the HTTP test and root `npm.cmd run lint`; expect exit 0 and explicit assertion counts. Record fixture prerequisites if unavailable; a skipped HTTP test is not a pass.
- [x] Commit only Task 1 files with message `feat: add idempotent website inquiry receipts`.

## Task 2: Durable offline form queue and downloadable barcode receipt

**Interfaces:** Export `enqueueInquiry(payload: Lead): Promise<QueuedInquiry>`, `flushInquiries(): Promise<void>`, `listInquiryDeliveries(): Promise<InquiryDelivery[]>`, `discardPendingInquiry(clientRequestId: string): Promise<void>`, and `subscribeInquiryDeliveries(listener: () => void): () => void` from `inquiryOutbox.ts`. `InquiryDelivery` is a discriminated union: pending/sending/needs_attention retains payload and stable request ID; confirmed retains request ID and `InquirySubmissionResult['receipt']` only. `QueuedInquiry` is the pending member. Status component props are `{propertyId?: string}` and it reads this shared store.

- [x] Create `tests/website/inquiry-offline.mjs` using Playwright and two contexts/tabs. Assert offline saves survive reload, startup/online flush submits once, a lost success response recovers one receipt, 422/409 enters needs_attention, quota/storage denial leaves form data visible, and no receipt appears while pending. Test both `InquiryForm` and Contact page. Decode the resulting barcode and compare with server reference.
- [x] Run `node tests/website/inquiry-offline.mjs`; expect failure on absent offline states and receipt UI.
- [x] Implement IndexedDB transactions and stable UUIDs, shared in-flight suppression, startup/online triggers, bounded transient retries, and server-enforced cross-tab deduplication. Restore stuck `sending` requests on startup. Persist before sending; confirmed records retain receipt metadata without the full pending payload. Provide pending retry/discard and confirmed download controls.
- [x] Add an application-level delivery listener so retries do not depend on leaving a particular form mounted. Reuse it from both forms. Replace temporary success-only handling with durable localized pending/error/confirmed status and receipt access, preserving form validation and layout.
- [x] Render Code 128 using an established encoder (evaluate `jsbarcode` and its TypeScript support at implementation; add only the public package dependency if needed). Implement `downloadInquiryReceipt(receipt: InquirySubmissionResult['receipt'], language: 'en' | 'fa'): void` in new `src/lib/inquiryReceipt.ts`; escape all customer text, embed barcode as SVG, use self-hosted fonts, support RTL and print, and download an HTML artifact with unique reference/server time/property/name and no payment claim.
- [x] Rerun offline tests and `npm.cmd run lint`; expect all states and receipt decode assertions to pass at mobile/desktop widths and in Dari. Commit with `feat: queue offline inquiries and issue barcode confirmations`.

## Task 3: Admin-only inquiry follow-up and receipt search

**Interfaces:** Extend `api` with `updateInquiryFollowup(id: number, body: {version: number; status: 'new' | 'in_progress' | 'resolved'; notes: string; followupAt: string | null}): Promise<Lead>`. Extend `Lead` with nullable receipt metadata and follow-up/version fields. `PUT /api/admin/leads.php` accepts that body plus `id`; GET remains compatible.

- [x] Extend `inquiries-http.mjs`: website Admin updates/reloads follow-up, stale version returns 409, unauthenticated and Firebase-staff-only sessions are rejected, and no internal CRM query/credential is used. Verify legacy inquiry rows remain readable and receipt search returns only authenticated Admin results.
- [x] Run the HTTP test and confirm the PUT cases fail before implementation.
- [x] Implement server-side Admin/session/CSRF enforcement using the current bootstrap conventions, allowed statuses, versioned updates, UTC follow-up times, and audit events. Add Admin controls, receipt reference search, and visible next-follow-up state. Preserve existing exports/filtering; do not route or assign inquiries to staff.
- [x] Run the HTTP test, `npm.cmd run build:admin`, and `npm.cmd run lint`; manually verify persisted follow-up and reference search in Admin. Commit with `feat: manage website inquiry follow-up in admin`.

## Task 4: Real customer-to-Admin chat delivery

**Interfaces:** Preserve the existing `chat-service.php` actions and conversation API contracts. Add `client_message_id` to customer/admin message mutations and a corresponding `delivery_status: 'pending' | 'confirmed' | 'needs_attention'` to browser message state. `sendCustomerChatMessage` returns pending state on transport failure; pending local records never imply remote receipt. Use a private `WEBSITE_CHAT_STORE_DIR` configuration path.

- [x] Create `tests/website/chat-http.mjs` and `chat-delivery.mjs`. Assert cross-browser customer/Admin delivery and replies, idempotent retries, pending on transport failure, refresh/reconnect delivery, no synthetic first-message inquiry, anonymous Admin-action denial, staff-session denial, and one customer's inability to fetch another thread.
- [x] Run both tests and confirm the blocked/local-only behavior fails acceptance.
- [x] Move the existing locked JSON store outside document roots through the private website configuration template; fail closed if storage is unavailable. Reuse website Admin authentication and required mutation protections. Ensure customer thread ownership uses an unguessable capability/session check and is enforced for fetch/send/read/typing; never rely on a supplied thread ID alone. Keep all existing thread data; document a copy/verification migration for the testing host rather than deleting old storage.
- [x] Add server-side client-message deduplication under the file lock, durable customer pending retry, and explicit Admin transport errors. Remove best-effort `createLead` mirroring and demo conversation seeding from deployed Admin; preserve read/typing behavior. Include the new fields in current public/Admin API contracts.
- [x] Run both chat tests and both app typechecks. Commit with `fix: confirm website chat delivery through admin`.

## Completion evidence

All four source tasks and the independent review fix pass completed locally on 2026-11-14. See `docs/staff/v2-inquiry-local-verification-2026-11-14.md` for command results, rulings, source areas and remaining deployment gates. This does not mark the full readiness index or hosted testing deployment complete.


Record commands, assertion counts, browser findings, and any unmet runtime prerequisites. Local HTML receipts must decode correctly. No product task can claim hosted Firebase, Apache routing, or deployed storage is verified; that belongs to the acceptance plan.
