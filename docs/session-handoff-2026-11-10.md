# Session Handoff — 2026-11-10

## Resume here

2026-11-11 resumed session: latest full V2 manual testing kit is `releases/v2-complete-test-20261111-resumed/`. Both public/private upload ZIPs are prepared. Fresh checks: 18 staff tests, 26 packaged local checks including SQL/admin login/session isolation, 49 PHP syntax checks, manifest and archive byte comparisons. See `docs/staff/v2-kit-verification-2026-11-11.md`. Earlier `v2-complete-test-20261111` failed integrity checks and must not be used. No deployment occurred. Next owner action: follow the new kit's `START-HERE.md`, provision Firebase CEO UID and verify hosting. Explorer calibration/provider integration remain unfinished.

Implementation resumed with owner approval: Firebase authentication, shared V2 core, and prefixed call-center SQL are now in this original checkout. See `docs/staff/current-implementation.md`, `docs/staff/modular-firebase-verification.md`, and `deployment/staff/README.md`. Do not restart from the old staff worktree or import the obsolete password-based initial schema. The Firebase project is configured locally with owner-supplied public identifiers; CEO Firebase UID/email provisioning and live hosting checks remain pending. No deployment occurred.

Latest owner scope update: see [V2 departments and roles](staff/departments-and-roles.md) for the eight future dashboard groups and their roles. Record these for later implementation; do not implement all dashboards now. Current repository AGENTS.md removes the historical V2 source/API/database freeze and permits authorized V2 changes using its separate testing resources.

The owner requested plans and later authorized implementation, excluding the sales dashboard. A locally verified manual-entry call center/management core now exists on `feature/callcenter-dashboard` in `C:/Users/RoheenAhmadi/.codex/worktrees/f277/WebsiteVersion2`. Read `docs/staff/current-implementation.md` in this original checkout for the current handoff. Do not claim automatic Etisalat capture, completed production hardening, or deployment.

Primary files:

- Requirements: [Call center dashboard specification](superpowers/specs/2026-11-10-call-center-dashboard-design.md).
- Complete proposed implementation: [Staff dashboards plan](superpowers/plans/2026-11-10-staff-dashboards-implementation.md).
- Separate earlier review/remediation plan: [Visual explorer stabilization](superpowers/plans/2026-11-10-visual-explorer-stabilization.md).

This file was initially created for “save the session” and updated to point to later implementation. It is a handoff, not an application/session backup. Current code/worktree and verification details are in the linked implementation note.

## End-of-day update — resume tomorrow

Owner explicitly requested saving and continuing tomorrow. Stop implementation work after saving this handoff.

### Current implementation

- Implementation commit: `2de491a`, branch `feature/callcenter-dashboard`, managed worktree `C:/Users/RoheenAhmadi/.codex/worktrees/f277/WebsiteVersion2`.
- Original checkout remains on master. Do not assume implementation files are present there; do not overwrite its unrelated local edits or restored artwork.
- Implemented manual-entry core: call center overview/follow-ups/customers/leads/My Tasks, management task assignment and agent creation, shared staff UI, EN/FA/RTL, independent PHP/MySQL staff service and authentication. Automatic customer creation occurs when an agent submits a lead.
- Sales dashboard is explicitly excluded. Sales handoff/return/closure backend was tested through API only. Only sales agents may close a deal; call center can read closure details.
- Verified: 9 Node tests, 13 PHP assertions, 34 real local PHP/MariaDB API assertions, two-connection assignment/deactivation races, three browser workflows, role builds/typechecks/PHP syntax, private-config packaging regression, and isolated six-table backup/restore. See worktree `docs/staff/implementation-verification.md`.
- Independent reviewer findings were corrected with regression coverage: private config packaging, draft phone/time drift after a failed save, recipient deactivation races, and task-status idempotency lost on retry.
- Manual testing package successfully exists at worktree `releases/callcenter-manual-staging-20261110-final/`. Only `webroot/` contents are public upload files. Private application, configuration, sessions, SQL, and `private-setup/ADMIN-LOGIN-PRIVATE.txt` stay outside every webroot. Never print the generated password in conversation.
- No merge, push, deployment, live call or production database operation occurred. Existing frozen V1 endpoints, public source, admin, root routing and SEO PHP remain unchanged.

### Latest CPaaS evidence — key next step

User supplied `C:/Users/RoheenAhmadi/Downloads/Cpaas - for your Technological Dreams.html`. Its saved companion folder was inspected read-only. Review: `docs/staff/cpaas-page-review-2026-11-10.md` (also copied into the implementation worktree).

- CTC configuration code contains **Click To Call Pingback** with `Call_End` and authentication/method/content-type/retry/timeout/TLS-verification controls. Static defaults are not proof of current account configuration.
- Saved incoming CTC report UI includes `CALLID`, `MSISDN`, `CLI`, `ENTRY_TIME`, `END_TIME`, `AGENT_NAME`, `AGENT_NO`, `STATUS`; related field list adds `CALL_UID`.
- Saved documentation lists `POST https://dservices.eand.af/Cpaas/api/pullcalldetails/authenticatepullreport` (username/password/DNI; returns token/expiry/circle) and `POST .../pullreport` (DNI, DD-MM-YYYY date range, circle, calltype). Call types: 1 incoming, 2 OBD, 3 CTC.
- Public report response is a placeholder, not a real row schema. Progressive campaign end-event options belong to a different service and must not be applied blindly to CTC.
- This strengthens feasibility: use a separate authenticated staff `Call_End` receiver if independent delivery is supported; read-only Pull Report polling is an alternative/reconciliation path.
- **Automatic lead creation after call disconnection is still NOT connected.** Need a redacted real callback/report row, actual final-status/timezone/call-ID semantics, correct agent mapping, account service/DNI access, and confirmation that delivery can coexist with V1 callback. Do not ask for plaintext credentials in chat or claim the platform settings are already enabled.
- Ordinary calls to a SIM bypassing CPaaS are not proven to appear in these reports/events. No provider calls, settings changes, campaign creation/activation, or credentials use was performed during analysis.

### Runtime and resume commands

- Fixture PHP and MariaDB services were stopped after verification. Runtime files and fictional test DB remain local temporary artifacts; do not run `setup-local.php` again against its already-created database (it deliberately creates a NEW database).
- Portable PHP: `%TEMP%/attaie-staff-php84/php.exe`; private local test config `%TEMP%/attaie-staff-api-test/config.php` (fictional fixtures only). Portable MariaDB under `%TEMP%/attaie-staff-mariadb/mariadb-11.4.8-winx64/`; fixture data `%TEMP%/attaie-staff-test-database`, port 3397, loopback only. These are not host deployments.
- Reopen preview from the implementation worktree: `node node_modules/vite/bin/vite.js --config apps/staff/vite.config.ts --host 127.0.0.1 --port 5175`, then `/callcenter/?preview=1` or `/management/?preview=1` on localhost. Preview is explicitly labeled, memory-only and absent from production builds. Do not promise the current dev server survives until tomorrow.
- Worktree node_modules is a junction to original checkout dependencies. Staff also has its own package/lockfile. Do not replace/upgrade existing app dependencies casually.
- Browser tests used Playwright installed in the npm cache via `PLAYWRIGHT_MODULE`; refer to test files/report for commands and use a local installation on another machine.

### First actions on resume

1. Read startup/AGENTS, this latest section, `docs/staff/current-implementation.md`, worktree verification/progress notes, and CPaaS page review.
2. Check branch/status before editing and retain all original-checkout changes. Do not repeat completed implementation/tests blindly.
3. Continue from provider/account evidence or owner UI feedback. Build automatic ingestion only after mapping actual provider data and safe independent integration, without modifying frozen CTC endpoints/database.
4. Keep production gates visible: provider workers/authentication, sales UI deferred by owner, privileged MFA/retention/operational hardening, hosting/Apache checks, current admin noindex/shared UI follow-up, and owner upload/import confirmation. The complete original 13-task production plan is not all finished.

## Mandatory startup and protection

On a new session read `C:/Users/RoheenAhmadi/.codex/skills/startup/SKILL.md`, load Caveman then brainstorming, and read repository AGENTS.md. Keep responses concise. User prefers action and minimal repeated confirmation; follow applicable skill requirements and existing authorization without inventing extra approval steps.

Protect working deployed V1, its entire MySQL database, and all existing working PHP/API/auth/config/routing/helpers. Do not migrate, seed, reset, alter, or test-write V1. New staff work uses isolated services and a new staff database. Preserve existing design foundations, bilingual/RTL/accessibility, and ordinary working application behavior. Production deployment requires separate authorization.

Testing target is `https://website.attaieproperties.com`, its separate document root and new empty test database. Owner uploads prepared manual-staging contents and imports SQL through phpMyAdmin. No automated installer/cPanel Terminal dependency. Private setup, SQL, and plaintext login details stay outside webroot. Do not read/echo existing `.env.local` or real `public/api/db.php`.

## Confirmed dashboard requirements

- Owner-confirmed later addition: all dashboards must have the same UX/UI. One shared staff design system covers call center, sales, management, existing admin, and future roles. Reuse existing admin foundations and align its frontend incrementally without changing authentication, frozen backend, or working journeys. Separate builds/public performance isolation still apply.
- Call center URL: `/callcenter`. Professional, modern, minimal staff UI grounded in existing admin styling.
- Separate role dashboard builds must not add staff code/styles, authentication requests, polling, notifications, or staff API calls to normal public visits.
- SEO is for the public website and its contents only. No staff/login/task/customer routes in public sitemaps; staff shells/headers need noindex independently of public SEO settings. Private data requires authentication, not crawler rules alone.
- After an agent's mobile call disconnects, desired Etisalat integration creates a draft lead with customer number, call date/time, agent, and automatic serial such as `CA01-L1`.
- Agent submits customer name, requirements/inquiry, and next follow-up date/time. This automatically creates/links a customer containing name, phone, and requirements; no separate customer-entry form.
- Customers tab lists permitted customers/requirements/lead history. Scope of “all customers” is not yet agreed.
- Follow-ups tab includes Today, Upcoming, Due/All due, Overtime, Completed and late history. All due is a design recommendation to avoid hiding yesterday's still-in-window tasks.
- Follow up and Visit require feedback and a next follow-up date/time on every submission.
- Deal closed: only the sales agent conducting the deal submits amount; complete lead with no next follow-up. Call center can read closure details, never submit closure.
- Deal lost: enter reason; complete lead without another follow-up.
- Call center can select a sales agent, give instructions and scheduled date/time, and send a task on the same lead.
- Sales submits feedback on that lead, then either keeps the next task with a new date/time or selects a call center agent and next date/time to return it.
- Feedback deadline is scheduled time plus 24 elapsed hours, not actual call time. At the deadline the task is still Due; strictly after it, incomplete work is Overtime. Late submission remains Completed late against the responsible assigned agent.
- Every staff dashboard, including future roles, has My Tasks. Website admin/CEO assigns tasks to a staff member with priority and deadline; user sees them there. General management tasks are independent of lead follow-ups and do not automatically get a 24-hour grace period.

## Recommended architecture, not yet implemented

- One new shared staff database, one modular PHP staff service, independent staff authentication/capabilities, separate role frontend builds.
- `/sales/`, `/management/`, and `/staff-api/v1/` are proposed addresses; only `/callcenter` was chosen explicitly by owner.
- New management accounts grant CEO/admin task assignment; do not automatically trust/reuse V1 admin sessions.
- Minimum sales and management screens are needed for genuine handoffs/assignments in the first workflow release.
- Shared source: staff UI, DTOs, validation, My Tasks, role manifests. No public application runtime imports of staff UI/dependencies.
- Transactional customer creation/feedback/handoff, immutable original lead identity with separate activity references, unique counters, optimistic versions, idempotency, durable provider inbox/outbox, scoped audit history.
- Proposed staff-only app package, contracts/UI packages, private `staff-service/`, new public staff API entrypoint, nested per-dashboard routing/noindex, and separate build/manual package scripts; see plan for exact paths.
- Same-host path separation is not an XSS boundary and shared hosting resources still need performance checks. Consider separate staff hosting/origin later when justified, without silently changing required URL.

## Open decisions / dependencies

1. Serial prefix changes: initial `CA01-L1`, later user examples `SA01-L1F1` / `SA01-L1V1`; clarify meaning of agent ID and actor prefix.
2. User used `DL` for closed; assistant suggested `DC` closed / `DL` lost. Never treat that suggestion as owner-confirmed.
3. Confirm deal currency/amount validation, customer matching for shared phones, customer visibility, repeat-call/new-lead policy, and one versus parallel active follow-ups.
4. Proposed UTC storage/Asia-Kabul display, future next-schedule validation, early feedback allowance, task priority/status enums, MFA, and session expiry defaults need design review as specified in plan.
5. Etisalat automatic capture is unverified. `public/api/initiate-call.php` is existing CTC, and `public/api/ctc/callback.php` updates website call log/payload; neither proves ordinary mobile call reporting, final timestamps, or per-agent identity. Obtain account-specific event/CDR docs/redacted completion sample and independent webhook/subscription capability. Do not replace/edit existing V1 callback or query/write protected DB as a shortcut.

## Git pull and workspace state

- Remote origin: `https://github.com/financeattaieproperties-gif/webstie-V2_deveopment.git`.
- Branch master fast-forwarded from `3baf781` to `a220b7ab39657a7093b6e59405958eafcdcc3e03` (`feat: integrate visual admin tools and update search`). Local HEAD equals fetched origin/master; no new commit/push made this session.
- Remote deleted 98 five-project PNG assets. They were copied to a temporary backup before merge and restored locally afterward, per project preservation rules. All 98 were verified present. They are now untracked and must not be lost or omitted from a fresh-checkout package.
- The untracked local `docs/project-explorer/asset-audit.md` collided with an incoming tracked file. Original local version backed up; incoming tracked audit is active. Backup directory: `C:/Users/ROHEEN~1/AppData/Local/Temp/WebsiteVersion2-pull-20261110-000027`; local audit backup `local-asset-audit.md`; artwork under corresponding `public/assets/` directories. Temp pointer: `%TEMP%/WebsiteVersion2-pull-backup-path.txt`.
- Existing modifications `.gitignore`, `AGENTS.md`, `package-lock.json` predate this work; do not revert or indiscriminately commit them.
- Existing untracked work includes `DEPLOYMENT-READY.md`, `deployment/`, asset inventory/protected PHP baseline JSON under `docs/project-explorer/`, older explorer spec/plan, packaging and staging scripts, and restored asset folders. Preserve all.
- Session-created planning documents are currently untracked. No application/backend changes were made in this session; latest spec updates include customer creation/My Tasks/SEO/performance/sales closure rules.

## Code review findings already documented

Review of new files found: empty default visual project config and no structural floor/apartment creation UI; publish/save catches reporting false success; deleted artwork and removed five-project fallback catalogs; older staging script depending on removed UI constants and omitting visual service; apartment calibration using individual unit image instead of whole-floor masterplan; Buy fallback filtering/cancellation issues; visual-service validation/auth/storage/revision weaknesses; untranslated public copy and overlay/image geometry risks. See stabilization plan for corrections, not staff plan scope expansion.

SEO read-only analysis: public TS/PHP sitemap generators enumerate public routes/entities only. Admin source/built HTML lacks robots noindex; repository server rules lack a staff-specific X-Robots-Tag. Live server headers were not checked. Do not alter frozen SEO PHP to resolve static dashboard exclusion.

## Checks already performed

- `npx tsc --noEmit` passed after pull.
- `npx tsc --noEmit -p admin-panel/tsconfig.json` passed.
- Public and admin Vite builds passed into fresh temporary output directories, leaving normal build outputs unchanged.
- Temporary public output: `C:/Users/ROHEEN~1/AppData/Local/Temp/attaie-analysis-build-20261110000457`; admin output same path plus `-admin`.
- Diff from `3baf781` to pulled HEAD contains no changes under `public/api/` or `backend-php/`.
- No PHP runtime checks, browser workflow checks, MySQL writes, provider calls, deployment, SQL imports, or production changes were performed. PHP was not found on PATH during review.
- Root `npm run lint` runs TypeScript, not ESLint. Root build includes sitemap generation (potential remote reads) and admin build output mutations; use isolated outputs/fixture API settings for future checks.

## Separate pending logo request

Owner supplied `C:/Users/RoheenAhmadi/Downloads/AttaieLogo.jsx` for admin and future login screens. It animates clipped raster layers using `motion/react` and references `/images/attaie-original.png` sized 1870x841. Required raster image was not found in inspected files. Current `public/logo.png` is 294x171 with different proportions; do not substitute it into the supplied layer geometry and claim correctness. User was asked for the original PNG/path. No animation code or image changed. Current static logo can remain until the asset is supplied.

## Next action when owner resumes

Read the staff spec and plan, incorporate owner choices, then execute authorized scope using applicable skills and an isolated workspace. Do not re-ask confirmed follow-up/deadline/handoff rules. Resolve only decisions that materially affect dependent work, keep provider limitations visible, and report files/verification/uncertainty accurately.
