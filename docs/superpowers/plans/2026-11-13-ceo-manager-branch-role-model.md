# CEO, Manager, and Branch Role Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ambiguous Manager/HR/CEO role model with canonical `ceo` and branch-scoped `manager` roles, remove legacy branch roles and internal Admin access, and enforce one-branch-per-staff authorization throughout the V2 CRM.

**Architecture:** Keep Firebase authentication and the shared React staff app, but make MySQL permissions and branch relationships authoritative. Add a focused shared branch policy module, a PHP branch-authorization trait, explicit branch ownership on root workflow records, and a guarded manual migration that preserves IDs, Firebase UIDs, and history.

**Tech Stack:** React 19, TypeScript, Vite, Node test runner, PHP 8.4/PDO, MySQL/InnoDB, Firebase Authentication.

**Spec:** `docs/superpowers/specs/2026-11-12-ceo-manager-role-model-design.md`

## Global Constraints

- V2 only; do not change V1 files, credentials, databases, or document root.
- Do not deploy, upload, import SQL, or operate on a real database during implementation.
- Canonical internal roles are `ceo` and `manager`; website Admin is not an internal CRM role.
- CEO is global. Every other active internal staff account belongs to exactly one active branch.
- Each active branch has exactly one active Manager, and one Manager controls only one branch.
- Preserve existing IDs, Firebase UIDs, tasks, contracts, audit records, and financial history in compatibility SQL.
- Fresh packages contain no default users, credentials, projects, apartments, or showcase artwork.
- Keep three database boundaries: website, internal CRM, submissions.
- Use fictional fixtures only.
- Use tests before implementation and record fresh verification; historical checkmarks are not acceptance evidence.

## Review Focus

- A Manager modifying a URL, search, export, count, file identifier, or payload must never reveal or mutate another branch; covered in Tasks 3 and 5.
- A second migration import must not remap a newly converted Manager to CEO; covered in Task 2.
- Staff transfer must reject unresolved active work and preserve the previous branch in audit history; covered in Tasks 3 and 4.
- Retired `admin`, `hr_manager`, `branch_manager`, and `assistant_manager` sessions must fail closed even if old grants remain temporarily; covered in Tasks 2 and 3.
- CEO submission visibility must remain read-only and must not provide website publishing or website-database access; covered in Tasks 3 and 7.

---

## File Map

- Create `packages/staff-contracts/branch-policy.mjs`: pure canonical-role and branch-scope rules shared by domain tests and preview behavior.
- Modify `packages/staff-contracts/types.ts`: canonical roles, branch fields, session/dashboard contracts.
- Modify `packages/staff-contracts/workflow.mjs`: remove legacy manager grouping and delegate branch decisions to explicit policy.
- Create `staff-service/src/BranchAccess.php`: PHP branch scope, assignment, transfer, and authorization helpers.
- Modify `staff-service/src/App.php`: canonical login rejection, branch APIs, staff provisioning, task scope, and trait integration.
- Modify `staff-service/src/Completion.php`: branch filters for every operational module and private download.
- Modify `staff-service/database/001-core.sql` and module SQL `010`–`060`: canonical fresh roles, branch schema, permissions, and branch columns.
- Create `staff-service/database/110-ceo-manager-branch-model.sql`: guarded compatibility migration.
- Modify `deployment/v2/complete-v2-mysql-schema.sql`: synchronized fresh schema.
- Create `apps/staff/src/components/BranchManagementWorkspace.tsx`: CEO branch and assignment interface.
- Modify `apps/staff/src/api.ts`, `main.tsx`, `preview.ts`, and locale files: branch-aware UI and canonical labels.
- Modify staff PHP/API/browser/packaging tests: authorization, migration, UI, and package evidence.
- Modify dashboard requirements, master plan, AGENTS.md terminology, staff role/deployment documents: authoritative names and boundaries.

### Task 1: Canonical role and branch policy contracts

**Files:**
- Create: `packages/staff-contracts/branch-policy.mjs`
- Modify: `packages/staff-contracts/types.ts`
- Modify: `packages/staff-contracts/workflow.mjs`
- Test: `tests/staff/domain/role-branch-model.test.mjs`

**Interfaces:**
- Produces: `ACTIVE_INTERNAL_ROLES`, `RETIRED_INTERNAL_ROLES`, `isGlobalRole(role)`, `requiresBranch(role)`, `canProvisionRole(actorRole, targetRole)`, `canReadBranch(actor, branchId)`, and `validateBranchAssignment(input)`.
- Produces: `Branch`, `BranchAssignment`, and canonical `Role` TypeScript types consumed by the API, preview, and UI tasks.

- [ ] **Step 1: Write failing canonical-role tests**

Assert that `manager`, `hr_manager`, `branch_manager`, `assistant_manager`, and `admin` do not inherit the old shared top-management behavior; `ceo` is global; `manager` requires one branch; CEO may provision Manager and ordinary staff but not CEO/Admin; Manager cannot provision staff.

- [ ] **Step 2: Run the focused test and confirm the old model fails**

Run: `node --test tests/staff/domain/role-branch-model.test.mjs`

Expected: FAIL because the policy module does not exist and the current role union/helper still treats legacy roles as active management.

- [ ] **Step 3: Implement the pure role and branch policy**

Use exact stored roles `ceo`, `manager`, `callcenter`, `sales_leader`, `sales`, `marketing_manager`, `editor`, `videographer`, `finance_manager`, `architect`, `graphic_designer`, and `visual_designer_3d`. Keep retired codes only in migration-facing types if needed; do not expose them as selectable active roles.

- [ ] **Step 4: Run focused and existing domain tests**

Run: `node --test tests/staff/domain/role-branch-model.test.mjs tests/staff/domain/master-workflow.test.mjs tests/staff/domain/workflow.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/staff-contracts/branch-policy.mjs packages/staff-contracts/types.ts packages/staff-contracts/workflow.mjs tests/staff/domain/role-branch-model.test.mjs
git commit -m "refactor: define canonical CEO and branch manager roles"
```

### Task 2: Fresh schema and guarded compatibility migration

**Files:**
- Modify: `staff-service/database/001-core.sql`
- Modify: `staff-service/database/010-callcenter.sql`
- Modify: `staff-service/database/020-inventory.sql`
- Modify: `staff-service/database/030-sales-crm.sql`
- Modify: `staff-service/database/040-hr-finance.sql`
- Modify: `staff-service/database/050-marketing-production.sql`
- Modify: `staff-service/database/055-submissions-db.sql`
- Modify: `staff-service/database/060-engineering.sql`
- Modify: `staff-service/database/090-role-migration.sql`
- Modify: `staff-service/database/100-dashboard-completion.sql`
- Create: `staff-service/database/110-ceo-manager-branch-model.sql`
- Modify: `deployment/v2/complete-v2-mysql-schema.sql`
- Test: `tests/staff/domain/schema.test.mjs`
- Test: `tests/staff/packaging/completion-schema.test.mjs`

**Interfaces:**
- Consumes: canonical roles from Task 1.
- Produces: `core_branches(code,name,address,phone,email,active,version)`, `core_branch_managers(branch_id,manager_user_id,assigned_by,assigned_at)`, branch ownership columns, indexes, and migration version `core/3`.

- [ ] **Step 1: Add failing schema assertions**

Assert fresh SQL registers `ceo` and `manager` under Management; omits active `admin`, `hr_manager`, `branch_manager`, and `assistant_manager`; grants CEO former Manager powers; grants Manager former HR powers without Finance writes; defines one-manager-per-branch uniqueness; and adds branch ownership to `inv_projects`, `cc_customers`, `cc_leads`, `core_management_tasks`, and `mkt_production_entries`. Assert submissions carry a non-FK `origin_branch_id` for cross-database filtering.

- [ ] **Step 2: Add failing migration idempotency assertions**

Assert migration `110` uses a persistent applied marker before role remapping, maps old `manager → ceo` and `hr_manager → manager` only on its first successful run, disables legacy internal Admin/branch-role accounts, clears their sessions through `auth_version`, and never guesses missing branch assignments.

- [ ] **Step 3: Run schema tests and confirm failure**

Run: `node --test tests/staff/domain/schema.test.mjs tests/staff/packaging/completion-schema.test.mjs`

Expected: FAIL on legacy roles/grants and missing migration/branch columns.

- [ ] **Step 4: Implement fresh schemas and migration**

Use an explicit migration ledger/marker and a transaction for role/user/grant remapping. Keep permissionless retired role rows only while referenced. Add a report query or migration audit table for active accounts/records missing branch assignment; do not assign a default branch.

- [ ] **Step 5: Run schema tests twice against a disposable MySQL fixture**

Run: the repository's PHP/MariaDB setup followed by `staff-service/database/110-ceo-manager-branch-model.sql` twice, then `node tests/staff/api/integration.mjs` with `STAFF_PHP` and the fictional fixture environment.

Expected: first import maps legacy users once; second import makes no role changes; IDs/Firebase UIDs remain unchanged; accounts without explicit branches remain inactive or inaccessible.

- [ ] **Step 6: Commit**

```bash
git add staff-service/database deployment/v2/complete-v2-mysql-schema.sql tests/staff/domain/schema.test.mjs tests/staff/packaging/completion-schema.test.mjs
git commit -m "feat: migrate V2 CRM to CEO and branch-scoped managers"
```

### Task 3: PHP authentication and branch authorization foundation

**Files:**
- Create: `staff-service/src/BranchAccess.php`
- Modify: `staff-service/src/App.php`
- Modify: `staff-service/src/Completion.php`
- Test: `staff-service/tests/completion.php`
- Test: `tests/staff/api/auth-boundaries.mjs`
- Test: `tests/staff/api/integration.mjs`

**Interfaces:**
- Consumes: schema and role mapping from Task 2.
- Produces: `currentBranchId(): ?int`, `requireCeo(): void`, `requireBranchMembership(int $branchId): void`, `branchPredicate(string $column): array{sql:string,params:array}`, `activeBranch(int $id): array`, and `assertSameBranch(array ...$records): void`.

- [ ] **Step 1: Write failing session and branch-boundary tests**

Cover CEO without a branch, Manager/staff with exactly one active branch, missing/inactive branch denial, retired-role login/session restoration denial, website Admin denial, cross-branch list/detail/search/count/export/download denial, and CEO global read behavior.

- [ ] **Step 2: Run API boundary tests and confirm failure**

Run: `node --test tests/staff/api/auth-boundaries.mjs`

Expected: FAIL because current service accepts ambiguous CEO/Manager helpers and does not scope operational queries by branch.

- [ ] **Step 3: Implement `BranchAccess` and canonical login enforcement**

Require the trait from `App.php`; reject `admin`, `hr_manager`, `branch_manager`, `assistant_manager`, and any non-CEO active user without a valid branch. Replace role-group shortcuts with permissions plus branch predicates. Keep Finance mutation restricted to `finance_manager` and website publishing absent from the staff service.

- [ ] **Step 4: Apply branch predicates to all read paths and private downloads**

Scope dashboard modules, lead/customer detail, task rosters, contracts, Finance reads, Marketing entries, Engineering deliverables, submissions, files, counts, searches, and exports. Validate related records share a branch before every mutation.

- [ ] **Step 5: Run PHP 8.4 syntax and focused API tests**

Run the configured PHP 8.4 executable (`STAFF_PHP`) with `-l` against `BranchAccess.php`, `App.php`, and `Completion.php`, then run the configured `auth-boundaries.mjs` and `integration.mjs` suites.

Expected: syntax clean and all branch/access assertions PASS.

- [ ] **Step 6: Commit**

```bash
git add staff-service/src staff-service/tests/completion.php tests/staff/api/auth-boundaries.mjs tests/staff/api/integration.mjs
git commit -m "feat: enforce CRM branch authorization server side"
```

### Task 4: CEO branch and staff assignment API

**Files:**
- Modify: `staff-service/src/App.php`
- Modify: `staff-service/src/BranchAccess.php`
- Modify: `apps/staff/src/api.ts`
- Test: `tests/staff/api/integration.mjs`
- Test: `tests/staff/api/concurrency.mjs`

**Interfaces:**
- Produces: `GET /staff-api/v1/branches`, `POST /branches`, `PATCH /branches/:id`, `POST /branches/:id/manager`, and `POST /staff/:id/branch`.
- API payloads: `BranchInput {code,name,address,phone,email,active,version?}`, `ManagerAssignmentInput {managerUserId,version}`, and `StaffBranchTransferInput {branchId,version,resolutionNote}`.

- [ ] **Step 1: Write failing CEO/Manager assignment tests**

Assert CEO-only branch creation; unique branch code; exactly one Manager per branch; one branch per Manager; ordinary staff one branch; CEO no branch; Manager cannot provision/transfer; CEO can create Manager and ordinary staff but not CEO/Admin; concurrent Manager assignment yields one winner and one `409`.

- [ ] **Step 2: Write failing transfer-conflict tests**

Assert transfers reject unresolved active tasks/leads/deals and return non-sensitive conflict counts. After explicit resolution, transfer updates membership, increments auth version, invalidates the old session, and records old/new branch plus reason in audit history.

- [ ] **Step 3: Run focused API and concurrency tests**

Run the configured `integration.mjs` and `concurrency.mjs` against the disposable V2 test database.

Expected: FAIL on missing routes.

- [ ] **Step 4: Implement the branch-management endpoints transactionally**

Use row locks and version checks. Never accept client-supplied branch ownership on operational records; derive it from the authenticated actor, assigned project, or selected staff member.

- [ ] **Step 5: Run focused suites**

Expected: all new assignment, concurrency, session invalidation, and audit assertions PASS.

- [ ] **Step 6: Commit**

```bash
git add staff-service/src/App.php staff-service/src/BranchAccess.php apps/staff/src/api.ts tests/staff/api/integration.mjs tests/staff/api/concurrency.mjs
git commit -m "feat: add CEO branch and staff assignment APIs"
```

### Task 5: Branch-scope workflow mutations and task lifecycle

**Files:**
- Modify: `staff-service/src/App.php`
- Modify: `staff-service/src/Completion.php`
- Modify: `packages/staff-contracts/types.ts`
- Test: `tests/staff/api/completion-http.mjs`
- Test: `tests/staff/api/concurrency.mjs`
- Test: `tests/staff/domain/master-workflow.test.mjs`

**Interfaces:**
- Consumes: `assertSameBranch` and `branchPredicate` from Task 3.
- Produces: branch-safe mutations for tasks, inventory, customers/leads/referrals, contracts, Finance, Marketing, Engineering, and submission reads.

- [ ] **Step 1: Add failing mutation-isolation tests**

For every root workflow, submit a same-branch success and a cross-branch identifier/payload attack returning `404` or `403` without record details. Include cross-branch referral denial and private file denial.

- [ ] **Step 2: Add failing task lifecycle tests**

Assert CEO assigns across branches; Manager assigns only within their branch; existing team leads assign only their own branch/team; staff progress their own tasks; assigner can review, reopen, or cancel; optimistic version checks prevent concurrent overwrite; every transition is audited.

- [ ] **Step 3: Run the focused suites and confirm failure**

Run: configured `completion-http.mjs`, `concurrency.mjs`, and `master-workflow.test.mjs`.

- [ ] **Step 4: Implement minimal branch-safe mutations and full task lifecycle**

Use derived branch IDs and server permissions. Add explicit task review/reopen/cancel routes or actions rather than broadening the assignee update endpoint.

- [ ] **Step 5: Run the focused suites**

Expected: all workflow isolation, task transition, audit, and concurrency assertions PASS.

- [ ] **Step 6: Commit**

```bash
git add staff-service/src packages/staff-contracts/types.ts tests/staff
git commit -m "feat: scope CRM workflows and tasks by branch"
```

### Task 6: CEO branch management workspace and canonical UI labels

**Files:**
- Create: `apps/staff/src/components/BranchManagementWorkspace.tsx`
- Modify: `apps/staff/src/main.tsx`
- Modify: `apps/staff/src/api.ts`
- Modify: `apps/staff/src/preview.ts`
- Modify: `apps/staff/src/i18n/en.json`
- Modify: `apps/staff/src/i18n/fa.json`
- Modify: `apps/staff/src/styles.css`
- Test: `tests/staff/domain/preview-client.test.mjs`
- Test: `tests/staff/browser/completion-ui.mjs`

**Interfaces:**
- Consumes: branch endpoints from Task 4 and canonical types from Task 1.
- Produces: CEO-only Branches navigation/workspace, visible branch context, Manager/staff assignment controls, and branch-safe preview fixtures.

- [ ] **Step 1: Write failing preview and browser tests**

Assert CEO sees all/selected branch context and branch management; Manager sees only their branch and no branch-management actions; staff display their assigned branch; legacy role labels/options are absent; missing branch gives a blocking access state; keyboard, loading, empty, error, and conflict states remain usable.

- [ ] **Step 2: Run tests and confirm failure**

Run: `node --test tests/staff/domain/preview-client.test.mjs` and configured Playwright `completion-ui.mjs`.

- [ ] **Step 3: Implement the branch workspace and navigation context**

Keep shared teal tokens and existing shell patterns. Use translated visible labels, 44px targets, accessible dialogs, status text in addition to color, and table overflow containment.

- [ ] **Step 4: Run TypeScript and browser tests**

Run: `npm --prefix apps/staff run typecheck`, `npm --prefix apps/staff test`, three fresh `node scripts/build-staff.mjs --role <callcenter|management|dashboard> --out <new-temp-directory>` builds, and the configured Playwright completion UI suite at 375, 768, 1024, and 1440 widths in English and Dari/RTL.

Expected: clean typecheck; domain and browser assertions PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/staff tests/staff/domain/preview-client.test.mjs tests/staff/browser/completion-ui.mjs
git commit -m "feat: add CEO branch management workspace"
```

### Task 7: Documentation, packaging, and full verification

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/superpowers/plans/2026-11-11-master-dashboard-implementation.md`
- Modify: `docs/management-dashboard-requirements.md`
- Modify: `docs/staff/departments-and-roles.md`
- Modify: `docs/staff/current-implementation.md`
- Modify: `docs/staff/dashboard-completion-delivery.md`
- Modify: `docs/staff/shared-dashboard-design.md`
- Modify: `scripts/package-dashboard-completion.mjs`
- Modify: `tests/staff/packaging/isolation.test.mjs`
- Modify: `tests/staff/packaging/v2-kit.mjs`

**Interfaces:**
- Consumes: completed role/branch implementation.
- Produces: authoritative documentation and a manually deployable package layout without claiming installation.

- [ ] **Step 1: Add failing packaging assertions**

Assert fresh SQL contains canonical roles/branch structures, no default accounts or projects, no active legacy roles, no internal Admin grants, private materials remain outside webroot, and the owner checklist requires explicit branch/Manager assignment.

- [ ] **Step 2: Update authoritative documentation**

Replace “Admin (CEO)” with internal CEO, replace HR Manager with branch Manager, remove Branch/Assistant Manager role types, document CEO read-only submissions, and distinguish local validation from owner deployment. Preserve V2/V1 and manual cPanel/phpMyAdmin boundaries.

- [ ] **Step 3: Run complete local verification**

Run:

```bash
npm --prefix apps/staff test
npm --prefix apps/staff run typecheck
node --test tests/staff/domain/*.test.mjs
node --test tests/staff/packaging/*.test.mjs
node scripts/build-staff.mjs --role callcenter --out <new-callcenter-temp-directory>
node scripts/build-staff.mjs --role management --out <new-management-temp-directory>
node scripts/build-staff.mjs --role dashboard --out <new-dashboard-temp-directory>
"$STAFF_PHP" -l staff-service/src/App.php
"$STAFF_PHP" -l staff-service/src/Completion.php
"$STAFF_PHP" -l staff-service/src/BranchAccess.php
git diff --check
```

Then run configured disposable-MySQL API/concurrency suites and browser workflows. Do not substitute domain tests for API or browser evidence.

- [ ] **Step 4: Run source audit and prepare a new staging directory only after all gates pass**

Run: `node scripts/package-dashboard-completion.mjs --audit-source`, then `node scripts/package-dashboard-completion.mjs <new-release-directory>` with required public Firebase configuration.

Expected: all checks pass; package contains separate website/private/database materials; build status keeps upload/import/server flags false.

- [ ] **Step 5: Record evidence and remaining owner-run checks**

Update the master execution ledger with exact commands/results and explicitly state that testing-server import, upload, authentication, database isolation, and smoke checks remain unverified until the owner performs them.

- [ ] **Step 6: Commit**

```bash
git add AGENTS.md docs scripts/package-dashboard-completion.mjs tests/staff/packaging
git commit -m "docs: align V2 delivery with CEO branch role model"
```

## Self-Review

- Spec coverage: canonical role codes, internal Admin removal, branch creation/assignment, one Manager/branch, one branch/staff, cross-branch enforcement, compatibility migration, CEO read-only submissions, and deployment boundaries each map to a task.
- Type consistency: `Branch`, `BranchInput`, `ManagerAssignmentInput`, and `StaffBranchTransferInput` are defined before API/UI consumption.
- Review focus: each listed failure mode has an explicit schema, API, concurrency, or packaging test.
- Proportion: tasks specify contracts and observable assertions without embedding implementation bodies.
