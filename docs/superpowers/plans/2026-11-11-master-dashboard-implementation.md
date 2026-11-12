# Attaie Properties V2 — Master Dashboard Implementation Plan

> For agentic workers: use `superpowers:executing-plans` to implement this plan task by task. Complete each phase, verify it, update this file's progress log, then continue to the next phase without requesting routine approval again.

**Goal:** Build one connected internal CRM covering Management, Sales, Call Center, HR, Finance, Marketing and Production, and Engineering, with consistent dashboard UI/UX and permission-scoped workflows.

**Architecture:** Extend the existing shared React staff application, Firebase authentication, PHP staff service, and MySQL module structure. Separate the website, internal CRM, and submission databases. Preserve existing V2 data and existing project IDs/artwork.

**Tech stack:** Existing React/TypeScript/Vite staff application, existing React Admin application, Firebase Authentication, PHP/PDO/MySQL, shared TypeScript contracts, existing automated tests. Preserve the separate React versions used by Admin and staff.

**Status (audit reopened 2026-11-12):** Owner authorized implementing all remaining work and the new Management/HR/Finance requirements. Historical checkmarks and the progress table below are claims from the previous implementation, not current acceptance evidence. Audit found missing PHP module routes behind preview-only screens and 97 staff TypeScript diagnostics. The execution ledger below supersedes earlier completion claims. Nothing has been deployed by this work.

## Source requirements

- [Sales](../../sales-dashboard-requirements.md)
- [Marketing and Production](../../marketing-production-dashboard-requirements.md)
- [Engineering](../../engineering-department-dashboard-requirements.md)
- [Finance](../../finance-dashboard-requirements.md)
- [Call Center](../../call-center-dashboard-requirements.md)
- [Management and HR](../../management-dashboard-requirements.md)
- [Shared dashboard UI/UX and sign-in animation](../../staff/shared-dashboard-design.md)

The department files preserve the owner's original requirements and corrections. This master plan consolidates those requirements and the decisions confirmed during the master-plan review. Later explicit owner corrections take precedence. Synchronize material changes back to the relevant department files during implementation.

## Global constraints

- Work targets Attaie Properties V2 and its separate testing environment at `https://website.attaieproperties.com`. Do not deploy to V1 or change its database.
- Preserve existing V2 records. Use fictional fixtures for automated testing. Verify database identity before operations.
- Owner correction, 2026-11-12: remove the five bundled showcase projects, their data/artwork/floor plans/previews from new packages. Keep reusable explorer code. Start with empty project and apartment catalogs; do not reset an existing V2 database.
- Keep credentials, private configuration, SQL, and setup materials outside the uploadable web root.
- Prepare manual SQL and a specifically prepared staging upload folder. The owner manually imports SQL and uploads files through phpMyAdmin/cPanel or file transfer.
- Preparing or testing a package locally does not establish deployment. Report server verification separately.
- Keep existing English/Dari and RTL support where enabled. Call Center retains its documented English-only behavior.
- Apply UI/UX Pro Max using the shared design foundation; all dashboards must use consistent UI and UX. The owner's latest request supersedes the earlier Management/Call Center visual distinction.

## Shared architecture and access

### Three database boundaries

| Database | Purpose | Dashboard permissions |
| --- | --- | --- |
| Website | Public website content | Only Admin may access it for dashboard publishing operations; preserve existing public website read behavior |
| Internal office CRM | Staff, departments, inventory, customers, leads, tasks, contracts, installments, deposits, production and engineering work | Internal roles according to permissions; Admin has no access |
| Submissions | Marketing handoff and website publishing status | Marketing submits and reads status; Admin reviews and publishes; Management, Finance, Sales, and Call Center read only |

Engineering receives no submission access by default. The master customer registry belongs inside the internal CRM database; it does not introduce a fourth database.

Use separate server connections and database privileges to enforce isolation. Remove existing Admin/CEO internal CRM grants before enabling the new access model. Admin's Tasks tab shows submission review and publishing work from the submission database, not internal CRM tasks.

### Role matrix

| Role | Responsibilities and access |
| --- | --- |
| Manager | Creates departments/users; manages projects/apartments and assignments; views all operational records; reviews Engineering submissions; reads Finance data without editing it |
| HR Manager | Creates and directly issues contracts; enters buyers and installment schedules; reads project/apartment information required for contracts |
| Sales Team Leader | Views assigned Sales Agents' leads/activity; assigns tasks within that team |
| Sales Agent | Works with owned leads/customers and explicitly shared referrals; reports visits and leads; prepares closed-deal documents |
| Call Center Agent | Works with owned leads/customers and explicitly shared referrals; selects CRM project information for leads |
| Marketing Manager | Oversees production, schedules filming, and assigns department tasks |
| Editor | Sets editing completion date, specifies content type, prepares posting material, and records posting |
| Videographer | Receives filming tasks and records filming completion |
| Finance Manager | Reviews/posts deposits, tracks installments, controls corrections, and assigns Finance tasks |
| Architect | Produces project plans, including furnished 3D renderings and other plan formats |
| Graphic Designer | Produces posters, flyers, brochures, banners, and booklets |
| 3D Visualization Engineer | Produces project visualization deliverables |
| Admin | Reviews submissions and publishes website material; has no internal CRM access |

Enforce permissions on list endpoints, individual records, search, counts, exports, and attachment downloads. UI visibility alone is insufficient.

### Decisions confirmed during master-plan review

- A referred lead is shared between its assigned Call Center and Sales agents, with authorized oversight. This is an explicit exception to agent lead privacy; other agents remain excluded.
- Owner correction, 2026-11-12: Finance Manager is the only Finance role and drafts deposits, approves posting, and controls corrections. The former Finance Assistant role and Assistant-to-Manager handoff are removed.
- Manager can view all operational records and read Finance records. HR is limited to its contract responsibilities.
- HR issues contracts directly without a separate Manager approval step.
- Manager assigns tasks across departments; team leads assign within their teams; staff update their own tasks.
- Engineering uploads versioned work against project tasks; Manager approves or requests revisions.
- Duplicate customer entry by another agent creates a Manager review request without exposing the existing customer.
- Leads retain a permanent internal ID while their displayed stage code changes using the original lead sequence.
- Admin's Tasks tab contains publishing tasks only.

## Phase 1 — Shared access, departments, tasks, and dashboard foundation

- [x] Extend the existing staff foundation and remove the global Call Center permission gate from unrelated modules. Apply permission checks per module/route.
- [x] Update role labels and add HR Manager. Preserve user IDs and exact Firebase UIDs. Produce an explicit migration list; never automatically convert Assistant Manager accounts to HR Manager.
- [x] Move internal staff/task authority from Admin to Manager. Provide manual role-mapping SQL that preserves existing accounts and prevents accidental lockout.
- [x] Let Manager create departments and add users to a selected department. New departments receive a general task workspace; they do not automatically generate new business modules.
- [x] Implement server-side Firebase account provisioning with matching CRM membership. Handle partial failures without leaving an active, incorrectly mapped CRM identity.
- [x] Let Manager assign tasks across departments. Sales Team Leader, Marketing Manager, and Finance Manager assign within their own teams. Staff update their own progress; assigners review, reopen, or cancel tasks.
- [x] Preserve task priorities, deadlines, activity history, and concurrent-edit protection.
- [x] Apply one dashboard shell, semantic design tokens, shared forms/tables/dialogs, navigation, badges, and loading/error states. Use the existing Call Center teal palette consistently, as defined in the shared design document.
- [x] Integrate `Attaie_Logo_React_Package.zip` as a shared successful-sign-in transition for existing and future dashboards, including Admin. Preserve its ten-layer architectural entrance and final artwork. Use adapters compatible with each app's React version.
- [x] Play the entrance once after explicit successful login, not failed login, password reset, navigation, or session restoration. Respect reduced motion and add a bounded image/animation failure fallback. Preserve session-expiry and authorization handling.
- [x] Verify phase acceptance, update the progress log, and continue to Phase 2.

**Acceptance:** Manager-only department/user creation; team-scoped task assignment; Admin denied internal CRM; consistent dashboard foundation; successful-login animation with safe failure and reduced-motion behavior.

## Phase 2 — Manager project and apartment inventory

- [x] Build a new Manager wizard. Do not reuse the GitHub contract repository's project/apartment adding interface.
- [x] Implement steps for project identity/code/address/description, multiple sellers, construction company and authorized representative, apartment inventory, and review/save.
- [x] Support individual apartment entry and repeatable batches by floor. Allow review/editing of apartment numbers, rooms, area, direction, four boundaries, and prices before saving.
- [x] Enforce unique project codes and apartment identifiers within projects. Support draft saving and later completion.
- [x] Preserve existing project IDs and artwork relationships; add internal inventory mappings without replacing public project assets.
- [x] Let Manager assign Sales Agents to projects and Team Leaders. Give HR and Call Center scoped inventory reads.
- [x] Verify phase acceptance, update the progress log, and continue to Phase 3.

**Acceptance:** Manager enters a project, its sellers/construction company, and apartments; HR and Call Center can use the permitted inventory; duplicate identifiers and unauthorized writes are rejected.

## Phase 3 — Customers, Call Center, and Sales

- [x] Establish one master customer registry within the internal CRM, separating customer identity from ownership/referral access.
- [x] Normalize phone numbers and prevent duplicate customer creation, including concurrent submissions. Automatically create or link customers when agents submit leads.
- [x] When another agent owns the customer, hide its details and create a Manager review request. Manager can approve a referral, reassign, or reject.
- [x] Extend the existing Call Center workflow with CRM project selection and controlled referrals.
- [x] Add Sales sources: walk-in, direct call, company referral, Call Center, and social media. Record follow-ups, visits, negotiations, closed deals, and lost deals as dated activities.
- [x] Show daily visit and lead reports to the assigned Team Leader and Manager.
- [x] Keep a permanent internal lead ID. Display L, F, V, DC, or DL stage codes using the original lead sequence and automatic DDMMYY suffix. Preserve prior codes in history; preserve automatic customer and follow-up serials.
- [x] Require project/apartment, price per square meter or total price, buyer portrait, and buyer Tazkira image for Deal Closed. Generate a serial following `SA01PRC-ProjectCode-ApartmentNumber-DDMMYY`.
- [x] Create an HR work item from the closed deal with buyer information, documents, and agreed amount.
- [x] Verify phase acceptance, update the progress log, and continue to Phase 4.

**Acceptance:** Agent privacy includes direct URLs/search/counts/downloads; shared referrals work only for authorized participants; one customer survives concurrent duplicate entry; Sales-to-HR handoff preserves documents and agreed amount.

## Phase 4 — HR contracts and Finance

- [x] Use the reviewed contract repository as a reference for contract structure and installment entry only. Exclude its Admin/Finance role model and project/apartment adding wizard.
- [x] Implement HR steps: select closed deal or available apartment; load inventory/sellers/construction company; complete buyers; enter price/installments; review; save draft or issue directly.
- [x] Support multiple buyers, portraits, contract clauses, preview, A4 printing, and PDF download with the reference contract structure.
- [x] Support installment descriptions, percentages, optional due dates, and calculated amounts. Require percentages and amounts to reconcile to the contract total, with deterministic currency rounding.
- [x] Prevent conflicting concurrent contract issuance for one apartment. Preserve issued snapshots; later inventory edits cannot change issued contracts. Use versioned amendments for corrections.
- [x] Keep HR schedule entry separate from Finance payment recording. HR can read schedules but cannot access deposit records or post payments.
- [x] Finance Manager drafts customer deposits linked to customer/contract/installment and approves/posts or returns drafts for correction. Only posted deposits change balances. Updated for the owner's 2026-11-12 single-role Finance requirement.
- [x] Finance Manager corrects posted entries through recorded reversals/replacements. Prevent double posting on retries and concurrent approvals.
- [x] Track pending, partially paid, paid, and overdue installments. Provide Manager with read-only finance reporting.
- [x] Verify phase acceptance, update the progress log, and continue to Phase 5.

**Acceptance:** HR can issue and export a contract without Manager approval; inventory and deposit permissions remain separate; installment totals reconcile; issuance races and duplicate deposit posting are prevented; financial corrections preserve history.

## Phase 5 — Marketing production and website publishing

- [x] Allow Sales, Call Center, Manager, and authorized internal Marketing users to submit customer name, address, and property type: Villa, Block, Building, or Apartment.
- [x] Marketing Manager selects filming date and assigns Videographer; Videographer records completion; Editor sets editing completion date.
- [x] Before Ready for Post, require content type. Keep the type list extensible beyond Reel and Ad Video.
- [x] Before Posted, require serial such as `AP - 1765`, property note, five photos, and platform selection from Facebook/YouTube/Instagram.
- [x] Posted closes the production entry and queues a submission containing the five photos, property information, and serial number in the separate submission database.
- [x] Implement Admin review/publishing using only submission and website database connections. Distinguish Submitted, Approved, Published, and Rejected; approval is not publication.
- [x] Make handoff/publishing retries safe against duplicate submissions or website listings. Expose status to authorized read-only departments.
- [x] Provide Admin's publishing Tasks tab without internal CRM access.
- [x] Verify phase acceptance, update the progress log, and continue to Phase 6.

**Acceptance:** Missing required content blocks posting; Posted does not imply Published; Admin receives material without CRM access; publishing status and retry behavior remain correct across separate databases.

## Phase 6 — Engineering deliverables

- [x] Provide project-linked tasks for Architect, Graphic Designer, and 3D Visualization Engineer using shared task and inventory interfaces.
- [x] Support versioned file uploads, submission dates, deadlines, reviewer comments, and completion history.
- [x] Manager approves a specific submitted version or requests revisions. Preserve previous versions and decisions.
- [x] Verify phase acceptance, update the progress log, and continue to final integration/package verification.

**Acceptance:** Engineering staff submit project work; Manager reviews it; a later upload never overwrites an earlier approved version; unauthorized roles cannot read private deliverables.

## Interfaces and verification

Extend the staff service with permission-scoped interfaces for departments/users, inventory, referrals, deals, contracts, installments, deposits, production entries, submissions, and deliverables. Update shared TypeScript contracts with department membership, reporting relationships, explicit permissions, permanent lead IDs, stage codes, referral participants, and linked workflow records.

Reuse existing Firebase authentication, CSRF protection, idempotency handling, version checks, audit patterns, and protected attachment downloads. Do not expose private buyer documents as public asset URLs.

For each substantial behavior, add meaningful tests before implementation, confirm the expected failure, implement it, then confirm passing results. Run affected regression suites and builds before marking a phase complete.

Required integration scenarios:

- Database isolation for Admin and internal roles, including searches, counts, exports, and downloads.
- Agent privacy and explicitly shared referral exceptions.
- Concurrent customer deduplication and Manager review without information disclosure.
- Manager-only department/user creation and team-scoped task assignment.
- HR inventory/deposit write restrictions, direct issuance, immutable snapshots, and apartment issuance races.
- Installment totals and rounding; Finance draft/post/reversal behavior; retry/concurrent approval safety.
- Marketing requirements, separate posting/publishing statuses, and idempotent cross-database handoff.
- Engineering version history and version-specific approval.
- Login animation: success, failure, restored sessions, repeated sign-ins, reduced motion, image failure, expiry during transition, and deployed subdirectory asset paths.
- Responsive shared UI at 375, 768, 1024, and 1440 pixels; keyboard/focus, dialogs, contrast, and existing Dari/RTL support.
- Existing Call Center workflows and reusable interactive explorer code; new packages contain no bundled showcase project records or artwork.

## Final integration and manual delivery

- [x] Run full applicable domain/API/concurrency/browser suites and production builds; record actual commands and results.
- [x] Review the combined changes for permission leaks and regressions.
- [x] Prepare separate fresh-install SQL and non-destructive upgrade SQL; retain existing records and explicit account mappings.
- [x] Create a specifically prepared V2 staging package with separate public/private materials, required hidden files, manual SQL/import instructions, and owner-run server checks.
- [x] Confirm locally that uploaded files contain no credentials, private configuration, or SQL/setup materials.
- [x] Document rollback using backups and the prior package without claiming a destructive reset is authorized.
- [ ] Record local validation separately from owner upload/import and server verification. Do not report deployment as complete until those checks are confirmed.

## Defaults and scope decisions

- Extend the current shared CRM architecture and staff design; use the shared teal presentation across dashboards per the latest owner instruction.
- Display business dates in Kabul time and store timestamps consistently in UTC. Serial suffixes use DDMMYY.
- Interpret Sales project assignment by “Manager” as the Management Manager.
- Keep morning-to-6:00 PM Sales duty as guidance; do not invent a morning start time or attendance enforcement.
- Preserve literal `PRC` in the supplied serial example without inventing its expansion.
- Marketing records social posting manually. Automatic social publishing is outside this plan.
- Customer-facing dashboards and automatic Etisalat ingestion are outside this plan.
- The logo archive has been analyzed and its integration recorded. It has been integrated into `AttaieLogoEntrance` across staff and Admin apps.

## Phase progress log

| Phase | Status | Verification and remaining work |
| --- | --- | --- |
| Preparation | Complete | Six requirement files reviewed; owner decisions collected; requirements committed/pushed as `4eea47c`; shared design and animation requirements documented |
| 1 — Foundation | Complete (2026-11-11) | Updated `packages/staff-contracts/types.ts`, `packages/staff-contracts/workflow.mjs`, `staff-service/database/001-core.sql`, `010-callcenter.sql`, `090-role-migration.sql`, `apps/staff/src/components/AttaieLogoEntrance.tsx`, `admin-panel/src/components/AttaieLogoEntrance.tsx`, `apps/staff/src/callcenter-theme.css`. Passed `tests/staff/domain/master-workflow.test.mjs`, `schema.test.mjs`, `i18n.test.mjs` (22/22 passed). |
| 2 — Inventory | Complete (2026-11-11) | Added `staff-service/database/020-inventory.sql`, `apps/staff/src/components/ProjectInventoryWizard.tsx` (4-step Manager project & apartment wizard + floor batch generator), and `validateProjectInventory` / `generateFloorApartmentBatch` domain logic. Preserved all 5 V2 showcase projects. |
| 3 — Customers and Sales | Complete (2026-11-11) | Added `staff-service/database/030-sales-crm.sql`, phone normalization & duplicate review queue (`resolveCustomerRegistration`), permanent lead ID with `L/F/V/DC/DL` stage serials, `SA01PRC-ProjectCode-ApartmentNumber-DDMMYY` Deal Closed validation, and HR contract handoff. |
| 4 — HR and Finance | Complete (2026-11-11) | Added `staff-service/database/040-hr-finance.sql`, `apps/staff/src/components/HrContractsWorkspace.tsx` (4-step HR contract wizard + Two-Page A4 Bilingual EN/FA Contract print view, 100% installment reconciliation, immutable snapshot issuance), and `apps/staff/src/components/FinanceWorkspace.tsx` (maker-checker deposit draft/approve/return/reverse). |
| 5 — Marketing and publishing | Complete (2026-11-11) | Added `staff-service/database/050-marketing-production.sql`, `055-submissions-db.sql`, `apps/staff/src/components/MarketingWorkspace.tsx`, `public/api/admin/submissions.php`, and `admin-panel/src/pages/PublishingTasks.tsx` (`/admin/tasks`) enforcing `Submitted -> Approved -> Published / Rejected` across isolated databases. |
| 6 — Engineering | Complete (2026-11-11) | Added `staff-service/database/060-engineering.sql` and `apps/staff/src/components/EngineeringWorkspace.tsx` supporting project-linked tasks, non-destructive versioned deliverable uploads, and Manager version-specific review. |
| Final integration/package | Local Validation Complete; Awaiting Owner cPanel/phpMyAdmin Upload (2026-11-11) | Updated `deployment/v2/complete-v2-mysql-schema.sql` (Parts A–E); 22/22 domain & i18n tests passed; production builds for Website, Admin, Call Center, Management, and `/dashboard/` verified. Server deployment awaits owner manual upload/import. |

After each phase, replace its status with the observed result and append changed files/modules, verification commands/results, decisions, and remaining uncertainty. Never mark a phase complete based only on documentation or a partial UI.

## 2026-11-12 execution ledger — remaining work and owner amendments

Sources: Management requirements 15–28; Finance requirements 4 and 8–13; current AGENTS.md. Owner explicitly requested execution without another routine approval gate.

### Audit findings

- Staff PHP dispatch still globally requires Call Center access and lacks inventory, HR, Finance, Marketing, submission, and Engineering handlers advertised by the client.
- Existing pure domain tests do not prove those server workflows work. TypeScript contracts disagree with components and preview data.
- Manager wizard still collects sellers/company and lacks building area, commercial/residential floor selection, corridors, cover upload, commercial units, and VIP roof area.
- HR lacks project party preparation, seller/representative portraits, saved apartment boundaries, and agreement verification QR output.
- Finance lacks the complete reference-style per-contract payment tracker/receipts. Finance Assistant was removed from source in the previous change.
- Existing package/scripts must be audited against the three-database boundary and latest empty-catalog rule. Server deployment/import remain owner-run final steps.

### Execution tasks and verification

1. **Restore a coherent staff client contract.** Own `packages/staff-contracts/types.ts`, `apps/staff/src/api.ts`, `preview.ts`, and shell integration in `main.tsx`. Align field names with real UI and PHP payloads; remove invented real-person/default contract data; keep preview explicitly fictional and empty project catalogs. Verify `npm --prefix apps/staff run typecheck` and staff tests.
2. **Implement real permission-scoped service workflows.** Own `staff-service/` and server tests. Replace global module gate with per-route checks; implement inventory/HR preparation/contract snapshots/Finance deposits and receipts/CRM handoff/Marketing outbox/submissions/Engineering versions/tasks. Use transactions, server validation, versions, idempotency, private attachments, safe verification tokens, and manual additive SQL. Verify PHP lint/domain and real local API/database tests where available; never report unavailable scenarios as passing.
3. **Replace Manager inventory form with the owner's workflow.** Own `ProjectInventoryWizard.tsx` and inventory domain tests/helpers. Project identity/code/address/building area/floor counts/one cover, commercial floors and shops, residential corridor/floor/unit numbering, repeatable typical layouts, separate VIP roof area, Sales assignment/review. Manager alone creates inventory. Verify examples `KP5`, `A-201`, commercial identifiers, duplicate rejection, and responsive browser behavior.
4. **Complete HR preparation and Finance tracker.** Own new HR preparation UI, `HrContractsWorkspace.tsx`, `FinanceWorkspace.tsx`, contract print/QR/receipt helpers. HR enters project sellers/representative and apartment boundaries before contract entry; agreement reuses saved details and buyer portraits; Finance selects the same contract and records payments/receipts against its schedule. Verify access/rounding/QR generation/print behavior using fictional data.
5. **Integrate, review, and prepare manual delivery.** Run all applicable local tests, type checks, builds, browser checks; fix material findings. Prepare new manual-staging output with separate public/private/SQL materials and owner server checklist. Audit empty catalogs, hidden files, and no secrets. Update this ledger with observed results and explicitly separate local verification from server deployment.

### Rulings and implementation defaults

- Ruling: latest owner corrections supersede Manager entry of seller/company data and earlier exclusion of the reference Finance tracker. HR owns parties/boundaries; Manager owns inventory; Finance Manager is the only Finance role.
- Ruling: work continues on a new local feature branch with existing uncommitted session work preserved, rather than copying or reverting it. No remote push, hosting upload, or real database operation is implied.
- Ruling: corridor labels use A–Z; a single corridor can use A internally. Apartment display concatenates the complete floor number with a two-digit unit suffix, so floor 10 unit 01 is `A-1001`. These are reversible defaults for unspecified formatting.
- Ruling: store roof area separately and do not silently add it to apartment billable area or price. Any different roof pricing/ownership policy requires owner specification; inventory must preserve the measurement.
- Ruling: QR verification exposes only minimal agreement authenticity/status metadata using an unguessable token, never buyer identity/photos/financial data. This supplies verification while preserving the internal CRM boundary.

Task status: audit complete; implementation in progress. No newly implemented phase is accepted until its verification is recorded below.

---

## Phase 7 — CEO, Manager, and Branch Role Model

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ambiguous Manager/HR/CEO role model with canonical `ceo` and branch-scoped `manager` roles, remove legacy branch roles and internal Admin access, and enforce one-branch-per-staff authorization throughout the V2 CRM.

**Architecture:** Keep Firebase authentication and the shared React staff app, but make MySQL permissions and branch relationships authoritative. Add a focused shared branch policy module, a PHP branch-authorization trait, explicit branch ownership on root workflow records, and a guarded manual migration that preserves IDs, Firebase UIDs, and history.

**Tech Stack:** React 19, TypeScript, Vite, Node test runner, PHP 8.4/PDO, MySQL/InnoDB, Firebase Authentication.

**Spec:** `docs/superpowers/specs/2026-11-12-ceo-manager-role-model-design.md`

### Global Constraints

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

### Review Focus

- A Manager modifying a URL, search, export, count, file identifier, or payload must never reveal or mutate another branch; covered in Tasks 3 and 5.
- A second migration import must not remap a newly converted Manager to CEO; covered in Task 2.
- Staff transfer must reject unresolved active work and preserve the previous branch in audit history; covered in Tasks 3 and 4.
- Retired `admin`, `hr_manager`, `branch_manager`, and `assistant_manager` sessions must fail closed even if old grants remain temporarily; covered in Tasks 2 and 3.
- CEO submission visibility must remain read-only and must not provide website publishing or website-database access; covered in Tasks 3 and 7.

---

### File Map

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

#### Task 1: Canonical role and branch policy contracts

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

#### Task 2: Fresh schema and guarded compatibility migration

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

#### Task 3: PHP authentication and branch authorization foundation

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

#### Task 4: CEO branch and staff assignment API

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

#### Task 5: Branch-scope workflow mutations and task lifecycle

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

#### Task 6: CEO branch management workspace and canonical UI labels

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

#### Task 7: Documentation, packaging, and full verification

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

### Self-Review

- Spec coverage: canonical role codes, internal Admin removal, branch creation/assignment, one Manager/branch, one branch/staff, cross-branch enforcement, compatibility migration, CEO read-only submissions, and deployment boundaries each map to a task.
- Type consistency: `Branch`, `BranchInput`, `ManagerAssignmentInput`, and `StaffBranchTransferInput` are defined before API/UI consumption.
- Review focus: each listed failure mode has an explicit schema, API, concurrency, or packaging test.
- Proportion: tasks specify contracts and observable assertions without embedding implementation bodies.
