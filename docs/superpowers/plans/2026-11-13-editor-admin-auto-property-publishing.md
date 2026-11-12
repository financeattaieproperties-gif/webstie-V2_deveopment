# Editor-to-Admin Automatic Property Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an Editor submit a complete five-photo website property after social posting, then let website Admin approve and automatically publish it as a normal public Property listing with one action.

**Architecture:** Extend the CRM Marketing record and isolated submission database with all required public property fields. Use an idempotent Admin backend operation that records approval, writes the website Property through the website connection, links the publication, and reports Published only after the website write succeeds; failed publication remains safely retryable without CRM access.

**Tech Stack:** React 19 staff app, React 18 Admin app, TypeScript, PHP 8.4/mysqli, three separate MySQL databases, Node tests, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-12-ceo-manager-role-model-design.md`

## Global Constraints

- Website Admin has website and submission access only; it must never receive internal CRM credentials or connectivity.
- Editor submits only after social-media posting is complete.
- Submission requires title, positive price, sale/rent listing type, website property type, address/location, description, and exactly five valid photos.
- Customer/owner identity is never copied into the public Property row.
- Admin has one `Approve & Publish` action; it does not re-enter listing details.
- Rejection requires a reason, is terminal, and is not editable/resubmittable.
- Publishing is idempotent and retry-safe; one submission creates at most one website Property.
- `Published` is recorded only after the website write succeeds.
- V2/manual deployment/empty-catalog/no-secrets rules remain in force.

## Review Focus

- A timeout after website commit but before submission update must retry to the same Property rather than duplicate it; covered in Task 4.
- A malformed, missing, repeated, inaccessible, or non-image photo must block submission/publication; covered in Tasks 2 and 3.
- Customer name and private CRM/file URLs must never leak into the public Property or public gallery; covered in Tasks 3 and 4.
- Concurrent Admin approval/retry requests must produce one publication and deterministic status; covered in Task 4.
- Rejected submissions must remain terminal even through modified API requests; covered in Tasks 3 and 4.

---

## File Map

- Modify `packages/staff-contracts/types.ts`: complete Marketing/submission property fields.
- Modify `staff-service/database/050-marketing-production.sql`, `055-submissions-db.sql`, `100-dashboard-completion.sql`: fresh schema fields.
- Create `staff-service/database/120-complete-property-submissions.sql`: guarded upgrade SQL.
- Modify `staff-service/src/Completion.php`: validate Editor payload and deliver complete outbox data/assets.
- Modify `apps/staff/src/components/MarketingWorkspace.tsx`: Editor publication-ready form.
- Modify `public/api/admin/submissions.php`: one-action approve/publish and terminal rejection.
- Modify `admin-panel/src/pages/PublishingTasks.tsx` and `admin-panel/src/api.ts`: review-only listing details and one action.
- Modify domain, API, concurrency, browser, and packaging tests.
- Update Marketing requirements, master plan, and manual delivery instructions.

### Task 1: Complete property submission contracts and schemas

**Files:**
- Modify: `packages/staff-contracts/types.ts`
- Modify: `admin-panel/src/api.ts`
- Modify: `staff-service/database/050-marketing-production.sql`
- Modify: `staff-service/database/055-submissions-db.sql`
- Modify: `staff-service/database/100-dashboard-completion.sql`
- Create: `staff-service/database/120-complete-property-submissions.sql`
- Modify: `deployment/v2/complete-v2-mysql-schema.sql`
- Test: `tests/staff/domain/schema.test.mjs`
- Test: `tests/staff/packaging/completion-schema.test.mjs`

**Interfaces:**
- Produces: `WebsitePropertySubmissionFields {listingTitle,price,listingType,propertyType,location,description,photos}`.
- Produces submission columns `listing_title`, `price`, `listing_type`, `website_property_type`, `location`, `description`, `publish_error`, `website_property_id`, and `origin_branch_id`.

- [ ] **Step 1: Write failing contract and schema assertions**

Assert website property types are exactly `Villa|Apartment|House|Commercial|Land`, listing types are `sale|rent`, prices are positive decimals, exactly five ordered assets are required, and the upgrade is guarded/idempotent.

- [ ] **Step 2: Run schema tests and confirm failure**

Run: `node --test tests/staff/domain/schema.test.mjs tests/staff/packaging/completion-schema.test.mjs`

- [ ] **Step 3: Implement contracts, fresh SQL, and upgrade SQL**

Keep customer/owner and social metadata in the submission database for authorized review but separate them from the public property projection.

- [ ] **Step 4: Run schema tests and disposable migration twice**

Expected: PASS; second upgrade import makes no changes; existing submission identifiers/status history remain intact.

- [ ] **Step 5: Commit**

```bash
git add packages/staff-contracts/types.ts admin-panel/src/api.ts staff-service/database deployment/v2/complete-v2-mysql-schema.sql tests/staff/domain/schema.test.mjs tests/staff/packaging/completion-schema.test.mjs
git commit -m "feat: define complete website property submissions"
```

### Task 2: Editor publication-ready submission workflow

**Files:**
- Modify: `apps/staff/src/components/MarketingWorkspace.tsx`
- Modify: `apps/staff/src/api.ts`
- Modify: `apps/staff/src/i18n/en.json`
- Modify: `apps/staff/src/i18n/fa.json`
- Modify: `apps/staff/src/preview.ts`
- Test: `tests/staff/domain/master-workflow.test.mjs`
- Test: `tests/staff/browser/completion-ui.mjs`

**Interfaces:**
- Consumes: `WebsitePropertySubmissionFields` from Task 1.
- Produces: Editor `mark_posted` payload containing the complete property projection and five uploaded photo references.

- [ ] **Step 1: Write failing domain/UI tests**

Assert Editor cannot submit before social-post completion or with missing title, non-positive price, invalid type, empty location/description, fewer/more than five photos, duplicate photo references, or an upload still pending. Assert recoverable errors retain entered values.

- [ ] **Step 2: Run focused tests and confirm failure**

Run domain test and configured Playwright completion UI suite.

- [ ] **Step 3: Implement the complete Editor form**

Use shared form components/styles, translated labels/errors, accessible photo removal/order, clear five-photo count, and existing private upload flow. Do not expose a resubmit action for Rejected entries.

- [ ] **Step 4: Run TypeScript, domain, and responsive browser tests**

Run: `npm --prefix apps/staff run typecheck`, `npm --prefix apps/staff test`, three fresh `node scripts/build-staff.mjs --role <callcenter|management|dashboard> --out <new-temp-directory>` builds, and Playwright at 375/768/1024/1440 in English/Dari RTL.

Expected: clean typecheck and PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/staff packages/staff-contracts/types.ts tests/staff/domain/master-workflow.test.mjs tests/staff/browser/completion-ui.mjs
git commit -m "feat: collect publication-ready property submissions"
```

### Task 3: Secure CRM-to-submission outbox handoff

**Files:**
- Modify: `staff-service/src/Completion.php`
- Modify: `staff-service/src/CompletionRules.php`
- Test: `staff-service/tests/completion.php`
- Test: `tests/staff/api/completion-http.mjs`
- Test: `tests/staff/api/concurrency.mjs`

**Interfaces:**
- Consumes: complete Editor payload from Task 2.
- Produces: one immutable submission record plus five submission-owned image assets, keyed uniquely by Marketing entry ID.

- [ ] **Step 1: Write failing server validation and privacy tests**

Assert only authorized Editor workflow can close/post; every photo belongs to the actor/workflow, has an allowed image MIME and valid bytes, is distinct, and is copied into submission-owned storage. Assert outbox payload cannot inject status, website ID, public path, branch, customer identity into public projection, or arbitrary property enum values.

- [ ] **Step 2: Write failing retry/concurrency tests**

Assert repeated `mark_posted`, outbox retry, and concurrent delivery produce one submission and five ordered assets.

- [ ] **Step 3: Run API/concurrency tests and confirm failure**

Run configured `completion-http.mjs` and `concurrency.mjs`.

- [ ] **Step 4: Implement strict validation and idempotent delivery**

Preserve pending outbox state after submission-database failure. Rejected submissions never reopen the CRM Marketing entry.

- [ ] **Step 5: Run PHP 8.4 syntax and focused tests**

Expected: syntax clean and all validation/privacy/retry assertions PASS.

- [ ] **Step 6: Commit**

```bash
git add staff-service/src staff-service/tests/completion.php tests/staff/api/completion-http.mjs tests/staff/api/concurrency.mjs
git commit -m "feat: deliver complete property submissions safely"
```

### Task 4: One-action Admin approval and automatic publication

**Files:**
- Modify: `public/api/admin/submissions.php`
- Modify: `public/api/sitemap-helper.php`
- Test: `tests/api/admin-submission-publishing.test.mjs`

**Interfaces:**
- Produces: Admin actions `approve_publish` and `reject` only.
- `approve_publish` accepts `{id,version,action:'approve_publish'}` and returns `{submission_status,website_property_id,published_at}`.
- Retry of an approved-but-not-confirmed publication uses the same action and idempotency mapping.

- [ ] **Step 1: Create failing API publication tests**

Cover complete publication mapping, no customer identity in `properties`, exactly five public gallery assets, unique submission-to-property mapping, version conflict, terminal rejection, invalid status transition, website insert failure, retry after simulated post-commit timeout, concurrent approvals, and sitemap update only after confirmed publication.

- [ ] **Step 2: Run the API test and confirm failure**

Run: `node --test tests/api/admin-submission-publishing.test.mjs` with disposable website/submission databases and authenticated fictional Admin fixture.

- [ ] **Step 3: Implement `approve_publish` as a recoverable two-database workflow**

Record approval in submissions, use `website_submission_publications` as the idempotency key, create or recover the same Property in a website transaction, then mark Published. On website failure retain Approved plus a generic `publish_error`; never report Published prematurely or expose database errors.

- [ ] **Step 4: Implement terminal rejection**

Require a non-empty bounded reason from Submitted only. Reject subsequent approve/retry/edit attempts with `409` and preserve the review event.

- [ ] **Step 5: Run PHP 8.4 lint and API tests**

Expected: syntax clean; all publication, privacy, failure, concurrency, and retry assertions PASS.

- [ ] **Step 6: Commit**

```bash
git add public/api/admin/submissions.php public/api/sitemap-helper.php tests/api/admin-submission-publishing.test.mjs
git commit -m "feat: auto-publish approved property submissions"
```

### Task 5: Admin review-only publishing interface

**Files:**
- Modify: `admin-panel/src/pages/PublishingTasks.tsx`
- Modify: `admin-panel/src/api.ts`
- Test: `admin-panel/src/__tests__/publishing-tasks.test.tsx`

**Interfaces:**
- Consumes: `approve_publish`/`reject` API from Task 4.
- Produces: complete property preview, one `Approve & Publish` button, retry state for Approved publication failures, and terminal Rejected/Published cards.

- [ ] **Step 1: Write failing Admin UI tests**

Assert Admin sees all submitted public fields and five photos; no price/listing inputs exist; one click calls `approve_publish`; pending action disables duplicate clicks; Approved failure shows retry; rejection requires reason; terminal records expose no mutation controls; keyboard/focus and error states work.

- [ ] **Step 2: Run focused Admin test and confirm failure**

Run the Admin test command configured for the new test harness; if no component harness exists, add the minimal Vitest/jsdom setup in this task and document it in `admin-panel/package.json`.

- [ ] **Step 3: Implement the review-only interface**

Keep the existing Admin inline-style convention. Label the database boundary clearly and never request or display internal CRM data beyond the submission record.

- [ ] **Step 4: Run Admin typecheck, tests, and web build**

Run: `npm --prefix admin-panel run typecheck`, the new Admin test command, and `npm --prefix admin-panel run web:build`.

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add admin-panel
git commit -m "feat: add one-click Admin property publishing review"
```

### Task 6: Documentation, package audit, and end-to-end verification

**Files:**
- Modify: `docs/marketing-production-dashboard-requirements.md`
- Modify: `docs/superpowers/plans/2026-11-11-master-dashboard-implementation.md`
- Modify: `docs/staff/dashboard-completion-delivery.md`
- Modify: `docs/staff/current-implementation.md`
- Modify: `scripts/package-dashboard-completion.mjs`
- Modify: `tests/staff/packaging/isolation.test.mjs`
- Create: `tests/staff/browser/editor-admin-publishing.mjs`

**Interfaces:**
- Produces: synchronized owner requirements, deployment checklist, privacy audit, and an end-to-end fictional publishing scenario.

- [ ] **Step 1: Write failing end-to-end and packaging assertions**

Exercise Editor social completion → complete five-photo submission → Admin preview → Approve & Publish → public `/properties` and detail read. Assert Admin cannot call CRM, staff cannot call website writes, customer identity is absent publicly, retry does not duplicate, and rejected submission remains terminal.

- [ ] **Step 2: Update documents with the owner correction**

Replace separate Approve and Publish instructions with one Approve & Publish action; retain Submitted, Approved-retry, Published, and Rejected meanings; state that Rejected is terminal and that approval is not reported Published until the website write succeeds.

- [ ] **Step 3: Run complete verification**

Run public build/lint, staff test/typecheck and all three `scripts/build-staff.mjs` role builds, Admin typecheck/tests/web build, configured `STAFF_PHP` 8.4 lint, disposable three-database API/concurrency tests, browser E2E, packaging privacy/isolation tests, and `git diff --check`.

Expected: every command exits zero; public property appears once with five photos and no private owner data.

- [ ] **Step 4: Prepare a new manual-staging directory only after all gates pass**

Run source audit and packaging script into a new explicit release path. Keep SQL/private/config materials outside upload contents and keep upload/import/server flags false.

- [ ] **Step 5: Record local evidence and owner-run server checks**

Document exact results and retain testing-host verification as outstanding until the owner imports/uploads and verifies Firebase, database isolation, publishing, sitemap, images, and public detail routes.

- [ ] **Step 6: Commit**

```bash
git add docs scripts/package-dashboard-completion.mjs tests/staff
git commit -m "docs: deliver automatic property publishing workflow"
```

## Self-Review

- Spec coverage: complete Editor payload, five photos, Admin isolation, one-action publication, normal Property record, terminal rejection, privacy, retries, and deployment boundaries each map to a task.
- Type consistency: the property submission contract is defined before staff service, Admin API, and UI use it.
- Review focus: malformed assets, privacy leakage, concurrent approval, cross-database timeout, and terminal rejection all have explicit tests.
- Proportion: the plan defines interfaces and assertions without prescribing full component or endpoint bodies.
