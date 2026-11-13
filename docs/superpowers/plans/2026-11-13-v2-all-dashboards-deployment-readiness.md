# V2 All-Dashboards Deployment Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete every existing V2 staff dashboard under the canonical CEO/Manager branch model and produce a fresh, locally verified manual testing-deployment package.

**Architecture:** Continue from commits `700e9a1` and `a053215`, which completed shared canonical-role contracts and fresh/upgrade schema work. Finish server authorization first, then CEO branch/staff operations, branch-safe workflows, shared dashboard UI, and packaging. Keep one role-aware React staff application with `/dashboard/`, `/management/`, and `/callcenter/` entry builds, backed by Firebase Authentication and three separately configured MySQL databases.

**Tech Stack:** React 19, TypeScript, Vite, Node test runner, PHP 8.2+ with PDO, MySQL/InnoDB, Firebase Authentication, existing browser test tooling.

**Spec:** `docs/superpowers/specs/2026-11-13-v2-all-dashboards-deployment-design.md`

## Global Constraints

- V2 only. Never change V1 files, credentials, document root, APIs, or database.
- No live upload, Firebase mutation, SQL import, DNS change, or hosting mutation.
- Staff accounts are created in Firebase first. Only CEO maps exact UID/email/name/role/branch into V2 MySQL.
- Manager and department/team managers cannot provision accounts or roles.
- CEO is global. Every other active internal user belongs to one active branch.
- Each active branch has exactly one Manager. A Manager controls one branch.
- Preserve existing V2 IDs, Firebase UIDs, records, files, audit history, and financial history.
- Use fictional fixtures only. Fresh packages contain no staff, credentials, projects, units, preview records, or showcase artwork.
- Preserve the website, internal CRM, and submissions database boundary. Support separate hosts and credentials.
- Owner performs upload/import manually after receiving the package. Local preparation never proves deployment.
- This release completes shared dashboards. Separate visual/feature improvements for each dashboard belong to the next deployment.

## Review Focus

- A retired-role or branchless user must fail login and session restoration without leaking account details; Task 1 tests this.
- Modified IDs, searches, counts, exports, file IDs, referrals, or payload branches must never reveal or mutate another branch; Tasks 1 and 3 test this.
- Concurrent Manager assignment, staff transfer, account creation, and task updates must produce one valid winner without duplicate or orphaned state; Tasks 2 and 3 test this.
- A retry or partial failure across separate CRM/submission/website databases must not duplicate submissions or published properties; Task 3 tests this.
- The release must not contain secrets, preview code, SQL, private configuration, default accounts, projects, units, or stale assets inside webroot; Task 5 tests this.

---

## Completed Checkpoint

- `700e9a1`: canonical active roles, shared branch policy, role tests, and TypeScript role updates.
- `a053215`: canonical fresh schemas, branch ownership columns, guarded migration `110`, and schema/package tests.

Re-run these focused tests before continuing, but do not rewrite completed tasks unless regression evidence requires it.

### Task 1: Canonical PHP Authentication and Branch Authorization

**Files:**
- Create: `staff-service/src/BranchAccess.php`
- Modify: `staff-service/src/App.php`
- Modify: `staff-service/src/Completion.php`
- Modify: `staff-service/tests/completion.php`
- Create: `tests/staff/api/auth-boundaries.mjs`
- Modify: `tests/staff/api/integration.mjs`

**Interfaces:**
- Consumes: `core_users.branch_id`, `core_branches`, `core_branch_managers`, and canonical roles from completed schema/contracts.
- Produces: `currentBranchId(): ?int`, `requireCeo(): void`, `requireBranchMembership(int $branchId): void`, `branchPredicate(string $column): array`, `activeBranch(int $id): array`, and `assertSameBranch(array ...$records): void`.

- [ ] **Step 1: Add failing authentication tests**

Add cases for CEO without a branch; active non-CEO with one active branch; missing/inactive branch; retired `admin`, `hr_manager`, `branch_manager`, and `assistant_manager`; website Admin; and a stale session whose `auth_version` changed.

- [ ] **Step 2: Add failing read-boundary tests**

For dashboard totals, lists, details, searches, exports, submissions, and private files, assert CEO global reads, same-branch success, and cross-branch `403` or `404` without record details.

- [ ] **Step 3: Run the focused tests and confirm failure**

Run: `node --test tests/staff/api/auth-boundaries.mjs tests/staff/api/integration.mjs`

Expected: FAIL on missing branch helpers, stale role acceptance, or unscoped queries.

- [ ] **Step 4: Implement `BranchAccess` and canonical session enforcement**

Require the trait from `App.php`. Validate active role and branch during Firebase login and every restored session. Use parameterized branch predicates and derive branch ownership from authenticated/linked records.

- [ ] **Step 5: Apply branch scope to all read paths and protected downloads**

Cover tasks, inventory, customers, leads/referrals, contracts, Finance, Marketing, Engineering, submissions, dashboard counts, search, export, verification, and `core_private_files`.

- [ ] **Step 6: Verify PHP and API behavior**

Run PHP lint on `BranchAccess.php`, `App.php`, and `Completion.php`, then rerun the two Node suites.

Expected: syntax clean and all focused assertions PASS.

- [ ] **Step 7: Commit**

```bash
git add staff-service/src staff-service/tests/completion.php tests/staff/api/auth-boundaries.mjs tests/staff/api/integration.mjs
git commit -m "feat: enforce V2 branch authorization"
```

### Task 2: CEO-Only Branch and Firebase-First Staff Management

**Files:**
- Modify: `staff-service/src/App.php`
- Modify: `staff-service/src/BranchAccess.php`
- Modify: `apps/staff/src/api.ts`
- Modify: `packages/staff-contracts/types.ts`
- Modify: `tests/staff/api/integration.mjs`
- Modify: `tests/staff/api/concurrency.mjs`
- Modify: `tests/staff/domain/role-branch-model.test.mjs`

**Interfaces:**
- Produces: `GET /branches`, `POST /branches`, `PATCH /branches/:id`, `POST /branches/:id/manager`, `POST /staff`, `POST /staff/:id/branch`, and `PATCH /staff/:id/active` under `/staff-api/v1/`.
- Produces: `BranchInput`, `ManagerAssignmentInput`, `StaffProvisionInput`, and `StaffBranchTransferInput` contracts.

- [ ] **Step 1: Add failing CEO-only provisioning tests**

Assert Firebase UID/email/name are required; no password field is accepted; CEO may provision Manager and ordinary active roles; Manager and every other role receive `403`; CEO cannot provision CEO, website Admin, or retired roles; duplicates return `409`.

- [ ] **Step 2: Add failing branch lifecycle tests**

Assert an inactive branch may be managerless; activation requires an active Manager; one Manager cannot own two branches; one branch cannot have two Managers; Manager replacement is atomic; concurrent assignment returns one winner and one `409`.

- [ ] **Step 3: Add failing transfer and deactivation tests**

Assert unresolved active tasks/leads/deals block transfer/deactivation with non-sensitive counts. Successful transfer increments `auth_version`, invalidates the prior session, and audits old/new branch plus reason.

- [ ] **Step 4: Run focused tests and confirm failure**

Run: `node --test tests/staff/domain/role-branch-model.test.mjs tests/staff/api/integration.mjs tests/staff/api/concurrency.mjs`

- [ ] **Step 5: Implement transactional CEO-only endpoints**

Use `requireCeo()`, row locks, version checks, canonical role allowlists, server-derived department codes, exact UID/email uniqueness, and no password storage. Remove stale `hr_manager`, `production_manager`, and `photographer` creation options.

- [ ] **Step 6: Run focused tests**

Expected: all provisioning, branch lifecycle, session invalidation, audit, and concurrency assertions PASS.

- [ ] **Step 7: Commit**

```bash
git add staff-service/src apps/staff/src/api.ts packages/staff-contracts/types.ts tests/staff
git commit -m "feat: add CEO-only staff provisioning"
```

### Task 3: Branch-Safe Dashboard Workflows and Separate-Database Handoffs

**Files:**
- Modify: `staff-service/src/App.php`
- Modify: `staff-service/src/Completion.php`
- Modify: `staff-service/src/CompletionRules.php`
- Modify: `packages/staff-contracts/types.ts`
- Modify: `packages/staff-contracts/workflow.mjs`
- Modify: `tests/staff/api/completion-http.mjs`
- Modify: `tests/staff/api/concurrency.mjs`
- Modify: `tests/staff/domain/master-workflow.test.mjs`
- Modify: `staff-service/tests/completion.php`

**Interfaces:**
- Consumes: Task 1 branch predicates and Task 2 CEO/branch APIs.
- Produces: branch-safe task, inventory, customer/lead/referral, agreement, Finance, Marketing/submission, Engineering, export, and file operations.

- [ ] **Step 1: Add failing same-branch and cross-branch mutation tests**

For each root workflow, assert same-branch success and modified foreign identifiers/payload branches fail without revealing the target. Include referrals, contract issuance, deposits, Marketing assets, Engineering versions, exports, and private downloads.

- [ ] **Step 2: Add failing task lifecycle tests**

Assert CEO assigns across branches; Manager assigns only within their branch where permitted; team leaders assign only within branch/team; assignees progress their own tasks; assigners review/reopen/cancel; version conflicts return `409`; all transitions are audited.

- [ ] **Step 3: Add failing separate-database retry tests**

Assert CRM-to-submission and Admin-to-website retries are idempotent, do not assume one MySQL host/transaction, preserve retryable failure state, and mark `Published` only after one website record ID exists.

- [ ] **Step 4: Run focused tests and confirm failure**

Run: `node --test tests/staff/api/completion-http.mjs tests/staff/api/concurrency.mjs tests/staff/domain/master-workflow.test.mjs` and the configured PHP completion suite.

- [ ] **Step 5: Implement minimal branch-safe mutations and handoffs**

Use server-derived branch IDs, permission checks, transactions within each database, idempotency keys across database boundaries, optimistic versions, immutable snapshots/history, and protected file ownership.

- [ ] **Step 6: Run focused regression suites**

Expected: all workflow isolation, task lifecycle, retry, concurrency, and audit assertions PASS.

- [ ] **Step 7: Commit**

```bash
git add staff-service/src staff-service/tests packages/staff-contracts tests/staff
git commit -m "feat: complete branch-safe dashboard workflows"
```

### Task 4: Shared Dashboard UI and CEO Branch Workspace

**Files:**
- Create: `apps/staff/src/components/BranchManagementWorkspace.tsx`
- Modify: `apps/staff/src/main.tsx`
- Modify: `apps/staff/src/api.ts`
- Modify: `apps/staff/src/preview.ts`
- Modify: `apps/staff/src/i18n/en.json`
- Modify: `apps/staff/src/i18n/fa.json`
- Modify: `apps/staff/src/styles.css`
- Modify: `apps/staff/vite.config.ts`
- Modify: `tests/staff/domain/preview-client.test.mjs`
- Modify: `tests/staff/browser/completion-ui.mjs`
- Modify: `tests/staff/packaging/isolation.test.mjs`

**Interfaces:**
- Consumes: Tasks 2 and 3 APIs and canonical role contracts.
- Produces: CEO-only branch/staff controls, visible branch context, and complete role-aware `/dashboard/`, `/management/`, and `/callcenter/` entry builds.

- [ ] **Step 1: Add failing role-navigation tests**

For every active role, assert its required workspace is visible, forbidden workspaces/actions are absent, and legacy role labels/options are absent. Assert Manager has no staff provisioning action.

- [ ] **Step 2: Add failing CEO branch-workspace tests**

Assert CEO can create inactive branches, assign/replace Managers, activate branches, map Firebase-first users, transfer staff, and see conflict/error states. Assert non-CEO users cannot render those controls.

- [ ] **Step 3: Add failing entry-build and responsive tests**

Assert all three entry shells use shared code, preserve independent asset bases/deep links/noindex, enforce session role rather than URL, and remain usable at 375, 768, 1024, and 1440 pixels with keyboard/focus and Dari/RTL where supported.

- [ ] **Step 4: Run tests and confirm failure**

Run: `node --test tests/staff/domain/preview-client.test.mjs tests/staff/packaging/isolation.test.mjs` and the configured Playwright completion UI suite.

- [ ] **Step 5: Implement shared role-aware UI**

Reuse current workspace components and teal design system. Add branch context and CEO controls. Remove stale preview-only assumptions and retired-role choices. Do not redesign individual dashboards in this release.

- [ ] **Step 6: Verify type checks and entry builds**

Run:

```bash
npm --prefix apps/staff run typecheck
npm --prefix apps/staff test
node scripts/build-staff.mjs --role callcenter --out <new-callcenter-temp-directory>
node scripts/build-staff.mjs --role management --out <new-management-temp-directory>
node scripts/build-staff.mjs --role dashboard --out <new-dashboard-temp-directory>
```

Then rerun the browser suite.

- [ ] **Step 7: Commit**

```bash
git add apps/staff tests/staff/domain/preview-client.test.mjs tests/staff/browser/completion-ui.mjs tests/staff/packaging/isolation.test.mjs
git commit -m "feat: complete shared V2 staff dashboards"
```

### Task 5: Manual Deployment Package and Full Verification

**Files:**
- Modify: `scripts/package-dashboard-completion.mjs`
- Modify: `tests/staff/packaging/completion-schema.test.mjs`
- Modify: `tests/staff/packaging/v2-kit.mjs`
- Modify: `docs/staff/dashboard-completion-delivery.md`
- Modify: `docs/staff/current-implementation.md`
- Modify: `docs/staff/departments-and-roles.md`
- Modify: `docs/superpowers/plans/2026-11-11-master-dashboard-implementation.md`
- Create: `docs/staff/v2-dashboard-deployment-verification-2026-11-13.md`

**Interfaces:**
- Consumes: complete source, SQL, tests, and role builds.
- Produces: one fresh manual-staging folder with public/private ZIPs, three-database SQL, upgrade material, instructions, manifest, hashes, and honest build status.

- [ ] **Step 1: Add failing package assertions**

Assert the public ZIP includes required hidden files and all entry builds but excludes private config, SQL, credentials, preview code, service-account material, default users, project/unit data, and unreferenced showcase artwork. Assert private and database materials remain outside webroot.

- [ ] **Step 2: Update packaging and manual instructions**

Document Firebase-first creation and CEO-only MySQL mapping, branch/Manager setup order, separate database configuration, fresh versus upgrade SQL, manual upload/import, rollback, and server checks. Remove all statements that Managers provision users.

- [ ] **Step 3: Run complete source verification**

Run public/Admin/staff type checks and production builds, all staff domain/API/concurrency/packaging tests, PHP lint, configured disposable-MySQL integration tests, configured browser workflows, and `git diff --check`. Record unavailable tools as unverified; never substitute a weaker check.

- [ ] **Step 4: Run source audit and create a new release**

Run `node scripts/package-dashboard-completion.mjs --audit-source`, then run the packager with the required public Firebase key in the process environment and a new `releases/manual-staging-dashboard-completion-<timestamp>/` target. Never read `.env.local` or reuse repository `dist`.

- [ ] **Step 5: Verify the produced release**

Run manifest, archive CRC/hash, forbidden-material, required-file, fresh three-database import, packaged PHP/API, empty-catalog, anonymous denial, Admin/CRM isolation, and static-shell smoke checks against fictional local services.

- [ ] **Step 6: Record evidence and remaining owner actions**

Write exact commands/results and package paths/hashes. Keep `serverUploaded`, `databaseImported`, and `serverVerified` false. State that real Firebase, Apache, PHP extensions, private paths, import, isolation, browser, and log checks remain owner-run on the testing host.

- [ ] **Step 7: Commit**

```bash
git add scripts tests/staff/packaging docs/staff docs/superpowers/plans/2026-11-11-master-dashboard-implementation.md
git commit -m "build: prepare complete V2 dashboard release"
```

## Self-Review

- Spec coverage: CEO-only Firebase-first provisioning, canonical roles, branch lifecycle, every shared dashboard workflow, three-database isolation, empty catalogs, packaging, and owner-run deployment each map to a task.
- Step scan: every task contains failing tests, observed failure, one implementation phase, passing verification, and a checkpoint commit.
- Type consistency: Tasks 2 and 4 use the same `BranchInput`, `ManagerAssignmentInput`, `StaffProvisionInput`, and `StaffBranchTransferInput` contracts.
- Review Focus: authentication, cross-branch identifiers, concurrency, cross-database retries, and package leakage each have an owning test task.
- Proportion: the plan specifies contracts and observable behavior without embedding implementation bodies.
