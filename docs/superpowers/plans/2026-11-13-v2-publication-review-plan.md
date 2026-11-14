# V2 Editor Publication Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the assigned Editor submit five photos/property details through database three, receive Admin decisions, and correct/re-submit rejected listings safely.

**Architecture:** Retain internal production records and use a revisioned outbox to copy only website publication material into the submission database. Website Admin reviews the current revision and publishes into the website database through the existing retry-safe mapping. Neither runtime receives credentials for the other's primary database.

**Tech Stack:** Existing staff/Admin React applications, PHP/PDO/mysqli, three separate MySQL databases, current publication mapping/outbox.

**Spec:** `docs/superpowers/specs/2026-11-13-v2-website-crm-boundaries-design.md`

## Global Constraints

- Apply every constraint in `2026-11-13-v2-readiness-index.md`.
- Website Admin has no CRM access; Editor cannot publish or directly mutate website listings.
- Exactly five distinct authorized photos plus property details; video completion precedes submission, but social posting is not a prerequisite.
- Rejection requires a reason. Rejected content can be corrected/resubmitted without losing review history.
- Keep existing approval then publication controls and required verified price/listing type.

## Review Focus

- Retried old revisions cannot overwrite a newer review or published listing (Tasks 1/2).
- Five-photo validation includes exactly five inputs and distinct file identity, not merely five unique values in a longer array (Task 2).
- A website commit followed by submission-status failure must recover one published property (Task 2).
- Submitted/rejected photos must not leak through guessed public URLs (Task 2).
- Editor attribution must survive production entries created by another employee (Tasks 1/3).

## Task 1: Revisioned publication schema and contracts

**Files:** Create `staff-service/database/104-submission-revisions-internal.sql`, `staff-service/database/105-submission-revisions-third.sql`; modify `packages/staff-contracts/types.ts`; extend `tests/staff/packaging/completion-schema.test.mjs`; create `staff-service/tests/submission-revisions.php`.

**Interfaces:** `WebsiteSubmissionPayload = {entryId: number; revision: number; serialNumber: string; propertyInfoNote: string; photos: string[]; submittedById: number; submittedByName: string; customerName: string; address: string; propertyType: 'Villa' | 'Block' | 'Building' | 'Apartment'}`. Staff/Admin DTOs expose `revision`, review history, and nullable `publishedRevision`, retaining current field aliases. The internal actor ID is retained internally for authorization/audit; copy only the actor display name and stable production/revision identifiers into database three, not a staff account record.

- [ ] Add schema fixture tests for existing records as revision 1, revisioned outbox uniqueness `(entry_id,revision)`, and immutable review snapshots. Existing row/photo/event counts must survive the upgrade. A revision must have its own five ordered assets.
- [ ] Run the fixture/schema tests and confirm missing revision fields/keys fail.
- [ ] Add `website_revision` to internal production entries and `revision` to outbox; replace the single-entry uniqueness constraint with `(entry_id,revision)`. Store an immutable payload per revision. In database three add current/published revision fields and `sub_post_revisions` snapshots; extend photo/asset keys with `revision` defaulting existing records to 1. Include revision in review events. Preserve existing social-platform values; allow a website-only submission without claiming a social post occurred.
- [ ] Backfill revision 1 non-destructively, preserving published revision mappings and all events. Add fresh-schema composition and upgrade-order instructions for both distinct database targets; no cross-database imports or CRM credentials in Admin config.
- [ ] Rerun tests, expect preserved counts/keys; commit with `feat: version editor website publication submissions`.

## Task 2: Editor submission, Admin review, and retry-safe publication

**Files:** Modify `staff-service/src/Completion.php`, `public/api/admin/submissions.php`, `public/api/submission-photo.php`, `staff-service/tests/completion-database.php`; create `tests/website/publication-http.mjs`.

**Interfaces:** Staff `POST marketing/entries/:id` adds action `submit_website` with `{version,serialNumber,propertyInfoNote,photos}` and `resubmit_website` with the same fields plus `rejectedRevision`. The server assigns revision and actor. Admin mutation bodies include existing `{id,action,version}` plus `revision`, reason for rejection, and verified price/listing type for publication. Keep `mark_posted` as the social-post action without implicit website publication.

- [ ] Add isolated three-database HTTP tests: correct assigned Editor accepted; wrong actor rejected; arrays of 4/6 photos and duplicate file IDs rejected; exactly 5 authorized photos accepted; website submission works before social posting; Admin/staff database boundaries hold. Assert submitter is Editor rather than production originator.
- [ ] Add rejected revision 1/corrected revision 2 tests: Admin sees new details/photos, reason/history survives, stale revision approval fails, duplicate outbox flush is a no-op, and late revision 1 delivery cannot reset revision 2. Rejection with blank reason fails.
- [ ] Add publish recovery and privacy tests: website commit/status-update failure then retry leaves one property/mapping; unapproved photo URL returns denial anonymously; authorized Admin can preview; published revision photos remain public; other staff cannot enumerate private assets. Retry with stale versions cannot emit duplicate approval/publication events.
- [ ] Run `node tests/website/publication-http.mjs`; confirm failures are the missing revision/resubmission behavior.
- [ ] Implement assigned-Editor guards, five-item/distinct-file validation, immutable revision outbox enqueue, current-revision comparisons, and revision-aware outbox delivery. Copy only the selected marketing assets and publication fields. Outbox replay must distinguish entry-ID matches from serial conflicts; never silently map a different entry with a colliding serial. Retain failures pending with actionable status.
- [ ] Implement nonempty rejection reasons and version/revision checks. Preserve approval/publication steps, idempotent website mapping, and recovery after partial cross-database commit. Photo endpoint serves only published revision assets publicly and uses Admin authorization for previews; staff preview uses their authorized private files, not Admin credentials.
- [ ] Rerun HTTP tests and existing `node tests/staff/api/completion-http.mjs`; expect all assertions. Commit with `feat: support reviewed editor resubmissions without duplicate listings`.

## Task 3: Editor corrections and Admin review history

**Files:** Modify `apps/staff/src/components/MarketingWorkspace.tsx`, `apps/staff/src/main.tsx`, `apps/staff/src/api.ts`, `apps/staff/src/preview.ts`, staff EN/FA locales, `admin-panel/src/api.ts`, `admin-panel/src/pages/PublishingTasks.tsx`; create `tests/staff/browser/publication-review.mjs`.

**Interfaces:** Extend the existing `onAdvanceEntry` action union with `submit_website | resubmit_website`; consume revision/history DTO fields from Tasks 1/2. Keep the existing social-post controls independent.

- [ ] Write browser assertions: assigned Editor submits five photos/details after editing, sees Submitted status, receives rejection reason, corrects/resubmits, and sees preserved review history. Website Admin previews/rejects/approves/publishes current content; no CRM navigation/data appears. Test stale-tab conflicts and preview URLs in a separate unauthenticated context.
- [ ] Run `node tests/staff/browser/publication-review.mjs`; expect failures before new actions/history exist.
- [ ] Add Editor controls and correction flow using existing form/layout patterns and localized strings. Add current revision/history to Admin review, preserve price/listing-type validation, and refresh after conflicts. State that Submitted/Approved is not Published. Never label a website submission as a completed social post.
- [ ] Run browser tests, `npm.cmd --prefix apps/staff run typecheck`, and `npm.cmd run build:admin`; expect exit 0. Commit with `feat: review and correct editor website submissions`.

## Completion evidence

Record both normal review and partial-commit recovery results. All three test databases must be fictional and isolated; source-only schema checks are supplemental evidence, not proof of workflow correctness.
