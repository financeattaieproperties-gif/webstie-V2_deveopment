# V2 All-Dashboards Deployment Readiness Design

**Date:** 2026-11-13

## Intent

Finish the existing Attaie Properties V2 staff-dashboard implementation and prepare a new manual testing-deployment package for `https://website.attaieproperties.com`. The package must include the public website, website Admin, and the shared staff dashboards required by the current role catalog. It must preserve the separate V2 environment and must not change or deploy V1.

Firebase Authentication owns staff credentials. A staff account must be created in Firebase first. Only the CEO may then provision the matching internal CRM profile using the exact Firebase UID and email. Managers cannot create users, assign roles, create branches, or transfer staff.

## Goals

- Complete the canonical `ceo` and branch-scoped `manager` implementation across PHP authorization, workflows, React UI, SQL, tests, and packaging.
- Make the shared `/dashboard/` build serve every active internal role with permission-specific navigation and workspaces.
- Retain `/management/` and `/callcenter/` as supported entry points into the same shared staff system.
- Include working Management, Sales, Call Center, contract management, Finance, Marketing/Production, and Engineering workflows already defined by the master dashboard requirements.
- Enforce branch scope on the server for lists, details, searches, counts, exports, mutations, rosters, and private files.
- Preserve English/Dari, RTL, accessibility, responsive behavior, and the established shared dashboard design.
- Produce fresh-install SQL, compatibility migrations, private configuration templates, public upload files, hashes/manifests, and manual cPanel/phpMyAdmin/Firebase instructions.
- Start fresh packages with empty project and unit catalogs and no bundled showcase artwork or preview records.

## Non-goals

- No live upload, SQL import, Firebase account creation, DNS change, or hosting mutation.
- No V1 files, credentials, APIs, document root, or database operations.
- No automatic Firebase user creation from V2. The CEO copies an already-created Firebase user's exact UID and email into V2.
- No Manager user provisioning or role management.
- No migration of the separate website Admin login to Firebase.
- No automatic Etisalat ingestion, AI service activation, or fabricated project-explorer geometry.
- No default credentials, staff accounts, projects, units, customer records, or private setup values in uploadable files.

## Constraints

- Use three separate V2 databases: website, internal CRM, and submissions.
- Website Admin may use website and submission publishing interfaces but cannot access internal CRM data.
- Internal staff may use authorized CRM and submission status interfaces but cannot access the website database.
- CEO is global. Every other active internal user belongs to exactly one active branch.
- Each active branch has exactly one active Manager. A Manager controls only one branch.
- Only CEO may create branches, assign Managers, provision staff profiles, change staff branch assignments, or deactivate staff.
- User provisioning order is mandatory: Firebase account first, then CEO maps exact UID/email/name/role/branch in V2 MySQL. Passwords never enter V2 SQL or uploaded files.
- Existing populated V2 installations require backups and compatibility migrations. Fresh SQL must never be imported over existing data.
- Owner performs deployment manually through cPanel/file transfer and phpMyAdmin.

## Requirements Authority

The authoritative functional baseline is `docs/superpowers/plans/2026-11-11-master-dashboard-implementation.md` together with its linked department requirement files. The later `docs/superpowers/specs/2026-11-12-ceo-manager-role-model-design.md` and `docs/superpowers/plans/2026-11-13-ceo-manager-branch-role-model.md` override older role names, staff-management permissions, and branch behavior. This design overrides older statements that a Manager or HR Manager may provision users. The repository `AGENTS.md` controls deployment and V2/V1 boundaries.

The active internal roles are `ceo`, `manager`, `callcenter`, `sales_leader`, `sales`, `marketing_manager`, `editor`, `videographer`, `finance_manager`, `architect`, `graphic_designer`, and `visual_designer_3d`. No other internal role may authenticate or be provisioned by the application.

## Approaches Considered

### 1. Shared role-aware dashboard — selected

Build one `/dashboard/` staff application. It renders only the modules allowed by the authenticated role and branch. Keep `/management/` and `/callcenter/` as compatible entry paths. This reuses the existing React staff app, shared design system, Firebase session flow, and PHP service while minimizing duplicated builds and inconsistent authorization.

### 2. Separate build and URL for every department

Create `/sales/`, `/finance/`, `/marketing/`, `/engineering/`, and other independent shells. This makes URLs explicit but duplicates routing, deployment checks, and UI maintenance without creating a security boundary. It is not selected.

### 3. Package the current repository without completing authorization

Build the existing files immediately. This is rejected because the source still contains stale retired-role checks, CEO-only policy is not consistently enforced, branch authorization is incomplete in PHP, and recent schema commits have not yet been integrated through all application layers.

## Access and Provisioning Model

- `ceo`: global operational oversight. Creates branches and assigns their Manager. Provisions all non-CEO internal staff profiles after Firebase creation. May create a Manager or ordinary operational role, but cannot create another CEO or website Admin through the dashboard.
- `manager`: one branch only. Performs the contract-management workflow assigned by the canonical role design. Cannot provision users, manage departments, create branches, transfer staff, or gain cross-branch access.
- Department managers and team leaders: assign tasks only within explicit role/team/branch permissions. They cannot provision accounts.
- Website `admin`: separate application identity. It is not an internal CRM role.
- Retired roles such as internal `admin`, `hr_manager`, `branch_manager`, `assistant_manager`, `production_manager`, `photographer`, and `finance_assistant` cannot be selected for new users or restore internal sessions.

The CEO provisioning form requires name, email, exact Firebase UID, active role, and active branch for every non-CEO account. The service validates role and branch, derives department from the role registry, prevents duplicate email/UID mappings, records an audit event, and never accepts a password.

For existing V2 data, the guarded role migration maps legacy top-level `manager` users to `ceo` and legacy `hr_manager` users to canonical `manager` only on its first successful run. It disables internal `admin`, `branch_manager`, and `assistant_manager` accounts, increments their authentication version, removes grants, and preserves their IDs, Firebase UIDs, and historical references. It never guesses missing branch assignments. Other retired roles remain inaccessible until the owner deliberately maps them to an active role and branch through a reviewed upgrade operation.

An inactive branch may exist without a Manager while the CEO completes setup. Activating a branch requires one active Manager assigned in the same transaction. Replacing or transferring the sole Manager is atomic: the CEO supplies the replacement in the same operation. If no replacement exists, the CEO must deactivate the branch first; affected staff cannot receive active scoped access until reassigned. Concurrency checks must prevent two Managers or two branches from claiming the same Manager.

## Submission and Publishing Boundary

- Marketing roles may create and update their authorized production records and submit completed publication material to the submissions database.
- CEO, Manager, Finance, Sales, and Call Center receive only the read/status access defined by the master requirements and their branch scope. They cannot approve, reject, publish, delete, or access website credentials.
- Website Admin may read submitted material, reject it with a reason, or use the idempotent `Approve & Publish` action. Website Admin cannot access internal CRM data.
- Only the website publishing service uses website database credentials. A submission becomes `Published` only after the website write succeeds and records the resulting website item ID. Failed publication remains retryable and must not create duplicates.
- No application role receives an unrestricted submission delete operation. Retention or destructive cleanup requires a separate reviewed maintenance scope.
- The internal CRM, submission, and website connections may use different MySQL hosts, database names, users, and passwords. Code must not assume cross-database transactions or fully qualified same-server tables. Cross-database handoffs use idempotent records and retryable state transitions.

## Dashboard Architecture

- Keep the existing React/Vite staff app and role-aware workspace components.
- Build `/dashboard/` as the canonical entry for all internal roles.
- Keep `/management/` and `/callcenter/` as distinct static entry shells built from the same source. They may guide navigation to the relevant initial workspace, but they cannot add permissions or bypass the authenticated role. Preserve independent asset bases and deep-link fallbacks for compatibility.
- Fetch session role, permissions, branch, and allowed modules from the PHP staff service. Do not rely on build-time route names for authorization.
- Use one shared navigation, form, table, dialog, badge, error, loading, focus, responsive, and print foundation.
- Hide unavailable modules in the UI and enforce the same restriction in PHP.
- Preserve noindex headers/meta and ensure public website visits load no staff assets or API requests.

## Backend and Database Completion

- Finish the canonical-role changes in `staff-service/src/App.php`, `Completion.php`, and a focused branch-authorization layer.
- Reject retired roles and non-CEO active accounts without a valid active branch during authentication and session restoration.
- Add CEO-only branch CRUD, Manager assignment, staff provisioning, staff branch transfer, and safe deactivation endpoints.
- Apply branch predicates and same-branch validation to all operational modules and protected downloads.
- Derive branch ownership server-side. Never trust a client-provided branch for operational records.
- Preserve optimistic versions, idempotency, audit records, immutable history, and transaction boundaries.
- Synchronize fresh SQL, guarded upgrade SQL, package SQL, and documented import order.

## Packaging and Manual Deployment

The final packager builds source fresh and creates a new uniquely named manual-staging folder. It must not copy repository-root `dist`, read `.env.local`, include real configuration, or reuse a stale release.

The release contains:

- `UPLOAD-WEBSITE-CONTENTS.zip` with public website, `/admin/`, `/dashboard/`, `/management/`, `/callcenter/`, PHP entrypoints, required hidden routing files, and no private material.
- `UPLOAD-PRIVATE-OUTSIDE-WEBROOT.zip` with the private staff service, private config templates, and private session directory structure.
- Separate fresh SQL for website, internal CRM, and submissions.
- Guarded upgrade SQL and an upgrade guide for existing V2 data.
- Firebase-first CEO provisioning template with no password.
- Manual setup, verification, rollback, and troubleshooting instructions.
- Manifest and archive hashes plus `BUILD-STATUS.json` stating that upload/import/server verification remain false.

## Verification

- Domain tests for canonical roles, CEO-only provisioning, task/workflow rules, and branch policy.
- Schema and migration tests, including repeat-import safety and preservation of IDs/Firebase UIDs.
- PHP/API tests for login/session rejection, permissions, branch isolation, direct identifiers, search/count/export, mutations, concurrency, and private downloads.
- Type checks and production builds for public, Admin, and all staff entry builds.
- Browser workflows for every active role, login/session expiry, responsive widths, keyboard/focus, English/Dari/RTL where supported, and print/export flows.
- Packaging checks for empty catalogs, hidden files, no preview code, no secrets/private SQL in webroot, manifest integrity, archive CRC/hash, and required files.
- Fresh fictional local database imports across all three databases and packaged endpoint smoke tests.

No local result proves deployment. Real Firebase login, Apache routing/headers, PHP extensions, private path permissions, database imports, browser workflows, and logs must be checked by the owner on the V2 testing host after manual upload.

## Remaining Builder Calls

- Choose narrow internal helper names and endpoint shapes consistent with the existing service.
- Reuse current dashboard components where their behavior matches requirements; remove or correct stale preview-only assumptions.
- Split tests into focused commands that fit the available local PHP/MySQL/browser tooling.
- Name the new release directory with a fresh timestamp and clearly mark every older package as superseded.
