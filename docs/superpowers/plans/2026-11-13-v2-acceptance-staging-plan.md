# V2 Acceptance and Manual Staging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce current local workflow/permission evidence and a fresh manual testing package, leaving hosted verification explicitly pending until observed.

**Architecture:** Integrate the three product plans through isolated fictional fixtures, a role/route acceptance matrix, and the existing rebuild-based packager. Keep local results distinct from owner-run import/upload/live Firebase and server checks.

**Tech Stack:** node:test/Playwright, existing PHP/MySQL fixture harnesses, Vite/typechecks, current ZIP packaging scripts, manual cPanel/phpMyAdmin.

**Spec:** `docs/superpowers/specs/2026-11-13-v2-website-crm-boundaries-design.md`

## Global Constraints

- Apply every constraint in `2026-11-13-v2-readiness-index.md`.
- Execute after the inquiry, lead uniqueness, and publication plans pass their own checks.
- Test databases are isolated and fictional. Verify the database target before any operation.
- Real passwords, private keys, Firebase credentials/account mappings, SQL, and setup materials stay outside uploadable files.
- Firebase public web configuration is a build prerequisite, not proof of live login.
- Hosted upload/import/server verification flags stay false until actual owner/server observations exist.
- Call routing stays in CTC PHP configuration. Test packages keep chargeable calls disabled; do not trigger real provider calls as a test shortcut.

## Review Focus

- Newly added/custom roles cannot disappear from permission acceptance (Task 1).
- Website Admin cookies and Firebase staff sessions cannot cross-authorize APIs (Task 1).
- Build outputs cannot accidentally package old project data or omit chat/hidden routing files (Task 2).
- Upgrade schema composition cannot silently reapply destructive or fresh-only imports (Task 2).
- Local/mock checks cannot be reported as live deployment or real Firebase/call-provider evidence (Tasks 2/3).

## Task 1: Complete role and workflow acceptance matrix

**Files:** Create `tests/staff/api/role-matrix.mjs`, `tests/staff/fixtures/role-route-matrix.json`, `tests/website/integrated-workflow.mjs`; modify `staff-service/tests/completion-database.php` and `tests/staff/api/completion-http.mjs` as needed for fixtures; create `docs/staff/v2-revised-workflow-acceptance.md`.

**Interfaces:** Matrix entries are `{role,route,method,recordScope,expectedStatus,expectedEffect}`. `recordScope` is `own | shared | foreign | public | none`. The test enumerates configured staff roles and fails if any lacks explicit allowed/denied coverage. Matrix decisions come from current authorized grants and owner-approved boundaries, not from granting permissions to make tests pass. Website Admin and anonymous cases are separate from staff role codes.

- [ ] Add an executable coverage assertion that fails when a fixture role is missing from the route matrix. Include staff role `admin` separately from website Admin, inactive users, foreign-record access, permission revocation, CSRF, and anonymous attempts. Each active staff role gets representative permitted behavior and a denied protected action/scope; no deny case should imply arbitrary business permission changes.
- [ ] Run `node tests/staff/api/role-matrix.mjs`; confirm uncovered roles produce a failure before completing the fixture/matrix.
- [ ] Populate explicit fixtures/matrix from current role migration/core grants. Use permitted dashboard/read behavior where a role has no authorized write. Verify direct API calls and actual record effects, not just hidden buttons. Test website Admin cannot read staff leads/inventory and staff sessions cannot manage website inquiries/publication.
- [ ] Add integrated browser flow in separate customer/Editor/website Admin/Callcenter/Sales contexts: create fictional internal inventory; complete editing; submit five photos; reject/correct/resubmit; approve/publish; verify public listing; submit offline inquiry and recover receipt; website Admin records follow-up; confirm no CRM inquiry creation; then record a real fixture call and enforce same-pair/different-property lead rules.
- [ ] Run role matrix, integrated workflow, and affected existing HTTP/browser suites. In the acceptance document record command/exit status/assertion counts, EN/FA/RTL, keyboard, receipt download/print/scan, responsive widths 375/768/1024/1440, and remaining hosted checks. Remove only fictional fixtures from disposable test databases; release catalogs remain empty.
- [ ] Commit with `test: cover revised v2 role and workflow boundaries`.

## Task 2: Fresh package and schema delivery audit

**Files:** Modify `scripts/package-dashboard-completion.mjs`, `scripts/zip-v2-release.py` only if necessary, `tests/staff/packaging/completion-schema.test.mjs`, `tests/staff/packaging/isolation.test.mjs`, and `docs/staff/dashboard-completion-delivery.md`; create `tests/staff/packaging/revised-workflow.test.mjs`.

**Interfaces:** Existing `node scripts/package-dashboard-completion.mjs --audit-source` remains read-only. Normal packaging writes a new `releases/manual-staging-dashboard-completion-*` directory. Missing `VITE_STAFF_FIREBASE_API_KEY` must fail before generating an uploadable package. `BUILD-STATUS.json` distinguishes local checks from false hosted upload/import/server fields.

- [ ] Add executable packaging tests: missing Firebase public key fails without an upload ZIP; five surfaces are fresh; no project/unit seed records or retired artwork; website chat endpoint included and unrelated AI chat blocked; `.htaccess`/`.user.ini` present; private chat/config outside all document roots; no secrets/private account mappings in upload archives; status flags remain false after successful local tests.
- [ ] Test schema composition with fresh fictional databases and additive upgrade fixtures: website schema includes inquiry receipts/follow-up, internal includes lead claims and revisioned outbox, third includes publication revisions/assets. Existing V2 rows/uploads/private configuration survive upgrade. Require preflight resolution before claim activation on ambiguous historical data. Inspect both ZIP contents and extracted trees.
- [ ] Run `node --test tests/staff/packaging/revised-workflow.test.mjs`; confirm the current permissive Firebase build/blocked chat behavior fails the new requirements.
- [ ] Update packager to compose each database's correct files once, include public chat and new PHP helpers, configure a private chat directory, and preserve routing/privacy rules. Remove only the direct-chat blocking rule; keep unrelated AI chat blocked. Require Firebase public configuration for an upload package while allowing the source-only audit without credentials.
- [ ] Update manual instructions for fresh versus existing databases, `SELECT DATABASE()` target checks, backed-up upgrades, read-only duplicate preflight, private chat data copy/verification, exact UID mappings, Editor test account, separate website Admin, permissions, receipt testing, and rollback. No automated installer, Terminal requirement, fixed passwords, or real credentials in templates.
- [ ] Run `node scripts/package-dashboard-completion.mjs --audit-source`, `npm.cmd run lint`, `npm.cmd run build:admin`, `npm.cmd --prefix apps/staff run typecheck`, `npm.cmd --prefix apps/staff test`, and the affected packaging/HTTP/browser tests. Run normal packaging only with explicitly supplied public build configuration, without reading `.env.local`; inspect the resulting manifests/archives. Root `npm run build` alone is not deployment evidence and is not needed to obtain an upload tree.
- [ ] Commit source/docs/tests with `build: package revised v2 workflows for manual staging`. Keep generated/private release artifacts out of the source commit unless the repository's artifact policy explicitly includes a safe manifest.

## Task 3: Owner-run hosted acceptance and evidence handoff

**Files:** Complete `docs/staff/v2-revised-workflow-acceptance.md` and the release-specific external handoff checklist. No new hosted installer or automatic database migration.

**Interfaces:** Checklist entries contain `{check,environment,observedAt,result,evidence}`. Results distinguish `passed | failed | not_run`; simulated provider/Firebase tests are labeled simulated. No credentials or customer data appear in evidence.

- [ ] Before external operations, verify the intended testing origin, distinct V2 database names/users, document root, private directory, and current installation state. Fresh SQL is only for new empty V2 databases. For populated targets inspect versions and back up records/uploads/configuration before authorized additive imports.
- [ ] Hand the owner the exact new upload ZIP contents, private ZIP outside all roots, three separate SQL targets/upgrade guidance, and concise cPanel/phpMyAdmin steps. Explain required hidden files and private paths. Leave V1 entirely outside the instructions.
- [ ] After the owner confirms upload/import, observe or collect concrete hosted results: real Firebase sign-in/session expiry and UID mappings; separate website Admin auth; Apache/deep routes/PHP extensions; private file protection; all configured role checks; Editor review/publication; public inquiry offline recovery/barcode receipt; Admin follow-up/chat; lead uniqueness. Add hosted custom roles to the matrix before acceptance.
- [ ] Record real outcomes without converting not-run checks into passes. If no host access/evidence exists, report locally verified package with hosted checks pending. Keep CTC disabled until separately authorized provider testing; document its PHP routing configuration and simulation results without claiming a live call succeeded.
- [ ] Publish the final handoff with changed-file summary, local evidence, package identity, hosted outcomes, and explicit remaining uncertainty. Commit safe acceptance documentation only after evidence is recorded; no private setup or login details enter git.

## Completion criteria

Source implementation, local acceptance, package preparation, owner upload/import, and hosted verification are distinct milestones. Final testing readiness requires the hosted checklist to pass; a local package can be delivered while those hosted checks remain explicitly pending.
