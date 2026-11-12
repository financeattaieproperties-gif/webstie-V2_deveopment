# Attaie Properties V2 — Master Dashboard Implementation Plan

> For agentic workers: use `superpowers:executing-plans` to implement this plan task by task. Complete each phase, verify it, update this file's progress log, then continue to the next phase without requesting routine approval again.

**Goal:** Build one connected internal CRM covering Management, Sales, Call Center, HR, Finance, Marketing and Production, and Engineering, with consistent dashboard UI/UX and permission-scoped workflows.

**Architecture:** Extend the existing shared React staff application, Firebase authentication, PHP staff service, and MySQL module structure. Separate the website, internal CRM, and submission databases. Preserve existing V2 data and existing project IDs/artwork.

**Tech stack:** Existing React/TypeScript/Vite staff application, existing React Admin application, Firebase Authentication, PHP/PDO/MySQL, shared TypeScript contracts, existing automated tests. Preserve the separate React versions used by Admin and staff.

**Status:** Plan approved for phased implementation. Implementation is not complete. The baseline domain suite passed 14 tests before dashboard changes; the existing carousel regression test also passed. No dashboard phase has been completed or deployed.

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
- Preserve Kabul Plaza Saljuqi, Moon Residency, Kabul Plaza Burj, Kabul Plaza 12, and Kabul Plaza 09 (ABC), including their project IDs and interactive artwork mappings.
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
| Finance Assistant | Drafts deposits for Finance Manager review |
| Architect | Produces project plans, including furnished 3D renderings and other plan formats |
| Graphic Designer | Produces posters, flyers, brochures, banners, and booklets |
| 3D Visualization Engineer | Produces project visualization deliverables |
| Admin | Reviews submissions and publishes website material; has no internal CRM access |

Enforce permissions on list endpoints, individual records, search, counts, exports, and attachment downloads. UI visibility alone is insufficient.

### Decisions confirmed during master-plan review

- A referred lead is shared between its assigned Call Center and Sales agents, with authorized oversight. This is an explicit exception to agent lead privacy; other agents remain excluded.
- Finance Assistant drafts deposits; Finance Manager approves posting and controls corrections.
- Manager can view all operational records and read Finance records. HR is limited to its contract responsibilities.
- HR issues contracts directly without a separate Manager approval step.
- Manager assigns tasks across departments; team leads assign within their teams; staff update their own tasks.
- Engineering uploads versioned work against project tasks; Manager approves or requests revisions.
- Duplicate customer entry by another agent creates a Manager review request without exposing the existing customer.
- Leads retain a permanent internal ID while their displayed stage code changes using the original lead sequence.
- Admin's Tasks tab contains publishing tasks only.

## Phase 1 — Shared access, departments, tasks, and dashboard foundation

- [ ] Extend the existing staff foundation and remove the global Call Center permission gate from unrelated modules. Apply permission checks per module/route.
- [ ] Update role labels and add HR Manager. Preserve user IDs and exact Firebase UIDs. Produce an explicit migration list; never automatically convert Assistant Manager accounts to HR Manager.
- [ ] Move internal staff/task authority from Admin to Manager. Provide manual role-mapping SQL that preserves existing accounts and prevents accidental lockout.
- [ ] Let Manager create departments and add users to a selected department. New departments receive a general task workspace; they do not automatically generate new business modules.
- [ ] Implement server-side Firebase account provisioning with matching CRM membership. Handle partial failures without leaving an active, incorrectly mapped CRM identity.
- [ ] Let Manager assign tasks across departments. Sales Team Leader, Marketing Manager, and Finance Manager assign within their own teams. Staff update their own progress; assigners review, reopen, or cancel tasks.
- [ ] Preserve task priorities, deadlines, activity history, and concurrent-edit protection.
- [ ] Apply one dashboard shell, semantic design tokens, shared forms/tables/dialogs, navigation, badges, and loading/error states. Use the existing Call Center teal palette consistently, as defined in the shared design document.
- [ ] Integrate `Attaie_Logo_React_Package.zip` as a shared successful-sign-in transition for existing and future dashboards, including Admin. Preserve its ten-layer architectural entrance and final artwork. Use adapters compatible with each app's React version.
- [ ] Play the entrance once after explicit successful login, not failed login, password reset, navigation, or session restoration. Respect reduced motion and add a bounded image/animation failure fallback. Preserve session-expiry and authorization handling.
- [ ] Verify phase acceptance, update the progress log, and continue to Phase 2.

**Acceptance:** Manager-only department/user creation; team-scoped task assignment; Admin denied internal CRM; consistent dashboard foundation; successful-login animation with safe failure and reduced-motion behavior.

## Phase 2 — Manager project and apartment inventory

- [ ] Build a new Manager wizard. Do not reuse the GitHub contract repository's project/apartment adding interface.
- [ ] Implement steps for project identity/code/address/description, multiple sellers, construction company and authorized representative, apartment inventory, and review/save.
- [ ] Support individual apartment entry and repeatable batches by floor. Allow review/editing of apartment numbers, rooms, area, direction, four boundaries, and prices before saving.
- [ ] Enforce unique project codes and apartment identifiers within projects. Support draft saving and later completion.
- [ ] Preserve existing project IDs and artwork relationships; add internal inventory mappings without replacing public project assets.
- [ ] Let Manager assign Sales Agents to projects and Team Leaders. Give HR and Call Center scoped inventory reads.
- [ ] Verify phase acceptance, update the progress log, and continue to Phase 3.

**Acceptance:** Manager enters a project, its sellers/construction company, and apartments; HR and Call Center can use the permitted inventory; duplicate identifiers and unauthorized writes are rejected.

## Phase 3 — Customers, Call Center, and Sales

- [ ] Establish one master customer registry within the internal CRM, separating customer identity from ownership/referral access.
- [ ] Normalize phone numbers and prevent duplicate customer creation, including concurrent submissions. Automatically create or link customers when agents submit leads.
- [ ] When another agent owns the customer, hide its details and create a Manager review request. Manager can approve a referral, reassign, or reject.
- [ ] Extend the existing Call Center workflow with CRM project selection and controlled referrals.
- [ ] Add Sales sources: walk-in, direct call, company referral, Call Center, and social media. Record follow-ups, visits, negotiations, closed deals, and lost deals as dated activities.
- [ ] Show daily visit and lead reports to the assigned Team Leader and Manager.
- [ ] Keep a permanent internal lead ID. Display L, F, V, DC, or DL stage codes using the original lead sequence and automatic DDMMYY suffix. Preserve prior codes in history; preserve automatic customer and follow-up serials.
- [ ] Require project/apartment, price per square meter or total price, buyer portrait, and buyer Tazkira image for Deal Closed. Generate a serial following `SA01PRC-ProjectCode-ApartmentNumber-DDMMYY`.
- [ ] Create an HR work item from the closed deal with buyer information, documents, and agreed amount.
- [ ] Verify phase acceptance, update the progress log, and continue to Phase 4.

**Acceptance:** Agent privacy includes direct URLs/search/counts/downloads; shared referrals work only for authorized participants; one customer survives concurrent duplicate entry; Sales-to-HR handoff preserves documents and agreed amount.

## Phase 4 — HR contracts and Finance

- [ ] Use the reviewed contract repository as a reference for contract structure and installment entry only. Exclude its Admin/Finance role model and project/apartment adding wizard.
- [ ] Implement HR steps: select closed deal or available apartment; load inventory/sellers/construction company; complete buyers; enter price/installments; review; save draft or issue directly.
- [ ] Support multiple buyers, portraits, contract clauses, preview, A4 printing, and PDF download with the reference contract structure.
- [ ] Support installment descriptions, percentages, optional due dates, and calculated amounts. Require percentages and amounts to reconcile to the contract total, with deterministic currency rounding.
- [ ] Prevent conflicting concurrent contract issuance for one apartment. Preserve issued snapshots; later inventory edits cannot change issued contracts. Use versioned amendments for corrections.
- [ ] Keep HR schedule entry separate from Finance payment recording. HR can read schedules but cannot access deposit records or post payments.
- [ ] Finance Assistant drafts customer deposits linked to customer/contract/installment. Finance Manager approves/posts or returns drafts for correction. Only posted deposits change balances.
- [ ] Finance Manager corrects posted entries through recorded reversals/replacements. Prevent double posting on retries and concurrent approvals.
- [ ] Track pending, partially paid, paid, and overdue installments. Provide Manager with read-only finance reporting.
- [ ] Verify phase acceptance, update the progress log, and continue to Phase 5.

**Acceptance:** HR can issue and export a contract without Manager approval; inventory and deposit permissions remain separate; installment totals reconcile; issuance races and duplicate deposit posting are prevented; financial corrections preserve history.

## Phase 5 — Marketing production and website publishing

- [ ] Allow Sales, Call Center, Manager, and authorized internal Marketing users to submit customer name, address, and property type: Villa, Block, Building, or Apartment.
- [ ] Marketing Manager selects filming date and assigns Videographer; Videographer records completion; Editor sets editing completion date.
- [ ] Before Ready for Post, require content type. Keep the type list extensible beyond Reel and Ad Video.
- [ ] Before Posted, require serial such as `AP - 1765`, property note, five photos, and platform selection from Facebook/YouTube/Instagram.
- [ ] Posted closes the production entry and queues a submission containing the five photos, property information, and serial number in the separate submission database.
- [ ] Implement Admin review/publishing using only submission and website database connections. Distinguish Submitted, Approved, Published, and Rejected; approval is not publication.
- [ ] Make handoff/publishing retries safe against duplicate submissions or website listings. Expose status to authorized read-only departments.
- [ ] Provide Admin's publishing Tasks tab without internal CRM access.
- [ ] Verify phase acceptance, update the progress log, and continue to Phase 6.

**Acceptance:** Missing required content blocks posting; Posted does not imply Published; Admin receives material without CRM access; publishing status and retry behavior remain correct across separate databases.

## Phase 6 — Engineering deliverables

- [ ] Provide project-linked tasks for Architect, Graphic Designer, and 3D Visualization Engineer using shared task and inventory interfaces.
- [ ] Support versioned file uploads, submission dates, deadlines, reviewer comments, and completion history.
- [ ] Manager approves a specific submitted version or requests revisions. Preserve previous versions and decisions.
- [ ] Verify phase acceptance, update the progress log, and continue to final integration/package verification.

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
- Existing Call Center workflows, all five projects, and interactive explorer assets.

## Final integration and manual delivery

- [ ] Run full applicable domain/API/concurrency/browser suites and production builds; record actual commands and results.
- [ ] Review the combined changes for permission leaks and regressions.
- [ ] Prepare separate fresh-install SQL and non-destructive upgrade SQL; retain existing records and explicit account mappings.
- [ ] Create a specifically prepared V2 staging package with separate public/private materials, required hidden files, manual SQL/import instructions, and owner-run server checks.
- [ ] Confirm locally that uploaded files contain no credentials, private configuration, or SQL/setup materials.
- [ ] Document rollback using backups and the prior package without claiming a destructive reset is authorized.
- [ ] Record local validation separately from owner upload/import and server verification. Do not report deployment as complete until those checks are confirmed.

## Defaults and scope decisions

- Extend the current shared CRM architecture and staff design; use the shared teal presentation across dashboards per the latest owner instruction.
- Display business dates in Kabul time and store timestamps consistently in UTC. Serial suffixes use DDMMYY.
- Interpret Sales project assignment by “Manager” as the Management Manager.
- Keep morning-to-6:00 PM Sales duty as guidance; do not invent a morning start time or attendance enforcement.
- Preserve literal `PRC` in the supplied serial example without inventing its expansion.
- Marketing records social posting manually. Automatic social publishing is outside this plan.
- Customer-facing dashboards and automatic Etisalat ingestion are outside this plan.
- The logo archive has been analyzed and its integration recorded. It has not been integrated or visually verified yet.

## Phase progress log

| Phase | Status | Verification and remaining work |
| --- | --- | --- |
| Preparation | Complete | Six requirement files reviewed; owner decisions collected; requirements committed/pushed as `4eea47c`; shared design and animation requirements documented |
| 1 — Foundation | Not started | Baseline domain suite: 14 passed; no phase implementation verified |
| 2 — Inventory | Not started | New Manager wizard required |
| 3 — Customers and Sales | Not started | Privacy, referral, deduplication, and handoff implementation pending |
| 4 — HR and Finance | Not started | Contracts, installments, deposits, and concurrency verification pending |
| 5 — Marketing and publishing | Not started | Production workflow and isolated publishing handoff pending |
| 6 — Engineering | Not started | Versioned deliverables and review pending |
| Final integration/package | Not started | No server deployment or verification performed |

After each phase, replace its status with the observed result and append changed files/modules, verification commands/results, decisions, and remaining uncertainty. Never mark a phase complete based only on documentation or a partial UI.
