# Dashboard Catalog Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Do not delegate unless requested by the owner. Track steps using checkboxes.

**Goal:** Let staff dashboards browse available properties and projects while only authorized property administrators can change listings.

**Architecture:** Keep the website catalog and staff operational records in separate databases. Staff browsers consume existing public listing GET contracts through a dedicated read-only client; the staff backend has no catalog database connection or listing mutation routes. Existing property administration remains the sole listing writer.

**Tech Stack:** Existing React/TypeScript/Vite staff application, existing PHP listing GET APIs, separate PHP/MySQL staff service. No authentication provider migration or dependency upgrades.

**Spec:** Owner's 2026-11-10 requirement: website database serves properties/projects; only admin can write; other dashboards read available properties/projects. Supplements `../specs/2026-11-10-call-center-dashboard-design.md` and the existing staff implementation plan.

## Global Constraints

- Preserve protected V1 deployment, database, database grants, endpoints, helpers, authentication, and configuration. No production tests or deployment.
- Changes apply to the isolated V2 staff worktree at `C:/Users/RoheenAhmadi/.codex/worktrees/f277/WebsiteVersion2`, after checking its branch/status and local instructions.
- Preserve existing admin/public UX foundations, English/Dari, RTL, accessibility, and responsive behavior.
- Normal public visits must receive no new staff assets or staff requests.
- Staff operational writes belong only in the separate staff database. No catalog writes, cross-database foreign keys, or automatic availability changes after deal closure.
- Catalog read credentials, if provisioned for a future separate service, must have SELECT only. Never change V1 grants to implement this. Current staff integration uses HTTP GET and needs no catalog SQL credentials.
- Property administrator is an explicit permission. Management/CEO status alone does not grant listing write access. This is a conservative plan assumption pending owner correction.
- Firebase remains a discussion proposal. Keep current independent staff authentication for this increment. Sales dashboard remains deferred.
- Preserve all five projects and artwork mappings. Do not rebuild unrelated explorer work.
- Existing website inquiry/call operations remain unchanged. The owner's catalog requirement is not authorization to remove existing endpoints or move existing records.

## Current State and Scope

Existing staff core is recorded at commit `2de491a`, branch `feature/callcenter-dashboard`; verify current state before executing. It already has customers, leads, follow-ups, My Tasks, management assignments, and independent storage. Do not repeat completed work.

Existing listing contracts are in `src/lib/dbService.ts`; existing admin client is `admin-panel/src/api.ts`. Read their contracts without modifying frozen PHP. New staff code must not import the public React runtime or admin authentication/client.

This increment delivers catalog browsing in existing call-center and management surfaces. It does not implement a new catalog backend, new admin login, Firebase, sales UI, Etisalat capture, or property association on staff leads. A later association feature must use stable IDs and handle deleted listings without losing lead history.

## Review Focus

1. Crafted mutation requests from staff must not acquire admin authority: verify with isolated endpoint fixtures and staff route authorization.
2. Sold/unavailable listings and missing status values must not be presented as available: pin actual API semantics before filtering.
3. Listing errors must show retry states without breaking staff records or exposing server details.
4. Slow earlier requests must not overwrite a newer filter or navigation result.
5. Staff bundles, private config, and SQL must not leak into public website assets or upload directories.

## File Map

Paths below are relative to the implementation worktree. Proposed new filenames are intentional; inspect existing imports before integration.

- Create `apps/staff/src/catalog/types.ts`: minimal listing DTOs, derived from existing contracts.
- Create `apps/staff/src/catalog/client.ts`: GET-only catalog client, separate from staff sessions and admin APIs.
- Create `apps/staff/src/catalog/availability.ts`: explicit property/project availability rules.
- Create `apps/staff/src/catalog/CatalogPage.tsx`: shared read-only property/project browser.
- Modify `apps/staff/src/main.tsx`: role navigation/routes using the existing shell.
- Modify `apps/staff/src/i18n/` resources: add keys in the actual existing EN/FA resource files.
- Create `apps/staff/tests/catalog-client.test.mjs` and `apps/staff/tests/catalog-browser.spec.mjs`: focused client and browser checks following installed test tooling.
- Modify `docs/staff/implementation-verification.md`: observed results and remaining limitations.
- Create `docs/staff/catalog-access.md`: permission matrix, data ownership, and fixture verification commands.

## Task 1: Lock the Listing Access Contract

**Interfaces:** `PropertyListing` and `ProjectListing` retain existing numeric IDs and established status values. No inferred apartment inventory contract.

- [ ] Read actual list endpoints, public DTOs, admin authorization, staff routes, package scripts, and existing test fixtures. Read only; do not read secrets.
- [ ] Document endpoint paths, response envelope, publication exposure, status meanings, and project unit-count behavior in `docs/staff/catalog-access.md`.
- [ ] Establish availability from the current application: property status `available`; project eligibility must respect actual project status and available-unit rules. If these disagree, show status/count without claiming availability until resolved.
- [ ] Record a role matrix: public and staff read published catalog; property admin writes; management has no implicit listing writes.
- [ ] Check existing isolated V2 admin authorization rejects anonymous and ordinary staff requests. If it does not, stop this increment's release and report the frozen-backend constraint; frontend restrictions cannot fix it.

**Deliverable:** documented, verified contract. No database or backend changes.

## Task 2: Build the GET-only Catalog Client

**Interfaces:** `listProperties(signal?: AbortSignal): Promise<PropertyListing[]>`, `listProjects(signal?: AbortSignal): Promise<ProjectListing[]>`. Base URL uses a distinct staff catalog setting with same-origin `/api` default; no runtime arbitrary URL input.

- [ ] Add failing client tests for actual response envelopes, invalid data, non-2xx responses, cancellation, and missing status. Assert requests use GET and never attach staff tokens or admin credentials.
- [ ] Run the focused tests using existing test harness; record the exact command and expected failures.
- [ ] Implement DTO validation, explicit availability predicates, and GET requests in the new catalog modules. Use `credentials: 'omit'`; do not reuse the mutation-capable admin client.
- [ ] Run focused tests and staff typecheck. All assertions must pass, including no manufactured availability for unknown values.
- [ ] Commit only this task's files after reviewing the diff.

## Task 3: Add Catalog Browsing to Existing Staff Surfaces

**Interfaces:** `CatalogPage` consumes Task 2 functions. Use existing shell/routes and UI controls; read-only details contain no editing forms or mutation actions.

- [ ] Add failing browser checks for property/project lists, availability labels, empty/error/retry states, EN/FA/RTL, keyboard navigation, and delayed-response navigation races.
- [ ] Run focused browser checks against fictional local fixtures and confirm expected failures.
- [ ] Implement catalog tabs, existing-style cards/list rows, status and unit counts, and read-only detail navigation. Cancel or ignore obsolete requests on navigation/filter changes.
- [ ] Wire catalog navigation into call-center and management shells only. Add translated text to both existing language resources. Add no staff imports to public/admin applications.
- [ ] Run browser checks and role builds/typechecks. Verify the existing lead submission and My Tasks workflows still work with local staff fixtures.
- [ ] Commit only this task's files after reviewing the diff.

## Task 4: Verify Boundaries and Prepare Manual Testing Instructions

**Interfaces:** Existing isolated staff service and existing listing API contracts remain unchanged.

- [ ] Test anonymous/ordinary staff listing mutation attempts against isolated fixtures; expect rejection and unchanged fixture catalog records. Test management cannot gain property-admin access by altering frontend role state.
- [ ] Verify catalog browsing works without staff database access to catalog tables. Confirm staff configuration contains no catalog write credentials and service routes expose no catalog mutations.
- [ ] Build staff into a fresh output directory using existing package tooling. Inspect network activity: staff GETs only for catalog; no catalog mutations; public visit makes no staff requests.
- [ ] Compare protected PHP files to baseline and review the complete diff. No frozen backend changes are permitted.
- [ ] Prepare an updated manual testing package through existing staff packaging tooling. Verify only webroot contents are uploadable; SQL, credentials, private service/config stay outside webroot. Do not deploy.
- [ ] Update verification notes with exact commands, results, artifact path, and any unresolved hosting checks. Prior tests are historical evidence, not proof this increment passes.
- [ ] Commit the reviewed task files. Do not merge, push, or deploy without separate authorization.

## Deferred Decisions

- Firebase authentication requires a separate approved plan; it must not be silently introduced here.
- Sales UI remains excluded until the owner reopens its scope.
- If a separate V2 catalog service is later authorized, plan its SELECT-only reader and admin-only writer independently. Do not retrofit protected V1 credentials/endpoints.
- Automatic Etisalat ingestion still requires actual provider event samples and a safe independent integration.

## Completion Criteria

Call-center and management users can inspect available properties/projects with accurate labels. Staff cannot write catalog data through this integration or gain property-admin authority. Existing staff workflows pass isolated regression checks. Protected V1 resources remain unchanged. Hosting and owner upload checks remain explicitly unverified until performed.
