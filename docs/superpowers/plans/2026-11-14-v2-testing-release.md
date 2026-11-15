# V2 Testing Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a clean, manually deployable V2 testing release for `https://website.attaieproperties.com`, with every dashboard role mapped privately to the `MAIN` branch and verified against the Alabaster Split-Rail standard.

**Architecture:** Keep deployment cleanup isolated to a newly generated `releases/manual-staging-dashboard-completion-*` directory. Extend the existing package script with a validated, private identity-map input that emits branch and staff bootstrap SQL into the private archive only. Verify dashboard routing, role authorization, and responsive UI with the existing fixtures plus release-specific artifact checks.

**Tech Stack:** Node.js ESM scripts, Vite/React/TypeScript, PHP 8.4/MySQL fixture tests, Playwright, existing V2 manual-staging archive tooling.

**Spec:** `docs/superpowers/specs/2026-11-14-v2-testing-release-design.md`

## Execution progress — 2026-11-14

Completed:

- [x] Added a private role-map generator that validates all 12 canonical roles, `MAIN` branch ownership, unique Firebase identities, Manager assignment, and Sales Leader reporting.
- [x] Added the package gate for a private absolute role-map JSON path and generated the mapping SQL outside public output.
- [x] Verified the Alabaster shell for all 12 roles at 375px and 1440px, and corrected the mobile navigation target from 40px to the required 44px.
- [x] Added an Admin-local React 18-compatible `lucide-react` dependency and resolved the Staff Vite TypeScript 6 plugin-type recursion.
- [x] Built a fresh local testing release. It contains all 10 dashboard entry points and has no mapped Firebase identity values in public output.
- [x] Added a regression test and updated the ZIP builder so the private archive includes `database/04-firebase-role-mapping.sql`, while the public archive contains zero SQL files.
- [x] Rebuilt and audited the manual-staging release after the archive fix. The generated `BUILD-STATUS.json` still records all hosted-state flags as `false`.

Pending implementation:

- [ ] Run fresh-schema and publication PHP fixtures when the disposable MySQL service at `127.0.0.1:3397` is available.
- [ ] Perform the owner-managed cPanel upload, three-database import, Firebase sign-in, and hosted role/RTL/responsive checks. `BUILD-STATUS.json` remains false for all hosted-state flags until then.

## Global Constraints

- Target only `https://website.attaieproperties.com`; never alter V1 hosting, `attaieproperties.com`, or V1 databases.
- Release cleanup excludes stale files from generated staging output only. Do not delete repository source, history, or user-owned changes.
- Use the Firebase public Web API key only through the build environment.
- Keep Firebase UIDs, emails, generated role SQL, database inputs, and private PHP configuration outside the public upload archive and Git.
- The exact supplied non-CEO accounts are all active members of `MAIN`; supplied Manager owns `MAIN`; supplied Sales Agent reports to supplied Sales Leader.
- Preserve empty project and unit catalogs and all reusable explorer/workflow code.
- Preserve existing `sales-android/app/src/main/java/af/attaieproperties/sales/MainActivity.kt` and `.agents/skills/startup/` working-tree changes.

## Review Focus

- An identity-map file with a duplicate Firebase UID or email must fail before a release directory is created; test in Task 1.
- A missing, retired, or CEO branch assignment must fail rather than emitting unsafe bootstrap SQL; test in Task 1.
- Generated identity SQL must be in the private archive and absent from the public ZIP; test in Task 2.
- Every role entry URL must resolve to its expected dashboard shell without preview content; test at 375px and desktop in Task 3.
- A stale or unreferenced artifact must be absent from the staged public upload; test manifest and ZIP contents in Task 4.

---

## File structure

- Create `scripts/create-testing-role-mapping.mjs`: validates a private JSON input and writes deterministic fresh-V2 bootstrap SQL.
- Create `tests/staff/packaging/testing-role-mapping.test.mjs`: verifies mapper validation and generated SQL safety rules.
- Modify `scripts/package-dashboard-completion.mjs`: accepts a private mapping file, copies generated SQL only into the private archive, and asserts release separation.
- Modify `tests/staff/packaging/deployment-readiness.test.mjs`: verifies mapping-file gates and private/public archive boundaries.
- Create `tests/staff/browser/dashboard-release-responsive.mjs`: exercises role entry URLs and Alabaster shell at mobile and desktop widths against a locally built release.
- Modify `docs/staff/dashboard-completion-delivery.md`: documents the new private identity-map input and import order.

### Task 1: Private identity-map generator

**Files:**
- Create: `scripts/create-testing-role-mapping.mjs`
- Test: `tests/staff/packaging/testing-role-mapping.test.mjs`

**Interfaces:**
- Consumes: a JSON file passed as `node scripts/create-testing-role-mapping.mjs <inputPath> <outputPath>`.
- Produces: a UTF-8 SQL file that inserts one CEO, `MAIN` branch, the branch Manager, remaining active roles, manager assignment, and Sales Agent team-leader relationship.

- [ ] **Step 1: Write failing mapper tests**

Cover a complete fictional twelve-role map, duplicate email/UID rejection, a CEO carrying `branchCode`, an unknown role, missing Manager, and missing Sales Leader.

- [ ] **Step 2: Run mapper tests to verify failure**

Run: `node --test tests/staff/packaging/testing-role-mapping.test.mjs`

Expected: FAIL because the mapper does not exist.

- [ ] **Step 3: Implement `create-testing-role-mapping.mjs`**

Validate `branch.code === 'MAIN'`, all `ACTIVE_INTERNAL_ROLES` appear exactly once, CEO has no branch, all non-CEOs use `MAIN`, Manager and Sales Leader references resolve, and each Firebase UID/email is unique. Escape SQL string values. Emit a transaction using `core_users`, `core_branches`, `core_branch_managers`, and `team_leader_id`; output only SQL and no credential data to stdout.

- [ ] **Step 4: Run mapper tests to verify success**

Run: `node --test tests/staff/packaging/testing-role-mapping.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/create-testing-role-mapping.mjs tests/staff/packaging/testing-role-mapping.test.mjs
git commit -m "feat: generate private V2 testing role mapping"
```

### Task 2: Package private bootstrap material

**Files:**
- Modify: `scripts/package-dashboard-completion.mjs:27-156`
- Modify: `tests/staff/packaging/deployment-readiness.test.mjs`
- Modify: `docs/staff/dashboard-completion-delivery.md`

**Interfaces:**
- Consumes: `V2_TESTING_ROLE_MAP_FILE`, an absolute path to the private identity-map JSON.
- Produces: `database/04-firebase-role-mapping.sql` only inside `UPLOAD-PRIVATE-OUTSIDE-WEBROOT.zip`.

- [ ] **Step 1: Extend readiness tests before package changes**

Assert that production packaging rejects a missing map path, rejects a path outside a readable JSON file, invokes `create-testing-role-mapping.mjs`, and bans `04-firebase-role-mapping.sql` from `UPLOAD-WEBSITE-CONTENTS.zip`.

- [ ] **Step 2: Run readiness tests to verify failure**

Run: `node --test tests/staff/packaging/deployment-readiness.test.mjs`

Expected: FAIL on the new mapping requirements.

- [ ] **Step 3: Update `package-dashboard-completion.mjs`**

After the existing Firebase key check and before creating `output`, validate `V2_TESTING_ROLE_MAP_FILE`, invoke the mapper to `database/04-firebase-role-mapping.sql`, add a private-guide import step after `02-internal-crm.sql`, and include this file in the private ZIP. Extend the public-output scan to fail if the mapping filename, any mapped Firebase UID, or its JSON source enters `dist`.

- [ ] **Step 4: Update manual deployment instructions**

State that the mapping SQL is imported only into the empty Internal CRM database after fresh schema import. State that it must never be uploaded into the public document root or run against V1.

- [ ] **Step 5: Run package readiness tests**

Run: `node --test tests/staff/packaging/deployment-readiness.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/package-dashboard-completion.mjs tests/staff/packaging/deployment-readiness.test.mjs docs/staff/dashboard-completion-delivery.md
git commit -m "feat: include private V2 role bootstrap in staging releases"
```

### Task 3: Dashboard shell and responsive release verification

**Files:**
- Create: `tests/staff/browser/dashboard-release-responsive.mjs`
- Modify: `apps/staff/src/styles.css` only if the browser check identifies a concrete Alabaster or responsive defect.
- Modify: `admin-panel/src/components/Layout.tsx` only if the browser check identifies a concrete Admin shell defect.

**Interfaces:**
- Consumes: a local production staging build served over HTTP and each role path: `/admin/`, `/dashboard/`, `/management/`, `/callcenter/`, `/ceo/`, `/sales-leader/`, `/sales/`, `/finance/`, `/marketing/`, `/engineering/`.
- Produces: deterministic Playwright assertions for no horizontal page overflow, visible mobile navigation trigger, desktop pillar rail, contextual drawer, breadcrumb topbar, and absence of preview-only copy.

- [ ] **Step 1: Write failing release-shell browser test**

At `375x812` assert `scrollWidth <= innerWidth`, a labeled navigation trigger exists, and focusable rail controls meet 44px minimum touch size. At `1440x900` assert the pillar rail, `All Modules`, and breadcrumb shell are visible. Exercise every listed entry URL.

- [ ] **Step 2: Run the test against the current local release server**

Run: `node tests/staff/browser/dashboard-release-responsive.mjs`

Expected: FAIL until its server setup and any concrete remediation are present.

- [ ] **Step 3: Make only test-proven UI corrections**

Use Alabaster tokens: canvas `#F7F8FA`, surfaces `#FFFFFF`, rail `#FBFBFD`, active/CTA `#0F172A`, hover `#F1F5F9`, borders `#E2E8F0`, muted text `#64748B`. Preserve keyboard focus, RTL, and reduced-motion behavior.

- [ ] **Step 4: Run responsive and existing role checks**

Run:
```bash
node tests/staff/browser/dashboard-release-responsive.mjs
node tests/staff/browser/branch-onboarding.mjs
node tests/staff/browser/inventory-authority.mjs
node tests/staff/browser/lead-property-entry.mjs
node tests/staff/browser/marketing-branch.mjs
node tests/staff/api/role-matrix.mjs
node tests/staff/api/branch-readiness.mjs
node tests/staff/api/staff-work-lifecycle.mjs
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add tests/staff/browser/dashboard-release-responsive.mjs apps/staff/src/styles.css admin-panel/src/components/Layout.tsx
git commit -m "test: verify unified dashboard release shells"
```

### Task 4: Build, audit, and prepare manual staging output

**Files:**
- Create: a temporary, Git-ignored identity-map JSON under `releases/` from the supplied account data.
- Create: `releases/manual-staging-dashboard-completion-YYYYMMDD/` through the package script.
- Test: `tests/staff/packaging/fresh-release.php`

**Interfaces:**
- Consumes: `VITE_STAFF_FIREBASE_API_KEY`, `V2_TESTING_ROLE_MAP_FILE`, and optional `VITE_GOOGLE_MAPS_API_KEY`.
- Produces: upload and private archives, manifest, checksums, and `BUILD-STATUS.json` with all hosted-state flags false.

- [ ] **Step 1: Run pre-package checks**

Run:
```bash
npm.cmd --prefix apps/staff run typecheck
npm.cmd --prefix apps/staff test
node scripts/package-dashboard-completion.mjs --audit-source
```

Expected: all pass.

- [ ] **Step 2: Create the local private mapping JSON**

Use the supplied Firebase identities with no password fields. Keep it under ignored `releases/`, use branch `MAIN`, and do not print identity values in command output.

- [ ] **Step 3: Create a new staging release**

Run the package script with the Firebase public API key and private map path set only for the process. Leave Maps configuration empty; map-dependent functionality must degrade without blocking release creation.

- [ ] **Step 4: Verify generated release boundaries**

Run:
```bash
node --test tests/staff/packaging/deployment-readiness.test.mjs
$env:STAFF_LOCAL_TEST='1'
& 'releases/validation/php/php.exe' -d extension_dir=releases/validation/php/ext -d extension=pdo_mysql -d extension=fileinfo staff-service/tests/publication-revisions.php
$env:STAFF_LOCAL_TEST='1'
& 'releases/validation/php/php.exe' -d extension_dir=releases/validation/php/ext -d extension=pdo_mysql -d extension=fileinfo tests/staff/packaging/fresh-release.php <release-path>
```

Expected: audit and archive checks pass; PHP fixture runs only when its disposable MySQL service is available at `127.0.0.1:3397`.

- [ ] **Step 5: Inspect release manifest and status**

Verify public archive has no SQL, private config, UIDs, role-map JSON, or key material. Verify private archive contains `database/04-firebase-role-mapping.sql`. Verify `BUILD-STATUS.json` has `serverUploaded`, `databaseImported`, and `serverVerified` all false.

- [ ] **Step 6: Commit source-only changes**

```bash
git add scripts tests docs apps admin-panel
git commit -m "chore: prepare V2 testing deployment release"
```

Do not add `releases/`, generated archives, private mapping JSON, or user-owned working changes.

## Self-review

The plan covers staging-only cleanup, private role setup, dashboard consistency, responsive verification, public/private archive boundaries, empty-catalog preservation, and manual testing deployment. It does not authorize hosting upload or database import. Identity mapping is isolated to ignored input and private archive output. The five high-risk failure modes in Review Focus each have a named test task.
