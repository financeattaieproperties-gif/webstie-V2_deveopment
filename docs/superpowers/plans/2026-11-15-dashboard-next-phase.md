# Dashboard Polish and Business Modules Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for native execution, task by task. Checkboxes track progress. The owner requested that implementation resume in the next session.

**Goal:** Preserve the approved dashboard layout, improve component quality, and add document storage, date-based operational visibility, cash approvals, payroll, and five-minute Google Sheets exports with a defined recovery strategy.

**Architecture:** Extend the existing shared dashboard foundation and V2 PHP/MySQL staff service with focused modules and server-enforced permissions. Store vault bytes privately on cPanel and metadata in Internal CRM. Keep external scheduled exports in a private server-side worker with explicit data scope.

**Tech Stack:** Existing React/TypeScript dashboard apps, shared CSS, PHP/PDO, V2 MySQL, private cPanel storage, proposed cPanel cron and Google Sheets API.

**Spec:** `docs/superpowers/specs/2026-11-15-dashboard-next-phase-notes.md`

**Status:** Saved planning draft. Business decisions listed in the spec remain open. No feature implementation has begun. API/file names below are proposed implementation boundaries, to be checked against concurrent work before editing.

## Global constraints

- Keep the existing Alabaster Split-Rail layout and navigation. Polish components; do not replace the layout or redesign the public website.
- Apply the dashboard standard to Website Admin and all staff workspaces, with separate React 18/19 implementations where needed.
- Preserve EN/Dari, RTL, keyboard access, mobile behavior, and reduced motion. Use existing tokens and icon conventions.
- Use only V2 testing hosting and databases. Apply additive, versioned migrations with backups; preserve current records and UID mappings.
- Server-side authentication and permissions govern all document operations, activities, approvals, and payroll.
- Private documents, credentials, real workbook contents, export keys, and generated account SQL remain outside public assets and Git.
- Hosting was observed using PHP 8.1 despite an earlier PHP 8.4 selection. Verify the effective runtime before introducing language features; retain the existing compatibility correction.
- Resume from `codex/v2-testing-release-20261114` in `.worktrees/v2-testing-release`, after reviewing branch status and other active work.
- A separate app master plan and uncommitted app changes exist in the main checkout. Preserve them. Reconcile any glassmorphism/theme proposals against the owner's explicit requirement to retain the approved dashboard format.

## Review focus

1. Cross-user or cross-department document access, including guessing download URLs, must fail; Finance exceptions must override ordinary sharing. Covered in Task 3.
2. Date selection near midnight must use the company timezone consistently and never leak another branch's activities. Covered in Task 4.
3. Repeated or concurrent approval/payment submissions must not double-approve, double-pay, or change approved amounts. Covered in Tasks 5–6.
4. Long Dari/English descriptions and maximum permitted line items must print on one readable A4 page without silently losing content. Covered in Task 5.
5. A five-minute export must handle overlap, retries, API quotas, deletion, and failure reporting; spreadsheet export must not be described as a tested database restore. Covered in Task 7.

## Task 1 — Finalize requirements and inspect the cash-request workbook

**Files:** Update the paired notes/spec and this plan. Read `C:\Users\RoheenAhmadi\Downloads\expense.xlsx` using the spreadsheet skill. Do not alter the workbook.

- [ ] Resolve the administrator/CEO distinction and document/branch permission questions from the spec.
- [ ] Inspect every relevant workbook sheet, used cells, labels, formulas, merged cells, print area, signatures, and approval fields; record the field mapping without copying real financial records into Git.
- [ ] Define payroll inputs and approval/payment lifecycle with the owner.
- [ ] Define Google Sheets destination, authorized export fields, retention, and restore expectations.
- [ ] Split the approved decisions into focused module specifications before implementation; no unresolved permission policy becomes an implicit default.

**Deliverable:** Approved permission matrix, workbook field map, payroll scope, and export/recovery design.

## Task 2 — Polish components and codify the dashboard standard

**Existing files:** `shared/alabaster-dashboard.css`, `src/components/ui/dashboard-alabaster-split-rail.tsx`, `apps/staff/src/styles.css`, `apps/staff/src/main.tsx`, `apps/staff/src/components/`, `admin-panel/src/components/`, `DESIGN.md`, `AGENTS.md`.

**Interfaces:** Shared semantic visual tokens and component patterns; no cross-import of React implementations between apps.

- [ ] Inventory current icons, tables, charts, cards, forms, menus, loading/empty/error states, and responsive variants; record representative before screenshots.
- [ ] Refine typography, spacing, icon sizes/strokes, borders, shadows, numeric alignment, table hierarchy, chart readability, and interaction feedback using the existing palette/layout.
- [ ] Apply shared patterns consistently across all dashboard roles, including accessible labels, focus states, contrast, and 44px mobile touch targets.
- [ ] Document the approved format as the default for future dashboards in `DESIGN.md` and scoped agent instructions; include reuse rules and a regression checklist.
- [ ] Verify representative populated/empty/error screens at 375/768/1024/1440 widths, EN/Dari/RTL, keyboard, and reduced motion. Compare the actual packaged CSP with any style/animation changes.
- [ ] Commit the completed visual increment after verification.

## Task 3 — Implement the cPanel document vault

**Proposed files:** `staff-service/src/DocumentVault.php`, `staff-service/src/DocumentVaultPolicy.php`, `apps/staff/src/components/DocumentVault.tsx`, `tests/staff/api/document-vault.mjs`; next unused V2 migration after inspecting the database directory. Integrate through `App.php`, `packages/staff-contracts/types.ts`, `apps/staff/src/api.ts`, and existing navigation.

**Interfaces:** Proposed `/staff-api/v1/vault/folders` and `/vault/files` endpoints; authenticated file-ID download/update/delete operations. Metadata tracks owner, department, branch where applicable, storage key, version, MIME type, size, and audit events. Never return filesystem paths.

- [ ] Test the approved permission matrix for list/upload/update/delete/download, personal-folder exclusivity, Finance restrictions, and cross-branch access before implementing routes.
- [ ] Add additive folder/file metadata schema and narrowly scoped permissions; provision folders idempotently for departments and staff.
- [ ] Store files outside all document roots with generated storage names, validated MIME/size limits, safe authenticated streaming, conflict detection, and recoverable deletion.
- [ ] Add the Documents tab with department/personal folders, upload progress, search, metadata, empty/error states, and permission-aware actions.
- [ ] Verify guessed file IDs, path traversal, executable uploads, inactive users, concurrent updates, failed uploads, and quota errors. Permission failures must leave stored bytes unchanged.
- [ ] Commit after API and browser verification with fictional files.

## Task 4 — Add date cards for leads, visits, and employee activities

**Proposed files:** `staff-service/src/ActivityCalendar.php`, `apps/staff/src/components/ActivityCalendar.tsx`, `tests/staff/api/activity-calendar.mjs`; shared contract/client and router integration.

**Interfaces:** Proposed `GET /staff-api/v1/activities?date=YYYY-MM-DD` returning permitted activities with type, scheduled time, employee, status, and source-record link. Date boundaries use `Asia/Kabul`, matching existing workflow behavior.

- [ ] Map existing follow-ups, visits, and tasks to the activity contract. Identify any missing visit scheduling model before adding schema.
- [ ] Test timezone boundaries, authorization, pagination, rescheduling, completed/cancelled events, and empty days.
- [ ] Build a date selector and date cards with summaries; opening a card displays the day's activity table and source-record links.
- [ ] Implement agreed CEO/Manager visibility on the server and exercise desktop/mobile/RTL views with fictional activities.
- [ ] Commit after verification.

## Task 5 — Add Finance cash requests, approval, and one-page A4 printing

**Proposed files:** `staff-service/src/CashRequests.php`, `apps/staff/src/components/CashRequests.tsx`, `apps/staff/src/components/CashRequestPrint.tsx`, `apps/staff/src/cash-request-print.css`, `tests/staff/api/cash-requests.mjs`, `tests/staff/browser/cash-request-print.mjs`; versioned migration and shared contracts/client integration.

**Interfaces:** Proposed `/staff-api/v1/finance/cash-requests`; explicit submit/approve/reject operations with record version and idempotency key. Provisional lifecycle: draft → submitted → approved/rejected; resubmission and disbursement rules depend on Task 1.

- [ ] Convert the inspected workbook into validated request fields, item rows, totals, request reference/date, and approval/signature layout.
- [ ] Test Finance submission and authorized approval, self-approval policy, stale versions, repeated submissions, immutable approved amounts, rejection reasons, and audit history.
- [ ] Implement exact-decimal or integer-minor-unit money handling and server-calculated totals; add Finance request queue and the approved administrator review UI.
- [ ] Implement a dedicated print view matching the workbook's essential structure on one A4 page, excluding navigation. Constrain entry length/row count clearly instead of clipping content or shrinking it unreadably.
- [ ] Render actual printable output with minimum/maximum line counts and long English/Dari text; verify one A4 page, readable totals/signatures, and no cut-off rows.
- [ ] Commit after request, approval, and print verification.

## Task 6 — Add employee payroll to Finance

**Proposed files:** `staff-service/src/Payroll.php`, `apps/staff/src/components/Payroll.tsx`, `tests/staff/api/payroll.mjs`; versioned migration and shared contracts/client integration.

**Interfaces:** Proposed `/staff-api/v1/finance/payroll-runs` with period, currency, employee items, approval state, and payment references. Final salary/deduction rules come from Task 1.

- [ ] Define salary records and payroll-period uniqueness, preserving the calculation inputs used for each historical run.
- [ ] Test arithmetic/rounding, duplicate runs, unauthorized salary access, repeated payment recording, and changes after approval.
- [ ] Implement the agreed preparation → review/approval → paid lifecycle with correction/audit records rather than rewriting paid history.
- [ ] Add the Finance employee payroll table, period filter, totals, approved payment recording, and payslip/export only as agreed in scope.
- [ ] Verify using fictional staff salary data and commit.

## Task 7 — Add scheduled Google Sheets export and recoverable backups

**Proposed files:** `staff-service/tools/export-google-sheets.php`, `staff-service/src/SpreadsheetExport.php`, `staff-service/config/export.example.php`, `docs/staff/v2-backup-and-export.md`, `tests/staff/api/spreadsheet-export.mjs`; private backup worker and migration only if selected by the recovery design.

**Interfaces:** A private CLI worker scheduled every five minutes by cPanel cron, with explicit database/table/column allowlists, external record keys, run status, checkpoints, and a lock against overlapping jobs. Credentials stay outside the web root.

- [ ] Check current official Google API limits, authentication requirements, cPanel cron availability, expected row growth, and runtime before committing to the design.
- [ ] Distinguish a Google Sheets data mirror from a restorable MySQL backup: schemas, relationships, deletion history, and file bytes need a separate recovery plan. Present that decision to the owner before setup or data transfer.
- [ ] Test batching, stable identifiers, duplicate/retried runs, deleted records, spreadsheet-formula injection, rate-limit backoff, credentials failure, and lock expiration with synthetic data.
- [ ] Implement bounded exports with checkpoints and last-success/last-failure reporting; never expose secrets or sensitive excluded columns in Sheets.
- [ ] If approved, implement private restorable database snapshots with retention and encryption, then restore to a disposable V2 test database to prove recovery.
- [ ] Configure the agreed destination and five-minute schedule only after scope/access are resolved. Confirm observed executions and commit source/docs.

## Task 8 — Integrate, package, and resume hosted acceptance

**Files:** `scripts/package-dashboard-completion.mjs`, deployment templates, `docs/staff/dashboard-completion-delivery.md`, the V2 release progress plan, and module verification scripts.

- [ ] Include new PHP modules, private configuration examples, additive migration order, and existing PHP/CSP fixes in a fresh manual staging package. Preserve installed credentials and user data during upgrades.
- [ ] Run root build/type checks, Staff/Admin type checks, affected API fixtures, and browser checks for all roles. Record unavailable tests honestly.
- [ ] Review public/private archive boundaries and ensure no real workbook data, documents, payroll records, identity maps, or export credentials enter Git/public ZIPs.
- [ ] Resume pending hosted property-publication acceptance, then test vault authorization, calendar views, cash request/approval/print, payroll, and scheduled exports using fictional records.
- [ ] Record what is verified versus pending, deployment/rollback instructions, and any approved fixture cleanup.

## Next-session starting point

Read the paired owner-notes spec and this plan, inspect current worktree state, resolve Task 1 decisions one at a time, and inspect `expense.xlsx`. Begin implementation only after those decisions establish the affected module's requirements. Do not treat login success as full workflow acceptance.

## Self-review

All seven owner notes map to Tasks 2–7; Task 1 holds the specific unresolved choices and workbook analysis, and Task 8 covers packaging/acceptance. The five review failure modes have owning verification tasks. Existing public-site design and unrelated app work remain outside this change. This is a next-session plan, not a claim that these features are implemented.
