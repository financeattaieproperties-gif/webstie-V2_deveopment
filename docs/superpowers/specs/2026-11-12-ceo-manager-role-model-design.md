# V2 CEO and Manager Role Model Design

**Date:** 2026-11-12

## Intent

Make the internal CRM role names and stored role codes match the owner's organization model before the V2 dashboards are deployed:

- `ceo` is the highest internal CRM role and replaces the current `manager` role.
- `manager` replaces the current `hr_manager` role and owns the contract-management workflow.
- Website `admin` remains a separate public-website identity with website and submission-publishing access only. It has no internal CRM membership or permissions.

The change must remain confined to Attaie Properties V2. It must not alter V1, deploy files, import SQL, or operate on a real database.

## Goals

- Use `ceo` and `manager` as the canonical internal role codes in source, SQL, API authorization, TypeScript contracts, UI labels, preview fixtures, tests, and documentation.
- Place both roles in the Management department.
- Give CEO the current Manager's internal authority: departments, staff, cross-department tasks, project and apartment inventory, duplicate-customer review, operational oversight, Engineering review, and read-only Finance visibility.
- Give Manager the current HR Manager's authority: project-party preparation, apartment boundaries, buyers, agreements, installment schedules, agreement printing/verification, and contract amendments.
- Keep Finance payment access separate from Manager contract access.
- Keep website Admin outside the internal CRM and preserve the three-database boundary.
- Remove ambiguous legacy internal roles and labels that could recreate a second CEO or an internal website Admin.
- Remove Branch Manager and Assistant Manager from the current V2 role model. Branch-specific access may be redesigned later as separate scope.
- Make branches first-class internal CRM boundaries created by CEO. CEO assigns one Manager and the branch's other staff.

## Non-goals

- Do not change the website Admin authentication system in this role rename.
- Do not grant CEO direct website-database access.
- Do not grant Manager CEO inventory, user-management, department-management, or cross-department oversight permissions.
- Do not change the functional contract, Finance, Sales, Marketing, Call Center, or Engineering workflows except where role checks and labels must follow the rename.
- Do not preserve the legacy Branch Manager or Assistant Manager role types. Branch responsibility belongs to the canonical `manager` role through branch assignment.
- Do not deploy, upload, import migrations, or modify V1.

## Approaches considered

### 1. Visible-label-only rename

Keep `manager` and `hr_manager` internally and display CEO and Manager in the UI. This minimizes migration risk but leaves authorization code, SQL, logs, and future maintenance using misleading names.

### 2. Canonical role-code rename — selected

Change the actual role model so `ceo` and `manager` mean what the organization calls them. This touches more source but eliminates the ambiguity before deployment. The owner selected this approach because this dashboard version has not been deployed.

## Canonical role model

| Stored role | Display name | Department | Internal CRM access |
| --- | --- | --- | --- |
| `ceo` | CEO | Management | Full operational oversight and current Manager authority |
| `manager` | Manager | Management | Contract preparation and issuance authority formerly assigned to HR Manager |
| `admin` | Website Admin | None in the internal CRM | No internal CRM account or permission grants |

The website Admin continues to use the separate Admin application and its own authentication and database connections. Submission review and website publishing remain in that application, not in the staff role registry.

Fresh internal CRM schemas do not register an `admin` role. A compatibility migration disables any legacy internal `admin` account, removes all of its CRM grants, and retains a permissionless role row only while historical foreign-key references require it. This does not change the separate website Admin account.

## Editor-to-website publishing handoff

- After the Editor posts the content to the selected social platform, the Editor prepares a publication-ready normal Property listing containing listing title, price, listing type (sale or rent), property type, address/location, description/details, and exactly five property photos.
- The Editor cannot submit an incomplete listing. Price must be positive, the listing/property types must be valid website values, text fields must meet server limits, and the five photos must pass the website image rules.
- The handoff writes to the separate submission database. It does not give Admin an internal CRM connection.
- Website Admin reads the submitted material from the submission database and reviews it in the separate Admin application.
- Admin receives one `Approve & Publish` action. Approval triggers automatic creation of a normal Property record through the website backend and website database; Admin does not re-enter the listing fields.
- Publication must be idempotent: retrying an approval or recovering from a timeout must not create a duplicate website item.
- A submission becomes `Published` only after the website database write succeeds. If approval succeeds but publication fails, the system preserves a retryable failure state and does not falsely report the item as published.
- The submission stores the resulting website record identifier and publication timestamp for traceability.
- Customer/owner identity may remain visible to authorized users in the submission review record but is never copied into the public Property listing.
- Admin may reject a submitted listing with a required reason. Rejection is terminal and the record becomes read-only; it is not returned to the Editor for editing or resubmission because the submission is created only after the social-media post is complete.

## Branch model

- CEO creates and updates internal CRM branch records with a unique code, name, address, phone, email, and active status.
- CEO assigns exactly one active Manager to each active branch.
- CEO assigns the branch's other staff members to that branch.
- CEO has cross-branch visibility and oversight.
- Manager is restricted to the Manager's assigned branch.
- Every active internal staff account except CEO belongs to exactly one active branch at a time.
- Only CEO may transfer staff between branches. Transfers are validated, auditable, and must explicitly resolve or reject incompatible active work rather than silently moving its ownership.
- Branch scoping applies on the server to list and detail endpoints, searches, counts, exports, task rosters, workflow mutations, and private attachment downloads. Hiding another branch in the UI is not sufficient.
- Projects belong to a branch. Downstream apartments, leads, customers, deals, contracts, installments, Finance entries, Marketing work, and Engineering deliverables inherit or validate the relevant branch relationship.
- Explicit cross-agent referral access does not bypass the branch boundary unless a future owner-approved cross-branch workflow defines it.
- Removing or changing a branch assignment must not orphan active tasks, leads, contracts, or audit history. Reassignment requires validation and an auditable event.

The existing `core_branches` and `core_users.branch_id` foundation will be extended. A dedicated branch-manager assignment relation enforces one active Manager per branch and prevents one Manager from controlling multiple branches. Operational tables receive an explicit `branch_id` where needed for efficient server authorization; the service validates that linked records agree on branch rather than trusting a client-supplied branch identifier. Existing local/testing records without a safe branch mapping are not guessed: the compatibility migration reports them for explicit assignment and prevents affected accounts from receiving scoped access until resolved.

## Authorization changes

- Replace every authorization check where `manager` means the current top-level operational role with `ceo`.
- Replace every authorization check where `hr_manager` means contract-management staff with `manager`.
- CEO may read all operational modules and Finance reporting but may not post or reverse Finance payments.
- CEO may read submission records and their Submitted, Approved, Published, or Rejected status. CEO cannot review, approve, reject, publish, or access the website database.
- Manager may read inventory needed for contracts, prepare sellers/representatives and apartment boundaries, issue/amend contracts, and manage installment schedules. Manager may not create project inventory, manage staff/departments, review Engineering versions, or access Finance deposits.
- Remove internal CRM permission grants for `admin`. Prefer omitting `admin` from fresh internal CRM role registration entirely.
- Eliminate the legacy duplicate internal CEO/Manager interpretation. UI helpers such as `isManagerRole` must be replaced with explicit capability or canonical-role checks.
- Remove `branch_manager` and `assistant_manager` from authorization helpers, staff creation, task assignment, previews, and operational permission grants.
- Replace their former purpose with branch-scoped access for the canonical `manager` role and branch membership for other staff.

## Fresh-install SQL

Fresh internal CRM schemas will:

- Register `ceo` and `manager` under the Management department.
- Omit `hr_manager` from new role registration.
- Omit internal `admin` unless a foreign-key compatibility reason requires a permissionless retired row.
- Omit `branch_manager` and `assistant_manager` from new role registration.
- Register branch tables/relationships with an enforced one-active-Manager-per-branch constraint.
- Assign former Manager permissions to `ceo`.
- Assign former HR Manager permissions to `manager`.
- Keep Finance Manager as the only Finance role.

No default users, Firebase UIDs, credentials, project records, or apartment records will be seeded.

## Compatibility migration

Although the dashboard is not deployed, source will provide an additive/manual migration for local or testing databases:

1. Back up and verify the selected V2 internal CRM database.
2. Ensure canonical `ceo` and `manager` role rows exist.
3. Map users currently assigned `manager` to `ceo`.
4. Map users currently assigned `hr_manager` to `manager`.
5. Move the canonical roles to the Management department and update their labels.
6. Rebuild their permission grants from an explicit allowlist rather than copying ambiguous legacy grants.
7. Remove `hr_manager` grants and remove its role row only when no remaining foreign-key references exist.
8. Remove all internal `admin` grants and disable or retire any internal `admin` membership without changing the separate website-admin account.
9. Remove grants for `branch_manager` and `assistant_manager`, disable any accounts assigned to those roles, and retain permissionless role rows only while historical foreign-key references require them. Do not automatically promote those accounts.
10. Preserve user IDs, Firebase UIDs, task history, contracts, audit records, and financial records.

The migration must be idempotent or explicitly guarded so a repeated manual import cannot swap roles twice.

## Application and UI changes

- Update shared TypeScript role unions and role labels.
- Update PHP role checks, task-assignment scope, workspace visibility, private attachment access, roster filtering, and module permissions.
- Update preview identities and fictional fixtures.
- Update navigation and page headings so CEO and Manager are consistently named.
- Update user-creation choices: CEO can create Manager accounts and ordinary operational staff. CEO cannot create another CEO through the dashboard; additional CEO identities require deliberate private Firebase/SQL provisioning. Manager cannot provision staff or privileged identities. Website Admin is never created through the internal CRM.
- Remove Branch Manager and Assistant Manager from all user-creation choices and dashboard navigation.
- Add CEO-only branch creation, Manager assignment, staff assignment, and safe reassignment controls.
- Show the active branch context in shared dashboard navigation and records; CEO receives an explicit all-branches or selected-branch context.
- Update English and Dari translations.
- Update dashboard requirements, the master plan, deployment instructions, and role documentation so “Manager” no longer refers to the CEO role and “HR Manager” is removed.

## Verification

- Add role-model tests that fail under the old mapping and pass under the new mapping.
- Verify CEO can perform former Manager actions and cannot publish to the website database.
- Verify Manager can perform former HR contract actions and cannot manage inventory, staff, departments, Engineering reviews, or Finance payments.
- Verify Website Admin cannot authenticate to or access the internal CRM.
- Verify retired Branch Manager and Assistant Manager accounts cannot sign in, restore sessions, receive new tasks, or regain permissions.
- Verify Manager cannot enumerate or access another branch through direct URLs, search, counts, exports, downloads, referrals, or modified request payloads.
- Verify CEO can work across branches and that exactly one active Manager is assigned to each active branch.
- Verify branch reassignment rejects or explicitly resolves active-work conflicts and preserves audit history.
- Verify task assignment, record lists, search, counts, exports, and private attachment downloads follow the same boundary.
- Verify the compatibility migration preserves user IDs/Firebase UIDs and is safe on a second run.
- Run staff domain tests, TypeScript typecheck/build, PHP 8.4 syntax checks, database/API authorization tests, and affected browser workflows before preparing a new manual-staging package.

## Delivery boundary

Implementation produces source changes, fresh SQL, upgrade SQL, tests, and updated manual instructions. It does not prove deployment. The owner must later import/upload to `https://website.attaieproperties.com` and confirm testing-server behavior before the dashboards are reported as installed or verified.
