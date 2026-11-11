# Modular Firebase call-center verification

## Scope and files

Recovered clean committed staff UI/service sources into this writable checkout from `feature/callcenter-dashboard` (`2de491a`), then adapted them for Firebase and modular storage. No merge, commit, push, deployment, live V1 writes, provider call, or real customer data operation.

- `apps/staff/`: call-center and management builds, email/password Firebase REST client, password reset, exact-UID agent provisioning form, EN/FA/RTL, repaired damaged inherited Dari translations.
- `packages/staff-contracts/`: shared workflow/types, all known role codes.
- `staff-service/src/`: private PHP service, JWT RS256/project/time validation and Google account-state lookup, secure sessions/CSRF, live MySQL permission checks, scoped roster, transactional/idempotent call-center operations.
- `staff-service/database/001-core.sql`: 12 shared tables for identities, departments/roles/permissions, branches, tasks, audit, retries, and module versions.
- `staff-service/database/010-callcenter.sql`: 8 owned `cc_` tables for counters, contacts, leads, follow-ups, activities, closure records, calls, and a reserved provider inbox. No automatic ingestion route is enabled.
- `public/staff-api/`, `deployment/staff/`, build/package scripts: isolated entrypoint, noindex/routing/CSP, allowlisted private packaging, manual phpMyAdmin/Firebase setup instructions.
- `tests/staff/`, `staff-service/tests/`: fictional local workflow, identity, permissions, packaging, browser, and concurrency checks.

## Decisions

Ruling: recover only clean committed new staff paths into the authorized writable checkout rather than editing the old worktree outside writable roots. Unrelated files remain intact; changes are uncommitted here.

Ruling: Firebase owns passwords; PHP exchanges a verified token for the existing private session. No new SDK dependency, local password fallback, browser token persistence, or automatic role assignment. Sessions require another sign-in at ID-token expiry; this costs an extra sign-in roughly hourly. Firebase signatures and account status are validated through fixed Google HTTPS endpoints; live account-state rechecks occur every five minutes while MySQL account/permission checks occur each request.

Ruling: one assigned role per user for this increment, using extensible role rows rather than an enum. Multiple-role assignment is not implemented. Future departments have registered roles but no workflow/UI or implicit call-center permissions. Management task recipients are limited to current operational roles until future dashboards ship.

Ruling: `cc_leads.current_task_id` is maintained transactionally by the service rather than a cyclic foreign key requiring a table alteration. All other declared relationships use foreign keys. Manual database edits must respect this pointer; future modules must not write call-center records directly.

## Observed checks

- Recovered baseline: 9 Node tests and 13 PHP domain assertions passed.
- New schema: imported both SQL scripts into a newly generated fictional database on loopback MariaDB port 3397. Added a simulated future module; prior table definitions/data were unchanged, with only a new registry row added.
- 45 real local PHP/MariaDB API assertions: idempotent retries, customer creation, both handoff directions, sales-only closure, My Tasks, denied customer/finance access, restricted assignee roster, rejected customer task target, failed-login clearing, deactivation/session checks.
- Firebase verifier: 14 PHP assertions cover valid signatures, tampering, wrong project/issuer, expiry, future timestamps, malformed/unsigned tokens, UID mismatch, disabled/revoked account, and provider failure.
- Three auth-boundary tests: failed sign-in clears the prior identity; ended-session POST is 401; revoked MySQL permissions take effect on active Firebase sessions.
- 19 Node checks passed across domain/schema, packaging boundaries, and live-session authorization. These cover timing, roles, UTF-8 Dari, add-only SQL, public isolation, noindex, Firebase CSP, and permission revocation.
- Two-connection transaction races: deactivation blocks assignment; committed assignment blocks deactivation. The new permission query exposed an InnoDB snapshot regression; current assignment checks now use locking reads. Regression passed after the fix.
- Browser preview passed customer/follow-up/management/mobile/RTL workflows. Real PHP/MariaDB browser workflow and network-failure retry passed with signed fictional identities.
- A delayed-roster browser regression reproduced an initially empty required assignee field when New entry opened immediately after login. Self-assignment is now available directly from the authenticated session while the roster loads; delayed loading and failed-save retry both pass.
- Built package login and password reset passed under the exact packaged CSP header using a local static/proxy test server and mocked Google responses. No real Google account was used. Apache behavior itself still requires hosting verification.
- Private configuration packaging regression passed: only allowlisted service files are copied; SQL/setup/settings are outside webroot, no obsolete password schema or sales build is packaged.
- Staff/public TypeScript checks and role production builds passed. PHP syntax checks are run across service sources. Public/admin source and existing API files remain unchanged.

Tests are stored in `tests/staff/` and `staff-service/tests/`. PHP local commands use portable PHP with PDO MySQL/OpenSSL/cURL extensions; browser commands use `PLAYWRIGHT_MODULE` pointing to an installed Playwright `index.mjs`. Auth-boundary/concurrency tests also require `STAFF_PHP`. All identity transport overrides are test-only, loopback-restricted, and excluded from packages. No test bypass is reachable through the production configuration.

## Review and fixes

Independent review identified the CSP blocking Google requests, failed sign-in retaining a previous identity, and overbroad shared-user roster/task recipients. Regression tests failed before fixes and passed after fixes. Additional fixes cover expired-session POST handling, logout error reporting, permission enforcement, complete role typing, and damaged inherited Dari. No review findings are intentionally deferred; the rollout dependencies below are not completion claims.

## Remaining rollout dependencies

Owner-supplied Firebase project and public Web API key are configured in ignored staff-local settings. Owner must enable Email/Password, authorize the testing domain, create Firebase accounts, and supply exact CEO UID/email for the owner SQL template. Live Google sign-in and reset delivery have not been tested. Do not infer these settings from the project identifiers alone.

Manual package upload/import, private config/session placement, host PHP extensions/CA trust/environment configuration, Apache headers/deep routes, and public website regression checks on the testing host remain unverified. Privileged MFA and operational retention/backup policies remain rollout work. Sales/other department dashboards and automatic Etisalat capture are deferred. Existing website-admin login has not been migrated to Firebase in this call-center increment.

The fresh schema is not a migration for a populated earlier experimental staff database. Never replace existing V2 data with these scripts. Keep SQL/private setup/config outside every webroot.

## Final testing artifact

`releases/callcenter-v2-firebase-manual-staging-20261110-final/` contains the manual package. Upload only `webroot/` contents. Read its README; import core then call-center SQL into a NEW EMPTY V2 database, and fill the CEO UID/email in the private owner template. Earlier verification builds/packages are historical and should not be uploaded.

Final artifact validation: both role builds and staff/public TypeScript checks passed; all manifest file hashes matched, with private materials outside webroot. Final production-CSP login/reset, delayed-roster retry, and real browser/PHP workflow passed. Earlier dev-browser timing failures were reproduced as the empty-assignee race and fixed with a delayed-roster regression. Test user deactivation is restored during teardown so repeated API runs preserve fictional fixture usability.
