# V2 website inquiries, publishing, and CRM lead boundaries

Date: 2026-11-13. Status: owner confirmed the scope in conversation; written design prepared for review. This document supersedes the earlier grilling answers wherever they would send website forms into staff CRM.

## Intent

Website Admin controls the public website, receives customer messages/forms, and manages their follow-up. Callcenter handles customer phone calls. Editors propose website listings through the separate submission database. Sales and Callcenter may create multiple leads for a customer only when the properties differ.

The deliverable is working V2 behavior, locally verified source, and a fresh manual staging package for `https://website.attaieproperties.com`. Preparing a package does not establish hosted readiness.

## Owner decisions

| Area | Required behavior |
| --- | --- |
| Website forms and messages | Delivered only to website Admin; no CRM ingestion, assignment, or staff follow-up task. |
| Admin access | Website Admin has no internal CRM access. Staff Admin (CEO) is a separate identity and role. |
| Calls | Customer calls go to Callcenter through the existing CTC PHP configuration. Website inquiry settings do not route calls. |
| Offline forms | Persist on the customer's device; automatically submit when connectivity returns with the website open, including after reopening. |
| Submission bill | A downloadable confirmation receipt, unique reference, and barcode after server-confirmed submission; no payment amount or claim of payment. |
| Inquiry follow-up | Managed only by website Admin in the website Admin panel. |
| Lead uniqueness | A customer can have several leads for different properties. A matching customer/property pair already in the database blocks another lead, across agents. |
| Website publication | After finishing the video, Editor selects exactly five photos and property details and sends them through database three to website Admin. |
| Rejection | Admin supplies a reason; Editor can correct and resubmit. Preserve review history. |
| Readiness | Allowed and denied direct API checks for every configured role; separate website Admin login; full hosted workflow checks after manual upload/import. |

Earlier proposed CRM inquiry routing, default recipients, CRM delivery retries, Manager routing, and immediate CRM follow-up are superseded. Website inquiries are not CRM customer/property leads; retry deduplication still applies to website submissions.

## Existing implementation and gaps

- `public/api/submit-lead.php` writes website `leads`; it has no durable request identifier or receipt. `public/api/admin/leads.php` permits GET only. Both `InquiryForm.tsx` and `ContactPage.tsx` submit through `src/lib/dbService.ts`.
- `src/lib/chatService.ts` can fall back to browser-local messages labeled sent after a failed request. It also makes a best-effort first-message copy into website leads. `public/chat-service.php` uses locked JSON storage; the current staging packager blocks that endpoint. Real Admin delivery must be verified across separate browser contexts.
- Staff leads live in `cc_leads`. Callcenter creates a call draft before knowing the customer/property; Sales creates a lead directly. Customer access uses normalized phone ownership and Manager-approved sharing. Lead creation currently lacks a customer/property uniqueness constraint, and Callcenter activation does not capture property identity.
- Editor production and `mkt_submission_outbox` already exist in `Completion.php`. Third-database `sub_posts` and website `website_submission_publications` provide isolated review/publication. The outbox currently inserts once and cannot replace rejected content for review.
- `admin-panel/src/pages/PublishingTasks.tsx` provides separate approval/publication actions. Preserve that workflow: approval authorizes publication; Admin completes existing verified listing fields before publishing.
- `scripts/package-dashboard-completion.mjs` rebuilds five surfaces and separates three database imports. It can currently build without a Firebase public key. Historical test evidence is not proof of this revised feature set.

## Approaches and selected direction

The owner's choices settle the architecture: keep website operations separate from staff CRM and use database three for Editor/Admin publication. Extending the existing boundaries is the selected approach. A shared CRM inbox would contradict the revised ownership decisions. Replacing all dashboards or authentication would add an unrelated migration.

Within this architecture, the following are implementation choices made for this design, rather than additional owner requirements:

- Persist form requests and confirmed receipts in IndexedDB. Use stable client request UUIDs and a server payload hash for retry safety.
- Encode the receipt's opaque reference as a Code 128 barcode. Offer a printable, downloadable HTML receipt using existing fonts; PDF generation is not required. Barcode scanning fills authenticated Admin search, rather than exposing customer information through a public lookup.
- Keep chat's existing locked-file storage for this scope, but locate it in the private V2 directory outside every document root. Reuse the website Admin session/bootstrap. No new CRM credential or third-database chat table is needed.
- Keep separate approval and publication controls. Use explicit submission revisions for corrections; preserve the existing production record and published property mapping.
- Treat duplicate CRM leads as matching across all statuses, including closed/lost. Reopening or referring an existing lead is separate from creating a duplicate.

## Data and access boundaries

| Runtime | Data access |
| --- | --- |
| Public website API | Website database for inquiries/receipts; private website chat storage; approved public listing data. |
| Website Admin | Website database, private website chat, and authorized review/publication records in submission database. No internal CRM credentials. |
| Staff API | Internal CRM plus authorized Editor submission writes/status reads in submission database. No website database credentials. |
| Third database | Publication payloads, five copied marketing photos, revisions, review events, and published property mapping only. No CRM buyer documents or staff customer history. |

Keep website Admin session authentication separate from Firebase staff authentication. A website Admin cookie must not authorize staff APIs; a Firebase staff session must not authorize website Admin APIs. Source role `admin` inside staff is not the website Admin account.

### Staff roles and department onboarding

Roles are persisted in internal CRM MySQL: `core_departments`, `core_roles`, `core_permissions`, and `core_role_permissions`. Employee `core_users.firebase_uid` maps Firebase identity to one `core_users.role`, optional explicit `department_code`, and optional `team_leader_id`. Firebase manages identity/password verification; MySQL is the application authorization authority. Website Admin is separate in website `admin_users`.

Deployment includes a manual onboarding guide and verified provisioning workflow. Bootstrap separate CEO and Manager Firebase identities and MySQL mappings. Current migration 100 reserves staff/department management for Manager; preserve that policy. Manager creates departments and operational employees after each employee is created in V2 Firebase and its exact UID/email is available. Department creation does not create an unrestricted custom role or grant permissions. Role selection, department assignment, Sales project/team assignments, and live allowed/denied login checks must each be explained and verified. Ordinary employees do not need cPanel, database service-user, or Firebase project IAM accounts.

## Website inquiry lifecycle

Persist a validated form payload and `clientRequestId` before the network attempt. States are `pending`, `sending`, `needs_attention`, and `confirmed`. If local persistence fails, retain entered fields and show an actionable error; do not claim the form was saved offline.

Submit on explicit send, application startup, and `online` events. Retry network failures and transient 5xx responses with bounded backoff while open; do not repeatedly retry validation failures or changed-payload conflicts. An `online` event is a retry trigger, not proof of connectivity. A closed browser has no delivery guarantee, and a first-ever visit cannot load an uncached site offline. This scope queues forms after the site has loaded; it does not add a service worker or offline page caching.

The server accepts a UUID request ID, validates the fields, and transactionally stores the website inquiry plus immutable receipt metadata. A retry of the same ID and payload returns the original receipt; a different payload with that ID returns 409. A lost response after commit must not create another inquiry. Legacy clients without an ID remain compatible, but cannot receive retry guarantees until upgraded.

Only a committed server response produces a receipt: opaque reference, server submission time, customer name, submitted property/context, and confirmation text. Do not place phone, email, message text, or sequential database IDs in the barcode. The reference does not authorize public access to inquiry details. Store confirmed receipts locally without retaining the entire pending payload. Never silently expire an unsent request. Provide pending retry/discard controls and downloadable receipts after reload.

Both public form entry points use the same queue. Chat remains a conversation in the Admin inbox, without also manufacturing a form inquiry from its first message. Chat messages have client message IDs, pending/confirmed state, and retry deduplication. Existing thread authorization and Admin-only actions must be enforced server-side. A local fallback is pending, not sent. A receipt belongs to a submitted form, not every individual chat message.

Website Admin can record inquiry status (`new`, `in_progress`, `resolved`), notes, and optional next follow-up time. Add version checks and audit events. Retain legacy stage/status data; use separate follow-up fields so an upgrade does not silently reinterpret historical records. Search includes receipt references and follows existing Admin access controls.

## CRM customer/property uniqueness

Use canonical CRM customer identity from the existing normalized-phone registry, preserving ownership/shared-access checks. A property reference is `{kind: 'project' | 'unit', id: number}`: unit IDs identify individual inventory apartments/commercial units; project references represent a project-level interest without a selected unit. Two different unit IDs in the same project are different properties. Project and unit references are distinct; selecting a unit on an existing project-level lead is an explicit property change and must recheck uniqueness.

Call drafts are call records pending qualification, not property-qualified active leads. They may exist without a property. Require a valid property reference on Callcenter activation and Sales creation. Do not block recording a genuine repeat phone call merely because its eventual customer/property lead already exists; refuse duplicate activation and retain the call draft/history. This preserves actual call records without allowing duplicate active property leads.

Add a claim table keyed by canonical customer ID, property kind, and property ID, pointing to the existing lead. Claim and lead mutation commit in one transaction. Enforce it for activation, direct creation, and property changes, across all agents and lead statuses. Race losers receive a generic 409 without leaking another agent's customer or lead details. Existing request idempotency returns the original result before evaluating a duplicate claim.

An upgrade preflight reports historical duplicate pairs and unresolved customer/property identities. Preserve all rows. Block enabling the new constraint until an owner-approved resolution identifies canonical records; never auto-merge or delete customers/leads. Legacy unqualified leads remain readable; they must be assigned a property before further qualification. No retrospective call count changes.

## Editor and Admin publication lifecycle

Use the existing production stages through completed editing. The assigned Editor can submit exactly five distinct, authorized photos and property details when the entry is ready; publication must not require social-media posting first. Preserve existing social posting functionality independently. Add an explicit `submit_website` action rather than using the meaning of `mark_posted` to imply website publication.

The durable internal outbox copies only selected publication data/photos into database three. Submitter attribution is the Editor, not automatically the original production requester. The stable identity is production entry ID plus revision number. A repeated delivery is a no-op for that revision. A rejected revision can be corrected and resubmitted as a new revision; it returns to `Submitted`, retains prior rejection reasons, and invalidates approval of older content. A retry of an old revision cannot overwrite newer content or reset `Published`.

Website Admin reviews only database-three content. Rejection requires a nonempty reason. Approval is bound to the current content revision. Publication rechecks revision, exactly five photos, verified price/listing type, and existing property mapping. Prevent duplicate public properties on retries and recover from a website commit followed by a failed submission-status update. Photos in rejected/unapproved revisions must not become anonymously accessible through predictable submission URLs. Published photos remain available through the existing public listing path.

Editors see their authorized status, rejection reason, and revision history through the staff API; they cannot publish. Website Admin never reads internal production tables. Approved already-published listings retain the existing Admin edit flow; a new editing/reapproval product is outside this scope.

## Verification and delivery

Use fictional fixtures in isolated local databases. Test both website form entry points, offline/reopen recovery, ambiguous network responses, barcode decoding/reference search, Admin follow-up, and customer/Admin chat across separate contexts. Test duplicate leads across agents, statuses, phone formats, and concurrent requests while preserving ownership protections. Test Editor rejection/correction/resubmission, stale approvals, retry recovery, and five-photo privacy.

Build a permission matrix from current configured staff roles and grants, not an assumed role list. Test allowed and denied routes plus foreign-record access, inactive users, anonymous requests, CSRF, and both authentication boundaries. Custom roles need hosted acceptance entries as well. Mock Firebase tests prove contracts only; real V2 Firebase sign-in/UID/domain checks remain a hosted gate.

Rebuild public website, `/admin/`, `/dashboard/`, `/management/`, and `/callcenter/` into a new manual staging directory. Require Firebase configuration, no bundled projects/units/artwork, hidden routing files, private configuration outside all roots, and separate fresh/upgrade SQL. Package chat explicitly with private storage configuration; keep unrelated AI chat blocked. Leave chargeable CTC disabled in test packages; verify configuration and simulated calls locally. A real provider call, if later requested, must target V2 and be recorded separately from mocked evidence.

Owner manually uploads ZIP contents and imports SQL through phpMyAdmin after checking the V2 target. Fresh schemas apply only to new empty V2 databases; upgrades preserve existing V2 records/uploads/configuration. Record import, live authentication, routing, role-denial, workflow, responsive/RTL, and receipt results. Server verification flags remain false until those observations exist. V1 source/deployment/database are outside this work.

The implementation handoff must include `docs/staff/v2-cpanel-database-user-setup.md` outside public upload roots. It gives ordered cPanel instructions for the isolated domain, certificate/HTTPS and per-domain PHP, three database creation/imports, scoped application service users, private configuration/session/chat paths, exact UID bootstrap mappings, separate website Admin password hash generated locally, department onboarding, and hosted acceptance/rollback. Provide a private local prompt-based hash helper; do not require cPanel Terminal, plaintext SQL passwords, or a public hashing page. Record actual hosting values privately rather than filling unknown paths/credentials into source.

## Non-goals and handoff

No website inquiry CRM bridge, default inquiry agent, payment receipt, SMS/email delivery, Firebase migration for website Admin, automated cPanel installer, guaranteed closed-browser submission, public inquiry lookup, V1 deployment, or database reset.

Execution is divided into independently testable plans: website inquiries/messages; CRM lead uniqueness; Editor publication revisions; and final acceptance/staging. The implementation may settle internal names, storage indexing, and UI placement within the existing EN/FA, RTL, accessible design. Review the written design and plans before product code changes.
