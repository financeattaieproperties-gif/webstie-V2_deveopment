# Call Center and Shared Staff Dashboards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Use superpowers:subagent-driven-development only if the owner explicitly requests delegation. Track steps with checkboxes and read the requirements specification before execution.

**Goal:** Deliver `/callcenter` with automatic customer creation, follow-up deadlines, sales handoffs, and My Tasks, using a reusable foundation for future staff dashboards without increasing public website downloads or changing protected V1 resources.

**Architecture:** Separately built role frontends share a focused staff UI library and one modular PHP service. The service uses one new InnoDB staff database, independent authentication, record-level authorization, transactional workflows, and a durable Etisalat event inbox. Keep the protected website, existing admin authentication, APIs, MySQL database, and working CTC integration intact.

**Tech Stack:** Existing Vite/React/TypeScript tooling, self-hosted fonts, existing icon conventions, PHP with PDO MySQL for the new service, MySQL/InnoDB, PHP CLI job runner, and focused unit/integration/browser tests. Pin versions against the installed toolchain at execution; do not upgrade either existing React application or frozen backend dependencies.

**Spec:** `docs/superpowers/specs/2026-11-10-call-center-dashboard-design.md`.

**Status:** Proposed implementation plan for review. No dashboard, new service, database, or deployed integration has been built by writing this document. Architecture and business recommendations below remain proposals until accepted. This plan supersedes no V1 protection.

## Global Constraints

- Preserve deployed V1 routes, authentication, integrations, responsive behavior, accessibility, English/Dari, and RTL.
- Do not change production MySQL data, structure, grants, users, configuration, or existing application operations.
- Do not edit existing working PHP/API endpoints or helpers, including `public/api/`, `backend-php/` if present, `public/seo.php`, `public/sitemap.php`, or the existing Etisalat callback/initiation endpoints.
- New code must use separate backend services and isolated staff storage. No direct cross-database writes or foreign keys into V1.
- Develop and validate locally or in isolated staging. Production release requires separate explicit authorization and a known-good rollback.
- Use the current public/admin design foundations. Retain staff gold/navy styling, established fonts, accessible forms, and restrained spacing; avoid an unrelated redesign.
- Owner-confirmed addition: every staff dashboard, including existing admin and future roles, must share the same UX/UI system. Roles differ in modules/data/permissions, not typography, tokens, shell patterns, controls, responsive behavior, or interaction conventions. Align existing admin incrementally through compatible frontend work; do not replace its auth/backend or redesign working journeys.
- Normal public visits must download zero new staff assets and make zero staff authentication, polling, notification, or API requests.
- SEO covers only public website contents. Staff apps, login shells, APIs, private records, and exports must not enter public sitemaps or inherit public SEO indexing settings.
- New staff accounts are independent of V1 admin login. Never treat `sessionStorage` flags, frontend role selectors, or an existing admin cookie as staff authorization.
- Do not read, echo, commit, copy into releases, or package real `.env.local`, existing `public/api/db.php`, provider credentials, or real customer data.
- Owner manually uploads a specifically prepared testing folder and imports SQL through phpMyAdmin into a new empty testing database. No automated installer or cPanel Terminal dependency.
- Plaintext bootstrap login details and SQL stay outside the web upload directory. Generate passwords/hashes with PHP-compatible APIs.
- Existing unrelated local changes and untracked artifacts must be retained. No destructive resets, broad staging, automatic pushes, or production tests.

## Review Focus

1. Duplicate and out-of-order Etisalat events must create at most one initial lead per eligible physical call. Tasks 3 and 10.
2. Two tabs/agents submitting the same feedback must create only one next task, customer update, and activity. Tasks 3, 5, and 6.
3. Handoffs must not erase previous ownership, requirements, late submissions, or the original lead identity. Tasks 5–7.
4. A role or assignee change must remove access immediately and block direct ID-based requests, exports, and detail views. Tasks 4 and 11.
5. A clean checkout/package must not depend on stale public build output, a live provider, production DB access, or an untracked logo image. Tasks 1, 2, 12, and 13.

## 1. Recommended Dashboard Structure

Use one repository and one staff product with separate role builds. Do not create unrelated copies of the entire CRM or a separate database per role.

| Surface | Address | Main responsibilities |
|---|---|---|
| Existing customer website | Existing public routes | Marketing, properties, projects, existing inquiries/CTC; unchanged |
| Existing admin | `/admin/` | Existing site administration; preserved |
| Call center | `/callcenter/` | New-call inbox, leads, customers, follow-ups, My Tasks |
| Sales | `/sales/` (proposed) | Received leads, feedback, visits, returning tasks, sales-only closure, My Tasks |
| Staff management | `/management/` (proposed) | Staff accounts, admin/CEO task assignment, operational oversight, My Tasks |
| Shared staff API | `/staff-api/v1/` (proposed) | Authentication, permissions, customers, leads, follow-ups, tasks, integration |

`/callcenter` must resolve to its own entry document, with a safe redirect to the slash form if needed. Nested routes must serve the corresponding staff shell, never the public SPA. The sales/management names are recommendations, not previously chosen URLs.

The owner/CEO uses a new staff-management account to assign tasks. Optionally add a navigation link from existing admin to management, without sharing legacy sessions, credentials, or frozen authentication helpers. Full unrelated sales/management features are deferred; the first release must include the minimum screens required for real handoffs and assignments.

### Why this approach

- **Recommended: separate frontends, shared staff service/database.** Preserves download separation and consistent workflow rules. Shared source components reduce maintenance.
- **One combined admin bundle for all roles.** Less initial setup, but mixes navigation/release concerns and risks staff features entering the legacy admin runtime.
- **Independent backend/database per role.** Duplicates customer/task records and requires synchronization during every handoff. Avoid for this shared workflow.
- **Microservices for each feature.** Adds deployment and queue complexity inappropriate for the current shared-host environment. Start with a modular service and split only when measured demand requires it.

Separate frontends/databases do not isolate CPU, memory, PHP workers, disk, or MySQL server capacity when they share hosting. Measure contention. If demand grows, move the new staff service/database to separate hosting while preserving public-site behavior. Same-origin paths also share browser-origin trust; route separation is not an XSS security boundary. Stronger isolation may later require a staff subdomain or separate origin, with an explicit decision about the `/callcenter` URL requirement.

## 2. UX and Role Modules

### Call center navigation

1. **Overview:** new calls awaiting entry, due today, overtime, upcoming, and My Tasks summary.
2. **Follow-ups:** Today, Upcoming, Overtime, Completed; searchable, paginated list with lead serial, customer, scheduled time, feedback deadline, assignee, action.
3. **Customers:** customer search by name/phone, latest requirements summary, related leads, and immutable inquiry history within the user's permission scope.
4. **Leads / New calls:** call-created drafts awaiting customer details; submit name, requirements, next date/time, and optional sales handoff.
5. **My Tasks:** management-assigned work with priority, deadline, status, instructions, and completion history.
6. **Profile:** account details, password change, language, and sign out; staff cannot grant themselves roles.

Use a compact sidebar, white cards, muted background, navy text, restrained gold highlights, readable tables, clear empty/error/loading states, visible focus rings, mobile card/list layouts, and minimal motion. Use status labels/icons as well as color. Provide English/Dari resources and RTL; store user-selected language independently from public settings.

Today means scheduled on today's Asia/Kabul business date; it may include Upcoming and Due tasks. Overtime is a separate computed status, not just a date bucket. Tasks due yesterday but still within their 24-hour allowance remain Due and must stay visible in an additional “All due” filter/count; never hide them because they are not scheduled today.

### New lead creates its customer automatically

1. Receive or manually enter an explicitly marked call draft.
2. Agent supplies customer name, requirements, and next date/time.
3. One server transaction links/creates a customer, saves lead requirements, completes initial entry, creates the next follow-up, and records the activity/audit.
4. The customer immediately appears in permitted customer lists. No second form is required.

Recommended identity policy: normalize phone for search, but do not silently merge two different people sharing a phone. A match offers a permitted existing customer or “Create separate customer.” Do not leak another agent's private customer through matching suggestions. Store requirements per lead, with a customer summary derived from accessible inquiries; a new inquiry must not overwrite earlier requirements.

### Confirmed outcome rules

| Outcome | Allowed actor | Required | Next task |
|---|---|---|---|
| Follow up | Assigned call center or sales agent | Feedback, next scheduled date/time, valid next assignee | Required |
| Visit | Assigned call center or sales agent | Visit feedback, next scheduled date/time, valid next assignee | Required |
| Deal closed | Assigned sales agent conducting deal | Positive deal amount and configured currency (proposed validation) | None; lead completed |
| Deal lost | Assigned agent, under confirmed existing workflow | Loss reason | None; lead completed |

Sales can keep the next task or select a call center agent and next date/time. Call center can keep it or assign a sales agent. Completed deals are read-only to call center. Reopening/correcting a closed lead is not included until permissions and audit requirements are agreed.

### Follow-up time rules

Let scheduled UTC time be `S` and deadline `D = S + 24 elapsed hours`:

- Upcoming: `now < S`, incomplete.
- Due: `S <= now <= D`, incomplete.
- Overtime: `now > D`, incomplete.
- Completed on time: server submission time `<= D`.
- Completed late: server submission time `> D`; preserve `late_seconds = submission - D`.

Use server-received/accepted submission time, never a client-supplied completion timestamp. Repeated submissions return the original result. Late history remains attributed to the responsible assignee even after the lead moves. New tasks receive new schedules/deadlines; changing an assignee must not silently erase existing deadlines.

Management tasks have their explicit deadline and no automatic 24-hour allowance. Proposed priorities: Low, Normal, High, Urgent; proposed states: To do, In progress, Completed, Cancelled. Keep lateness independent of completion state. Priority affects presentation/order, not authorization or deadline calculations.

## 3. Security and Permissions

Use capability-based role permissions and per-record policies, checked on every API request. Deny unlisted operations by default. Frontend menus only reflect server permissions; they never enforce security themselves. This follows [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

| Operation | Call center | Sales | Staff admin / CEO |
|---|---|---|---|
| View My Tasks | Own | Own | Own; management oversight with explicit capability |
| View lead/customer | Current assignment or explicit originating-agent tracking access | Current assignment or explicitly granted history | Authorized organizational scope |
| Submit task feedback | Current assignee only | Current assignee only | No impersonation; audited reassignment instead |
| Assign next lead follow-up | To self/eligible sales | To self/eligible call center | Audited operational reassignment |
| Close deal | Never | Assigned sales agent only | No implicit closure bypass; require explicit sales authority if later approved |
| Mark Deal lost | Assigned lead work | Assigned lead work | Only if separately authorized |
| Assign general tasks | No | No | Yes |
| Manage staff/roles | No | No | Explicit staff-admin capability; no self-promotion |
| Bulk export | No by default | No by default | Explicit export capability; scoped and audited |

“All customers” means all records the logged-in role is authorized to see. Whether all agents may see the whole customer directory is an owner decision; safe default is assigned customers plus necessary originating-agent tracking, not the entire company database. Deactivation or revoked participation overrides earlier history access. Use one policy function consistently for lists, search, details, updates, counts, downloads, and notifications.

Authentication recommendations:

- New staff session name and dedicated session storage; do not collide with V1 PHP sessions or reuse `$_SESSION['admin']` as identity.
- Secure, HttpOnly, SameSite cookies over HTTPS, session ID rotation on login/privilege change, POST logout, 30-minute idle expiry and 12-hour absolute expiry (proposed defaults).
- Server-side session revocation on deactivation/password reset; validate account state and authorization version on requests.
- PHP `password_hash` / `password_verify`; login throttling by account and trusted client IP, generic login errors, and no plaintext passwords in SQL or logs.
- Synchronizer CSRF token plus exact-origin checks for browser mutations. Provider webhook uses its documented authentication instead of browser CSRF. Never reflect arbitrary credentialed CORS origins.
- Never store access credentials in localStorage or build-time `VITE_*` variables. Proposed production policy: no persistent browser storage of customer records; clear in-memory staff state at logout/role change.
- Prepared SQL, server validation of all fields, escaping through React, body/page-size limits, private cache headers, scoped CSP/security headers on staff assets/API, and structured redacted errors.
- Restrict password bootstrap/reset tools to private CLI/setup materials, never a permanent public installer. Prepare CEO/admin MFA capability; choose and test the provider/library before enabling privileged production access.

Cookie details and timeout handling follow [OWASP session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet). Independent cookie names prevent accidental collisions, not all same-origin compromise; keep browser-side script exposure minimal.

## 4. Data Structure: One New Staff Database

Use InnoDB transactions, `utf8mb4`, foreign keys within the new database only, UTC `DATETIME(6)` timestamps, and explicit version columns on mutable workflow records. Use integer internal keys; serials are separate display identifiers. Monetary amounts use DECIMAL, never floating-point arithmetic.

| Table | Key fields / purpose |
|---|---|
| `staff_users` | ID, stable agent code, name, username, password hash, active flag, auth version, language |
| `roles`, `permissions`, `user_roles`, `role_permissions` | Explicit staff authorization; separate from MySQL accounts |
| `staff_sessions` | Hashed session identifiers/metadata, expiry, revocation; private session mechanism |
| `agent_phone_assignments` | Normalized receiving phone/routing identity, agent ID, effective-from/to mapping |
| `customers` | Display name, phone, normalized searchable phone, version; no phone-only forced merge |
| `customer_access` | Explicit permitted participants where needed; revoked access must be enforced |
| `leads` | Immutable serial, origin call/agent, customer ID, requirements, draft/active/closed/lost state, current task ID, version |
| `call_records` | Provider account and call ID, caller/receiver, direction, started/answered/ended UTC, outcome, ingestion state |
| `provider_events` | Event identity/dedup key, call identity, authenticated bounded payload, receipt time, processing state/attempts |
| `followup_tasks` | Lead, assignee, assigned-by, schedule, deadline, completion time, late seconds, feedback/action, version |
| `lead_activities` | Append-only actor, activity sequence/type/reference, feedback, handoff, outcome, timestamps |
| `deals` | One final closure per lead, closing sales agent, DECIMAL amount, currency, closure timestamp |
| `management_tasks` | Title, instructions, creator, assignee, priority, deadline, status, completion time, version |
| `task_events` | Append-only management assignment/status history |
| `serial_counters` | Transaction-locked per-agent lead and per-lead activity counters |
| `idempotency_keys` | Actor/operation/key, request hash, committed result, expiry; detects changed-body reuse |
| `notifications`, `outbox_events` | Durable assignments/notifications, delivered state and retries |
| `audit_events` | Actor, operation, target, request ID, time, scoped changes; redact sensitive fields |
| `job_runs`, `schema_versions` | Worker heartbeat/failure tracking and isolated schema compatibility |

Required constraints/indexes:

- Unique username and stable agent code; unique lead serial; unique `(provider_account, provider_call_id)`.
- Unique provider event ID scoped to provider account; fallback dedup only if provider supplies a documented stable alternative.
- Unique `(lead_id, activity_sequence)`; unique closure `deals.lead_id`; unique idempotency scope/key.
- `(assignee_id, completed_at, scheduled_at, id)` and `(assignee_id, completed_at, deadline_at, id)` for follow-ups; `(assignee_id, status, deadline_at, id)` for My Tasks.
- Index lead/customer foreign keys, normalized phone, `(processing_state, next_attempt_at, id)` for jobs/events, and notification recipient/read/time.
- Enforce one current follow-up per lead through locked lead row and `current_task_id` plus server invariants. Do not rely only on a frontend check or unsupported partial-index syntax.

Runtime DB credentials have privileges only on the new staff database. Use separate setup credentials for schema import; runtime receives no schema-altering privileges. Never grant new access to the protected V1 database as a shortcut.

## 5. Workflow Consistency and Serial Numbers

Submit lead/customer creation atomically. Submit feedback, complete current task, allocate activity reference, update lead, create the next task or final outcome, and add audit/outbox entries in one transaction. Return success only after commit.

Lock records in a consistent order; check expected record version; roll back completely on failure. Retry confirmed deadlocks at most three times with bounded backoff and the same idempotency key. Follow MySQL transaction/deadlock guidance; do not use `MAX(id)+1` counters. [MySQL documentation](https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks.html)

Keep the original `CA01-L1` identity after assignment. Proposed activity display is original serial plus action sequence; unresolved `SA` and closed/lost suffixes must be confirmed before finalizing UI/exports. If both lead origin and sales actor need display, show separate fields instead of ambiguously replacing the lead identifier.

Each physical completed call can produce a distinct draft lead under the user's stated model. Repeat caller customer matching is independent of event retry deduplication. Call events, customers, leads, tasks, and activities are different records; do not collapse them into one mutable table.

## 6. API Contract

New PHP service under `/staff-api/v1/`, with its own front controller and nested `.htaccess`. Package nonpublic PHP code/config outside the document root; public entrypoint loads a server-configured private application directory. Preserve existing root `.htaccess` and PHP endpoints.

| Endpoint | Purpose |
|---|---|
| `GET /session`, `POST /auth/login`, `POST /auth/logout` | Session bootstrap, login, logout; return user/capabilities/CSRF/server time |
| `POST /auth/change-password` | Current-password-verified credential change and session revocation policy |
| `GET /dashboard` | Scoped compact summary and server time; no full record download |
| `GET /leads`, `GET /leads/{id}` | Paginated permitted leads and activity history |
| `POST /call-drafts` | Optional explicit manual fallback, permission/source labeled; not fabricated provider ingestion |
| `POST /leads/{id}/submit-entry` | Required name/requirements/next date; atomic customer creation/link and first task |
| `GET /customers`, `GET /customers/{id}` | Scoped search/details and paginated linked inquiries |
| `GET /followups` | Scope `mine`, bucket today/upcoming/due/overtime/completed, cursor, filters |
| `POST /followups/{id}/feedback` | Outcome, notes, next schedule/assignee or deal amount/reason, expected version |
| `GET /directory/assignees` | Only eligible minimal staff details; no broad directory/PII leakage |
| `GET /tasks`, `GET /tasks/{id}` | My Tasks; management scope requires separate capability |
| `POST /tasks`, `PATCH /tasks/{id}` | Admin/CEO assignment; assignee may change only allowed status/feedback fields |
| `GET /notifications`, `POST /notifications/{id}/read` | Durable recipient-scoped notifications |
| `GET/POST/PATCH /staff` | Explicit management capability for staff lifecycle; separate DTOs avoid mass assignment |
| `POST /integrations/etisalat/events` | Provider-authenticated bounded durable receipt, disabled until contract verified |

Mutations require a client-generated `Idempotency-Key` and expected version where modifying workflow state. Successful JSON envelopes include `{ data, requestId, serverTime }`; errors include `{ error: { code, message, fields? }, requestId }` without SQL/secrets. Lists include opaque next cursor. Clamp page size to 25 by default, 100 maximum. Never return entire customer/task histories in summary endpoints.

Use `401` for unauthenticated, `403` for unauthorized actions, non-enumerating `404` for inaccessible records, `409` for stale versions/idempotency conflicts, `422` for field errors, `429` with Retry-After for limits, and generic `500/503` for failures. Distinguish “offline/not saved” from success. Never automatically replay non-idempotent operations without a stable request key.

## 7. Etisalat Event Capture

Existing website CTC and pingback are preserved. Their current presence does not prove ordinary mobile-call reporting or post-disconnection events are available.

1. Obtain account-specific event/CDR documentation and a redacted completed-call sample.
2. Confirm whether calls are CTC, direct mobile, or both; identify stable call/event ID, customer and receiving number, completion timestamp, timezone, outcome, signatures/authentication, retries, and agent routing.
3. Confirm independent subscription/destination is supported without replacing the working V1 callback. If it is not, stop live integration and document the provider change required. Do not silently edit V1 or scrape its protected database.
4. New receiver authenticates documented provider requests, persists bounded events, then acknowledges only after durable receipt. Use the provider's required acknowledgment format/status; do not invent a universal response contract.
5. A retryable worker normalizes eligible completed calls, resolves the receiving agent at call time, and transactionally creates one call record/draft lead. Unknown agent, missing identity, invalid timestamp, or ambiguous payload enters a management-visible quarantine queue.
6. Duplicate retries and later call-leg events update permitted call metadata without creating duplicate leads. Out-of-order events must not move a completed call back to ringing.
7. Expose sync health and last successful event time. Allow fixture/manual operation only when explicitly labeled; never describe it as verified automatic Etisalat integration.

Do not collect recordings by default. Minimize retained payload fields and define a retention policy before production. Provider call direction/leg mapping matters: a bridged CTC call can ring the agent first, so the customer number cannot be inferred blindly from “caller.”

## 8. Performance and Stability

- Separate Vite output per role; public application imports no staff modules. Build-time source sharing is permitted, cross-app runtime imports are not.
- Within each role, lazy-load customers, lead details, reporting, and management forms. Avoid charts, map libraries, editors, Electron dependencies, and animation frameworks unless the screen needs them.
- Self-host existing font files with a limited weight set. Reserve logo/image space; no external font requests or full-page motion dependency for a login ornament.
- Paginate/search on the server. Debounce text search by 250 ms; cancel stale reads and guard response ordering. Use indexed prefix/exact phone/serial search; do not claim arbitrary substring queries are index-efficient.
- Proposed initial dashboard polling: every 60 seconds only while visible, one request at a time, with focus refresh, jitter, and bounded exponential backoff on errors. Compute display countdowns locally using returned server time; server remains authoritative.
- No 1-second fleet-wide polling, continuous full-history reloads, or long-lived SSE/WebSocket workers on shared hosting initially. Estimate load as `active agents / refresh interval` requests per second and measure real query cost.
- Worker runs by cPanel Cron Jobs UI, no Terminal requirement. Durable jobs use bounded batches/timeouts and a lease/lock to prevent overlapping workers. Use a dedicated fixture runner locally.
- Due/overtime status derives from timestamps during reads, so follow-ups still become overtime if a reminder worker stops. Jobs are for ingestion/notifications, not the correctness of deadline labels.
- New DB constraints, idempotency, transactions, and optimistic versions prevent duplicate/partial handoffs. Network failure retains form text in memory with an explicit retry state; verify committed result before retrying.
- APIs return `Cache-Control: private, no-store`; hashed static assets may be immutable. Prevent shared CDN caching of customer/task responses. HTML uses safe revalidation to avoid stale asset references.
- Public performance comparison uses the same baseline fixtures/network conditions; initial release gate: zero staff requests/assets on public routes, no new public JS/CSS imports, no unexplained repeated median public timing regression above 10% under representative staff load.
- Provisional isolated staging target: core list/feedback API p95 under 500 ms at 20 concurrently active staff, excluding provider latency; measure achievable capacity on actual hosting before promising it. Keep provider networking out of request/transaction critical paths.

## 9. Proposed Repository Layout

```text
apps/staff/
  package.json, tsconfig.json, vite.config.ts
  entries/callcenter/index.html
  entries/sales/index.html
  entries/management/index.html
  src/bootstrap.tsx
  src/auth/                 # New staff session and capability handling
  src/shell/                # Existing staff design foundation, responsive nav
  src/modules/overview/
  src/modules/leads/
  src/modules/customers/
  src/modules/followups/
  src/modules/tasks/        # My Tasks reused by every role entry
  src/modules/management/
  src/i18n/{en,fa}.json
packages/staff-contracts/   # DTOs/runtime validation, no React or secrets
packages/staff-ui/          # Staff-only UI; never imported by public src/
staff-service/
  src/{Auth,Authorization,Customers,Leads,Followups,Tasks,Integrations,Jobs,Audit}/
  config/config.example.php
  database/001-initial.sql  # New empty staff database only
  bin/{worker.php,bootstrap-admin.php}
public/staff-api/           # New service entrypoint and its own .htaccess
deployment/staff/           # Role routing rules, release manifest, manual guide
scripts/build-staff.mjs
scripts/package-staff.ps1
tests/staff/{domain,api,integration,browser,packaging}/
docs/staff/                # API, permissions, provider mapping, release evidence
```

Each role build uses a fixed allowlisted role/base (`/callcenter/`, `/sales/`, `/management/`) and outputs into a fresh private staging directory with its own `assets/`. Do not automatically copy these outputs into root `public/` or make public builds traverse them. No frontend role value grants backend permission.

Keep the new app's package/lockfile separate initially; do not restructure the existing monorepo dependency graph. Future roles add a manifest/navigation module and reuse contracts/My Tasks/auth source. Shared React code remains staff-only, with one pinned React major for the new staff app; do not cross-import React 18 admin components into React 19 runtime.

## 10. Step-by-step Implementation

### Task 1: Baseline, decision log, and isolated workspace

**Files:** New `docs/staff/decisions.md`, `docs/staff/baseline.md`; read existing spec and current protected code only.

**Interfaces:** Baseline manifest identifies protected files by hash and public route assets/requests. Decision log distinguishes confirmed requirements from proposals.

- [ ] Read AGENTS and applicable worktree/execution skills; create an isolated branch/worktree without moving or reverting local user changes.
- [ ] Record source commit, working-tree state, public/admin successful build/typecheck baseline, public bundle sizes, and representative public requests.
- [ ] Hash protected tracked PHP/API/config templates; do not read/copy credential files. Capture existing admin login behavior without production test writes.
- [ ] Resolve serial identity/suffixes, currency, customer matching/visibility, agent mapping, and provider gates listed in Section 12 before their dependent code. Independent UI/domain work may proceed with explicit fixture assumptions.
- [ ] Commit documentation only: `docs: define staff dashboard baseline and decisions`.

### Task 2: Separate role shells, build isolation, design system, and SEO

**Files:** `apps/staff/`, `packages/staff-ui/`, `scripts/build-staff.mjs`, `deployment/staff/`, `tests/staff/packaging/build-isolation.test.mjs`.

**Interfaces:** `build-staff.mjs --role callcenter|sales|management --out <new-directory>` produces a role entry, hashed local assets, manifest, and nested routing rules. New `StaffShell` consumes role navigation/capabilities but does not authorize API operations.

- [ ] Write failing build-isolation checks: each role resolves its base/deep links and public build/import graph contains no staff modules or polling.
- [ ] Scaffold separate staff package with versions compatible with installed tooling; no broad package upgrades. Define reusable colors, fonts, layout, form, table/list, badges, dialogs, focus and responsive behavior.
- [ ] Use one shared staff design-token/component source across call center, sales, management, and future roles. Inventory existing admin components and define a compatible incremental frontend adoption path; compare representative screens side by side and test existing admin behavior before any adoption. Do not introduce cross-React-major imports; use framework-neutral tokens and compatible separately built component adapters where needed.
- [ ] Add root/nested/login/error `noindex` HTML and staff-specific `X-Robots-Tag`; keep private responses no-store. Use nested `.htaccess` so protected root routing remains unchanged.
- [ ] Add public sitemap allowlist assertions and confirm staff exclusion. For current admin, plan a narrowly scoped static HTML noindex tag and dedicated `public/admin/.htaccess` source packaging; do not edit frozen PHP or rely on generated output alone.
- [ ] Test 360/768/1440 px, keyboard navigation, EN/FA/RTL shells, direct deep links, and staff login accessibility.
- [ ] Run role builds and public regression measurements; expect zero added staff assets/requests. Commit `feat: add isolated staff dashboard shells`.

### Task 3: New database, domain rules, and test fixtures

**Files:** `staff-service/database/001-initial.sql`, `packages/staff-contracts/`, `staff-service/src/{Leads,Followups,Customers,Tasks}/`, `tests/staff/domain/`, isolated DB fixtures.

**Interfaces:** `classifyFollowup(scheduledAt, completedAt, now)` implements exact Section 2 boundaries. Service use cases `SubmitLeadEntry`, `SubmitFollowupFeedback`, and `AssignManagementTask` execute transactional domain commands with actor context/idempotency/version.

- [ ] Write failing clock tests for `S-1`, `S`, `D`, `D+1`, on-time/late feedback, Kabul date boundaries, and independent management deadlines.
- [ ] Define new schema, internal foreign keys, constraints/indexes, DECIMAL currency representation, and locked counters. No schema execution against V1.
- [ ] Add concurrent serial allocation, duplicate event, duplicate feedback, stale version, rollback, and deadlock retry integration tests in a disposable staff DB.
- [ ] Implement shared request/response validation and transaction skeleton; set DB session timezone explicitly and test UTC round trips.
- [ ] Run domain/isolated DB tests and inspect query plans for required task/customer queries. Commit `feat: define transactional staff workflow data model`.

### Task 4: Staff authentication and authorization

**Files:** New `staff-service/src/{Auth,Authorization}/`, new `public/staff-api/`, `apps/staff/src/auth/`, `tests/staff/api/auth.test.*`, `authorization.test.*`.

**Interfaces:** `GET /session` returns user/capabilities/CSRF/server time; `authorize(actor, capability, resource)` and repository scope predicates enforce the same decisions for all paths.

- [ ] Write failing anonymous/wrong-role/other-agent/disabled-user/expired-session tests, including forged sessionStorage and altered record IDs.
- [ ] Implement independent cookie/session handling, hashed credentials, throttling, CSRF/origin checks, generic errors, revocation, and password change. No legacy-auth helper imports.
- [ ] Add private bootstrap script with a verified PHP hash and off-webroot login delivery; no public default account or reusable installer.
- [ ] Verify old admin login remains unaffected and existing admin cookies cannot authorize staff writes.
- [ ] Test field-level restrictions, directory/customer enumeration, notification scoping, stale permissions, and unauthenticated private downloads. Commit `feat: secure staff authentication and record permissions`.

### Task 5: Lead entry and automatic customer creation

**Files:** New customer/lead repositories and services, `apps/staff/src/modules/{leads,customers}/`, `tests/staff/integration/lead-entry.test.*`, browser customer tests.

**Interfaces:** `POST /leads/{id}/submit-entry` accepts name, requirements, next schedule/eligible assignee, explicit permitted customer link or create choice, idempotency key, expected lead version.

- [ ] Write failing test: submitting valid initial entry creates/links exactly one customer, preserves caller phone, saves requirements, activates lead, and creates next follow-up atomically.
- [ ] Test missing fields, invalid/past schedules per agreed policy, phone normalization, shared phone with different people, inaccessible matches, duplicate clicks, and transaction failure.
- [ ] Implement customer/lead DTOs and customer matching; store each inquiry independently. Do not silently overwrite a previous name/requirements from a later caller.
- [ ] Build searchable Customers list/detail and New calls/Leads entry with labels, validation, loading/empty/error states, permitted history, and immediate refresh after commit.
- [ ] Verify customer access follows the agreed record policy during handoff, revocation, and deactivation. Commit `feat: create customers automatically from call center leads`.

### Task 6: Follow-ups, overtime, and sales handoff

**Files:** `staff-service/src/Followups/`, lead activity services, `apps/staff/src/modules/followups/`, sales entry modules, `tests/staff/integration/followups.test.*`, browser handoff tests.

**Interfaces:** `POST /followups/{id}/feedback` consumes outcome/notes/next assignment or final outcome fields; returns updated lead, completed task/activity, and optional next task. Client submits server-issued version and stable idempotency key.

- [ ] Write failing end-to-end tests: call center to sales, sales to self, sales to selected call center, exact deadline boundary, and completed-late attribution after handoff.
- [ ] Implement locking/version checks and atomic feedback/next-task transaction; reject completed task replay with changed body, invalid assignee, missing next schedule, and unauthorized closure.
- [ ] Implement sales-only deal closure with amount/currency, loss reason closure, and immutable activity references. Enforce one active next task; do not reset overdue history on reassignment.
- [ ] Build Today/All due/Upcoming/Overtime/Completed filters and clear next-owner form. Provide minimum `/sales/` received-task/feedback screens needed to exercise the workflow.
- [ ] Test call center cannot close through hidden UI or direct API, sales task disappears from previous owner's active queue after a committed handoff, and authorized origin tracking remains read-only.
- [ ] Run concurrency, domain, permissions, browser and EN/FA/RTL checks. Commit `feat: implement scheduled followups and sales handoffs`.

### Task 7: My Tasks across all roles and CEO/admin assignment

**Files:** `staff-service/src/Tasks/`, `apps/staff/src/modules/{tasks,management}/`, task navigation manifests, `tests/staff/integration/management-tasks.test.*`.

**Interfaces:** Shared `MyTasks` module reads `/tasks?scope=mine`; privileged creation accepts title/instructions/assignee/priority/deadline/optional lead. Separate management DTO prevents staff from changing assignee/priority/deadline by mass assignment.

- [ ] Write failing test: CEO/admin assigns a high-priority task with deadline to agent; task appears only in authorized My Tasks lists and is unrelated to lead allowance.
- [ ] Implement assignment, validated status transitions, priority/deadline ordering, history, notification outbox, and idempotent completion. Include proposed completion notes if accepted in decisions.
- [ ] Build minimum `/management/` staff directory/account activation, task assignment/list/detail, and operational reassignment UI. Protect role editing and preserve no implicit CEO deal-closure bypass.
- [ ] Register My Tasks in every new role manifest; add reusable extension contract for future dashboards. For existing admin, provide navigation to new management workspace rather than replacing its frozen auth.
- [ ] Test simultaneous status edits, disabled assignee rejection, overdue management tasks with no extra 24 hours, privacy scoping, and assigned-user completion. Commit `feat: add shared My Tasks and management assignments`.

### Task 8: Overview, activity history, and deadline presentation

**Files:** `apps/staff/src/modules/overview/`, detail timelines, scoped summary API, `tests/staff/api/dashboard.test.*`, browser overview tests.

**Interfaces:** `/dashboard` returns scoped counts and bounded previews with `serverTime`; totals use the same predicates as destination lists.

- [ ] Add failing count/list consistency tests covering Today versus Due, old overtime tasks, late completion, handoff, and final closure.
- [ ] Build compact action-focused overview, customer requirements summaries, timeline, and read-only sales closure details for call center.
- [ ] Show schedule, deadline, submission time, assigned agent, and lateness explicitly; use text/icons plus color and timezone labels.
- [ ] Test empty state, provider unavailable banner, partial API failure, reconnect, clock skew, role changes, and visible error recovery.
- [ ] Verify summaries do not return broad customer content or full histories. Commit `feat: add scoped call center overview and activity history`.

### Task 9: Durable jobs and notifications

**Files:** `staff-service/src/Jobs/`, `bin/worker.php`, outbox/notification repositories, client refresh hooks, `tests/staff/integration/jobs.test.*`.

**Interfaces:** `worker.php --max-seconds=40 --batch-size=50` acquires a lease, retries due events, and records heartbeat/outcomes. Cron UI invokes this private script; no public worker endpoint.

- [ ] Write failing tests for crash after commit, retry delivery, expired lease, duplicate notification suppression, and worker downtime without incorrect overdue labels.
- [ ] Implement bounded leases/batches/retries with quarantine after repeated failures, redacted job error details, and durable notification identity.
- [ ] Add recipient-only notification counts with 60-second visible-tab refresh/backoff; pause on hidden/offline tabs and revalidate on focus.
- [ ] Add management integration-health and worker-heartbeat display. Stop error loops; no unbounded retry storm.
- [ ] Load-test queue recovery and ensure public request latency remains within the measured gate. Commit `feat: add reliable staff jobs and notifications`.

### Task 10: Verified Etisalat adapter

**Files:** `staff-service/src/Integrations/Etisalat/`, new integration route, private example config, `docs/staff/etisalat-contract.md`, redacted fixtures/tests.

**Interfaces:** `authenticateProviderRequest(rawBody, headers)` and `normalizeProviderEvent(payload)` follow verified documentation and produce a typed normalized event, not assumed provider keys.

- [ ] Complete provider contract/independent-subscription gate before live wiring. Preserve the current V1 callback destination.
- [ ] Write failing fixtures for CTC leg mapping, direct mobile support if available, completed/failed/missed calls, duplicate/out-of-order events, receiving-agent mapping at call time, unknown agents, and withheld numbers.
- [ ] Implement bounded authenticated durable receiver, worker normalization, call-level deduplication, transactional draft creation, and quarantine.
- [ ] Test documented retry/ack behavior including storage failure and replay attempts; no success acknowledgment before durable storage.
- [ ] Validate only in isolated provider sandbox or separately authorized testing configuration. Keep connector disabled in public deployment packages until configured.
- [ ] Record exact supported call types and observed latency. If provider capability is unavailable, mark automatic ingestion blocked and retain labeled fixture/manual mode; never present it as finished. Commit `feat: integrate verified Etisalat call completion events` only when verified.

### Task 11: Security, accessibility, and operational review

**Files:** Focused test files, deployment security configuration, `docs/staff/security-and-operations.md`.

**Interfaces:** Role/record matrix and invariants in this plan are testable release requirements; failures block release.

- [ ] Run authorization matrix against list/detail/search/count/update/directory/notifications and optional exports for each role, unauthorized user, and revoked account.
- [ ] Verify cookie attributes, CSRF, login limits, changed-body idempotency rejection, body limits, XSS-safe notes, no-store headers, no public secrets, and staff noindex root/nested/login/error behavior.
- [ ] Test English/Dari keyboard flows, focus restoration, form error announcements, touch targets, 360/768/1440 layouts, no horizontal overflow, and reduced motion.
- [ ] Compare before/after public network/import graphs, builds, sitemap contents, and repeatable performance under staff load. Review shared-host CPU/DB saturation risk.
- [ ] Recompare protected-file hashes and scope diff. Fix only new staff code or separately authorized static frontend safeguards; never refactor frozen PHP.
- [ ] Commit observed review evidence, not an assertion that documentation guarantees security.

### Task 12: Fresh-checkout manual staging package

**Files:** `scripts/build-staff.mjs`, `scripts/package-staff.ps1`, `deployment/staff/README.md`, SQL/config templates, `tests/staff/packaging/`.

**Interfaces:** New package layout separates `webroot/`, `private-app/`, `database/`, `setup/`, and `ADMIN-LOGIN-PRIVATE.txt`; only webroot contents belong in the testing document root.

- [ ] Add failing package checks for missing nested routing/headers, public private code/config, plaintext/hash mistakes, stale assets, forbidden backend files, incorrect base URLs, and missing role entries.
- [ ] Build all three minimal staff surfaces into fresh outputs. Produce checksummed source/build manifest and separate new-empty-staff-DB SQL import; never embed V1 schema/data or credentials.
- [ ] Use PHP CLI locally to generate the initial account's compatible password hash and private login file, with no password in printed output. If PHP unavailable, resolve runtime locally before claiming this step verified.
- [ ] Document manual cPanel creation of new test DB/user with limited privileges; phpMyAdmin import; private application/config/session/job directories outside webroot; uploads of webroot contents including hidden files; Cron Jobs UI setup; HTTPS and permissions.
- [ ] No automated installer or Terminal requirement. Test service fails closed on missing/invalid private config rather than selecting V1 credentials or public storage.
- [ ] Confirm nested staff routes work under existing root file/directory exemptions; if host behavior requires changing frozen routing, stop and propose an isolated host/reverse-proxy alternative for approval.
- [ ] Verify from clean checkout and an Apache/PHP/MySQL staging-equivalent runtime, not just Vite. Commit `build: prepare isolated manual staff staging package`.

### Task 13: Backups, rollout, and final evidence

**Files:** `docs/staff/release-verification.md`, `docs/staff/rollback.md`, private backup-job templates (no live credentials).

**Interfaces:** Release manifest pins frontend, service, and schema version; application rejects incompatible schema cleanly. Rollback never restores a stale database over newly collected leads without a separate reviewed recovery procedure.

- [ ] Run typechecks/builds/domain/API/MySQL/browser/package tests and record exact commands, runtimes, exit status, source revision, and test environment.
- [ ] Backup/restore the isolated staff DB and private provider queue in a disposable environment. Proposed target: daily automated backups, 24-hour maximum data loss and 4-hour restoration until a stronger verified backup capability is chosen. Provider retries are not a backup.
- [ ] Maintain backward-compatible schema/code for the previous staff release during pilot. Roll back assets/service using known-good manifests, pause connector/jobs safely, retain accepted events, and replay idempotently after recovery.
- [ ] Handoff specific upload/private/SQL/login paths and checksums, owner import order, server configuration, smoke checks, and remaining provider/business limitations.
- [ ] Pilot one call center and one sales agent on isolated data; verify customer creation, both handoff directions, tasks, late reporting, closure permissions, and CEO assignment.
- [ ] Confirm owner performed upload/import and server checks before claiming installed. New staff production release and provider subscription require explicit authorization; no automatic V1 deployment.
- [ ] After an authorized pilot, monitor login errors, queue age, failed jobs, duplicate suppression, submission latency, DB saturation, and public timings; expand only with evidence.

## 11. Verification Tooling

Inventory installed tools first. Add only development test dependencies required for staff behavior; keep new staff package lockfile isolated. Proposed commands to implement in its package:

```text
npm --prefix apps/staff run typecheck
npm --prefix apps/staff run test:domain
npm --prefix apps/staff run test:browser
node scripts/build-staff.mjs --role callcenter --out <fresh-output>
node scripts/build-staff.mjs --role sales --out <fresh-output>
node scripts/build-staff.mjs --role management --out <fresh-output>
php staff-service/tests/run.php
node --test tests/staff/packaging/*.test.mjs
```

These are planned interfaces, not commands already available or executed. Use a disposable MySQL database for transactional/constraint tests; SQLite/mocks cannot prove MySQL locking semantics. PHP was not available on PATH during earlier review; local PHP/MySQL or an equivalent isolated runtime is a prerequisite for backend verification. Root `npm run lint` currently means TypeScript only, not a separate ESLint audit. Root build also regenerates sitemap and admin output; isolate those effects and use fixture API settings.

## 12. Decisions Needed and Suggested Defaults

These are review gates for dependent tasks, not reasons to block unrelated implementation work:

| Decision | Recommendation / status |
|---|---|
| Architecture and routes | Separate role builds plus one new staff service/database; `/callcenter` confirmed; `/sales` and `/management` proposed |
| Customer visibility | Assigned/explicitly participating customers; manager-wide view by capability. Confirm if all agents should share the directory |
| Repeat callers | New call creates separate draft lead; allow explicit existing customer link; no silent phone-only merge |
| Serial identity | Preserve `CA01-L1`; clarify `SA` actor meaning and `DL` versus `DC` before final activity serial format |
| Agent lead counter | Per originating call center agent, monotonic, never reset; minimum two-digit agent display but support IDs above 99 |
| Call reporting | Provider contract and independent callback subscription required; account capability unverified |
| Receiving-agent identity | Effective-dated mobile/routing mapping; shared phone/transfers need documented provider routing evidence |
| Timezone and scheduling | UTC storage, Asia/Kabul display; next schedule strictly future; early feedback allowed with audit (proposed) |
| Parallel follow-ups | One active next follow-up per lead; separate general tasks may coexist |
| Deal currency | Required explicit configured currency and positive DECIMAL amount; owner chooses default |
| My Tasks details | Low/Normal/High/Urgent; To do/In progress/Completed/Cancelled; notes on completion recommended |
| Closed-lead changes | No deletion/reopening in initial release; manager-reviewed audited correction later |
| Staff MFA | Require for privileged staff accounts before production; select compatible implementation during auth design |
| Logo animation | Original PNG dependency missing; use current static logo until supplied, no public-site change |
| Existing admin SEO gap | Static noindex shell plus independently packaged nested header rule; no frozen PHP changes |

## 13. Scope and Acceptance Gates

**Initial complete workflow:** call center, minimum sales handoff/closure UI, minimum CEO/admin assignment UI, shared My Tasks, automatic customer creation, reliable deadlines/history, private authentication, and reproducible manual testing package.

**Independent integration gate:** real automatic Etisalat lead ingestion remains incomplete until provider proof and isolated end-to-end validation. Label fixtures/manual entry clearly; do not advertise automatic capture as delivered early.

**Deferred suggestions:** call recordings, WhatsApp automation, SMS reminders, advanced commissions/reporting, bulk imports/exports, native mobile apps, complex microservices, and replacing the existing admin. Add only through separate scope decisions.

Release checklist:

- [ ] Public website downloads and requests remain staff-free; protected backend/V1 database unchanged.
- [ ] Every role has My Tasks; only authorized management can assign general work.
- [ ] Every dashboard follows the same staff UX/UI conventions; side-by-side desktop/mobile and EN/FA/RTL review shows no unexplained design drift, with existing admin compatibility preserved.
- [ ] Lead submission creates/links customer with name, caller phone, requirements, and history in one transaction.
- [ ] Follow up/Visit always require next schedule; sales handoffs work both ways on the same lead.
- [ ] Only assigned sales agent can close a deal with amount/currency; lost reason closes without another follow-up.
- [ ] Deadline is schedule plus 24 hours; overtime begins strictly afterward; completed-late history persists.
- [ ] Duplicate events/requests and concurrent submissions cannot duplicate leads, serials, or next tasks.
- [ ] Staff identity, capability, record access, CSRF, session revocation, schema/body limits, audit and privacy checks pass.
- [ ] Staff noindex/sitemap exclusion and protected access verified on actual Apache/PHP-equivalent staging.
- [ ] Worker restart/lease/retry, provider quarantine, DB backup/restore, and code rollback tested with isolated data.
- [ ] Fresh package has no secrets/private materials in webroot and no frozen backend payloads.
- [ ] All business/provider decisions affecting shipped behavior are resolved or explicitly flagged as incomplete.
- [ ] Owner receives measured results, known limitations, exact manual instructions, and separate release decision.

## Plan Self-Review

- Confirmed workflow, later customer creation requirement, universal My Tasks, sales-only closure, overtime boundaries, public performance, and public-only SEO each map to explicit implementation tasks and release tests.
- Browser separation, runtime/backend authorization, new database isolation, and shared hosting capacity are treated as different concerns.
- Existing Etisalat receiver is acknowledged but never assumed to provide the required new event contract or edited as a shortcut.
- Serial/currency/visibility/provider assumptions remain visible instead of being silently finalized.
- Security and transaction tests cover adversarial IDs, late/duplicate submissions, stale permissions, partial writes, and clean-checkout reproducibility.
- Only planning documents changed while preparing this plan. Execute through reviewed decisions and isolated validation before any release.
