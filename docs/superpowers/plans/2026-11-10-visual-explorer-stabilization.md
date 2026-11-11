# Visual Explorer Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Use superpowers:subagent-driven-development only if the owner explicitly selects delegation. Steps use checkbox syntax for tracking.

**Goal:** Make the newly pulled explorer, visual administration, search, and manual testing packages reliable while preserving protected V1 behavior.

**Architecture:** Keep the existing React applications and PHP API contracts. Store visual presentation configuration in an isolated, validated JSON service; retain existing API data as the source for live inventory. Use one versioned showcase catalog for defaults, asset verification, and new-install testing imports, without writing to the production database.

**Tech Stack:** Existing React 19 public site, React 18 admin, TypeScript, Vite, i18next, Tailwind, existing animation libraries, isolated PHP file storage, PowerShell/Node packaging, and focused Node/PHP/browser tests.

**Spec:** The embedded design and acceptance criteria below implement the owner's November 10 request following review of commit `a220b7ab39657a7093b6e59405958eafcdcc3e03`. Read repository `AGENTS.md` and the existing explorer spec at `docs/superpowers/specs/2026-11-09-photo-apartment-explorer-design.md`; current protection rules override historical implementation instructions.

**Status:** Plan only. No implementation, deployment, database import, or production change is authorized by this document. Proposed details below are engineering recommendations for owner review, not previously approved product decisions.

## Global Constraints

- Preserve deployed V1 routes, authentication, integrations, user journeys, responsive behavior, accessibility, English/Dari, and RTL.
- Do not modify production MySQL data, schema, configuration, or indexes. Do not run migrations, imports, seeds, or test writes against production.
- Do not edit existing working PHP/API endpoints, helpers, authentication, routing, configuration, or dependencies that alter endpoint behavior, including `public/api/` and `backend-php/` if present.
- Treat `public/visual-config/` as the newly introduced, unreleased isolated capability covered by this plan. Confirm that status before changing it. If it is already a working protected service, stop that part and propose a separate service without changing it.
- Reuse V1 public blue/navy styling and existing admin gold/navy styling. Do not redesign either surface.
- Keep public React 19 and admin React 18 separated. Share framework-neutral contracts and pure data only.
- Do not read, print, commit, or package real credentials, `.env.local`, or real `public/api/db.php`. Use explicit fixture credentials in tests.
- Testing target is `https://website.attaieproperties.com`, its separate document root, and a new empty database only.
- Owner uploads the specifically prepared manual-staging `dist` contents, including hidden files, and imports SQL manually through phpMyAdmin. No automated installer or cPanel Terminal is required.
- Preserve all five project IDs: 1 Saljuqi, 2 Moon Residency, 3 Burj, 4 Kabul Plaza 12, 5 Kabul Plaza 09 (ABC).
- SQL, setup materials, and plaintext initial login details remain outside the uploaded web root. Initial administrator hash must be PHP-compatible.
- General feature work does not authorize production deployment. Prepare rollback and verify staging first; owner confirmation is required before claiming installation.
- Preserve unrelated local changes and untracked work. Commit only explicitly scoped files; do not use `git add .`.

## Review Focus

1. Missing or corrupt published JSON must preserve a usable page and never silently publish replacement defaults. Owned by Tasks 2–4.
2. Two administrators editing different projects must not overwrite one another's changes. Owned by Tasks 3–4.
3. Typical layouts must not become invented per-floor stock, prices, or availability. Owned by Tasks 1–2 and 6.
4. Narrow, tall, padded, or differently sized images must keep calibration coordinates aligned. Owned by Tasks 5–6.
5. A package must work from a fresh checkout without relying on untracked artwork or old `dist` output. Owned by Tasks 1 and 9.

## Embedded Design

### Scope and recommended approach

Implement this as ordered, independently verified work packages in the existing repository. Stabilize data and persistence first; then repair editing, rendering, search, and packaging. Keep the current UI structure.

Alternatives considered:

- **Recommended: isolated JSON service plus shared catalog.** Fits frozen APIs and database constraints; needs validation, conflict handling, and packaging support.
- **Browser-only visual configuration.** Useful for explicit local previews, but cannot publish durable configuration for other visitors. Retain only as clearly labeled preview/unsaved recovery.
- **Existing API/database expansion.** Would centralize records but violates the protection rules; excluded.

### Data ownership and truthfulness

- Visual configuration owns imagery, geometry, labels, lighting, plan pairs, and presentation metadata.
- Existing project/unit APIs remain authoritative for current inventory, price, status, and booking data.
- Link an apartment to an existing API unit using optional `inventoryUnitId: number`. Missing or unresolved links display translated “Layout preview” and omit live price/status claims.
- Restore the five-project showcase catalog from known local backups or Git history. Mark its content as showcase material; never imply that sample counts/prices are verified inventory.
- Preserve project IDs and exact asset mappings. Inspect image contents and dimensions before accepting the audit's floor or plan claims. Resolve conflicting floor definitions through evidence; mark unresolved mappings unavailable.
- Do not invent a technical masterplan where only furnished artwork exists. Support an explicitly missing comparison layer and render the verified single image.
- Make published payloads complete snapshots. Default fallback applies when the service is absent/uninitialized or the complete payload is invalid. Do not merge intentionally deleted published projects back into defaults.

### Storage and API contract

Retain `/visual-config/read.php` and `/visual-config/admin.php` for this isolated capability, subject to the unreleased-service check above.

- `GET read.php`: validated published `VisualConfig`, `404` when uninitialized, `503` for unreadable/corrupt state; ETag and cache metadata. Never expose drafts.
- `GET admin.php`: authenticated envelope `{ draft, publishedRevision, draftRevision, csrfToken }`; `draft` may be null before first initialization. Do not return an incomplete object masquerading as valid configuration.
- `PUT admin.php`: `{ config, expectedDraftRevision }`, with `X-Visual-CSRF-Token`; validate, compare revision under lock, save draft, return `{ success: true, revision }`.
- `POST admin.php`: `{ config, expectedPublishedRevision, expectedDraftRevision }`, same token; validate and compare both revisions under lock, publish the submitted validated snapshot and save its matching draft.
- Return `400` for invalid JSON, `401` for no admin session, `403` for failed token/origin checks, `409` for revision conflicts, `413` above 2 MiB, `422` for invalid schema, `500` for write failures, and `405` for unsupported methods.
- New service reuses the established session identity read-only. It issues its own session-scoped visual CSRF token; never changes frozen login/logout or shared helpers.
- Require authentication in every environment. Local tests establish fixture sessions instead of enabling localhost/development bypasses.
- Default requests are same-origin. Any Electron/cross-origin support requires explicit deployment configuration and a trusted origin allowlist; never reflect arbitrary credentialed origins.
- Storage location comes from server-only `VISUAL_CONFIG_STORAGE_DIR`, outside every document root. Require an absolute, writable, dedicated path; fail closed on missing configuration. No fallback to public storage.
- Use one store-wide lock for compare/read/backup/write, unique revision IDs, same-directory temporary files, verified writes, and rename-based replacement. Define success as published data durably replaced; report backup or persistence failures accurately.
- Keep revision snapshots private, newest 20 successful publications retained. Never delete the active published snapshot or files outside the configured storage directory.

### Validation rules

- Shared TS parser and PHP validator both enforce schema version 1, complete hero object, project ID/key agreement, unique floor and apartment IDs within their containing scope, finite numeric fields, positive floor numbers, and supported enums.
- Coordinates must be finite and within `[0,1]`; polygons require at least three distinct vertices and nonzero area. Bounds must remain inside the normalized image.
- Reject blank required imagery and unsafe URL schemes. Permit root-relative asset/upload URLs and HTTPS image URLs; reject `javascript:`, `data:`, traversal, and protocol-relative URLs.
- Limit payload to 2 MiB, projects to 100, floors to 100 per project, apartments to 100 per floor, polygons to 100 vertices, and user labels to 200 characters. Keep equivalent TS/PHP fixture tests.
- Optional images are explicitly null. Both comparison images must depict compatible registered framing before offering the reveal slider; otherwise show independent plan tabs or one verified image.

### UX and runtime behavior

- Separate “Save draft,” “Preview locally,” and “Publish.” Local recovery never produces a server-success message.
- Published configuration refreshes after 60 seconds on a subsequent request/navigation or tab focus. A temporary refresh failure retains the last validated configuration and retries later.
- Preview is explicit and opt-in, has a visible translated banner and Exit preview control, and is never written by Publish.
- Project changes reset floor/apartment navigation. Outdated fetches cannot install another project's state.
- Calibration and rendering use the same image content rectangle. Pointer coordinates exclude padding and letterboxing.
- Apartment polygons are calibrated on the floor masterplan, not the individual apartment image.
- Existing projects/units remain accessible even without valid visual configuration. API errors show retry/error UI; a successful empty API result stays empty rather than being replaced by fictitious records.
- Keep normal existing application operations intact. Test only with isolated data and blocked outbound integrations.

## File and Responsibility Map

| Files | Responsibility |
|---|---|
| `shared/visual-config.ts`, new `shared/visual-config-validation.ts` | Framework-neutral contracts and TS runtime parsing |
| New `shared/showcase-catalog.json` | Versioned five-project source data with provenance and preview labels |
| `src/lib/defaultVisualConfig.ts`, new `src/lib/showcaseCatalog.ts` | Verified defaults and typed public catalog adapter |
| New `scripts/verify-showcase-assets.mjs` | Asset existence, dimensions, hashes, and mapping verification |
| `public/assets/{kabul-plaza-saljuqi,moon-residency,kabul-plaza-burj,kabul-plaza-12,kabul-plaza-abc}/` | Restored version-controlled artwork |
| `public/visual-config/{admin.php,read.php,.htaccess}`, `lib/VisualConfigStore.php`, new `lib/VisualConfigValidator.php` | Isolated authenticated persistence and public reads |
| `admin-panel/src/visualConfigApi.ts` | Typed server calls, errors, revisions, explicit local recovery |
| `admin-panel/src/components/visual/{ExplorerEditor,ImageRegionEditor,LandingBackgroundSettings}.tsx` | Existing visual editing surfaces |
| New `admin-panel/src/components/visual/{FloorConfigForm,ApartmentConfigForm}.tsx` | Focused floor/apartment editing using admin conventions |
| `src/lib/{visualConfigService,explorerGeometry,dbService}.ts` | Public config caching, geometry, search fallback |
| `src/components/project/{PhotoApartmentExplorer,PhotoFloorSelector,FloorPlanSelector,PlanReveal,useExplorerNavigation}.tsx/ts` | Explorer navigation, interactions, aligned images |
| `src/components/project/ProjectUnitsSection.tsx`, `src/pages/{ProjectsPage,ProjectDetailPage}.tsx` | Preserve existing inventory and project journeys |
| `src/components/forms/SearchBar.tsx`, `src/i18n/locales/{en,fa}.json` | Search and translated public UI |
| `scripts/{package-frontend.ps1,package-staging.ps1,prepare-staging.mjs,prepare-manual-staging.php}` | Static-only release and manual test deployment |
| New `tests/visual-config/`, `tests/search/`, `tests/explorer/`, `tests/packaging/` | Focused regressions and browser acceptance |

Exact file splits may follow current conventions, but frozen backend files may not move or change. Introduce only the minimal test tooling needed for the behavioral regressions below.

## Execution Tasks

### Task 1: Protect baseline and recover the reproducible catalog

**Files:** New `shared/showcase-catalog.json`, `scripts/verify-showcase-assets.mjs`, `tests/visual-config/catalog.test.ts`; restore the five asset directories; update `docs/project-explorer/asset-audit.md`.

**Interfaces:** Catalog exports five fixed project IDs, original showcase layout records, image URLs, SHA-256 inventory, and provenance/verification flags. `verify-showcase-assets.mjs` exits nonzero for missing or mismatched assets.

- [ ] Record HEAD, Git status, protected-file hashes, and existing successful type/build checks without reading credential files.
- [ ] Preserve all local tracked/untracked edits outside the implementation branch; use an isolated worktree under the worktree skill. Transfer only reviewed required local scripts and artwork, retaining originals.
- [ ] Add a failing catalog test: IDs are exactly `[1,2,3,4,5]`, names match the owner-confirmed five projects, every referenced local image exists and hashes correctly.
- [ ] Recover original showcase records from `3baf781` and compare local backup artwork before restoring files. Preserve the original 25 showcase layouts as layouts, not 25 verified physical apartments.
- [ ] Create catalog provenance entries, inspect all mapped imagery, document unverified technical pairs and ambiguous floor numbering. No guessed availability, new floor counts, or fabricated plan layers.
- [ ] Run `node scripts/verify-showcase-assets.mjs`; expect zero missing/mismatched assets. Confirm all 98 recovered files are tracked in the scoped change.
- [ ] Commit only recovered assets, catalog, verifier, audit, and its test: `fix: restore reproducible five-project showcase assets`.

### Task 2: Define validated visual defaults and inventory linkage

**Files:** `shared/visual-config.ts`, new `shared/visual-config-validation.ts`, `src/lib/defaultVisualConfig.ts`, new `src/lib/showcaseCatalog.ts`, `tests/visual-config/schema.test.ts`.

**Interfaces:** `parseVisualConfig(input: unknown): VisualConfig` throws a typed validation error. Add optional `inventoryUnitId` and explicit missing plan-layer support. `DEFAULT_VISUAL_CONFIG` derives from reviewed catalog mappings, with a stable revision and timestamp.

- [ ] Add failing schema fixtures for malformed/missing hero, nonfinite coordinates, degenerate polygons, duplicate IDs, oversized collections, unsafe URLs, and project/key mismatch.
- [ ] Implement parser and documented limits. Parse every external payload; TypeScript casts alone are insufficient.
- [ ] Build defaults for all five projects using verified images. Where geometry is not calibrated, expose a translated list/plan fallback and suppress misleading photo hotspots.
- [ ] Add assertions that unlinked showcase layouts never display current inventory claims and that incomplete plan pairs do not enable a false comparison.
- [ ] Run focused schema/catalog tests; expect accepted valid fixtures and rejected invalid fixtures. Run public and admin type checks.
- [ ] Commit: `feat: validate visual configuration and preserve showcase defaults`.

### Task 3: Harden isolated persistence without touching frozen services

**Files:** Only unreleased `public/visual-config/` service files; new validator and `tests/visual-config/php-store.test.php`, `php-http.test.mjs`, shared JSON fixtures.

**Interfaces:** Implement the API/status contract in Embedded Design. Storage methods accept expected revisions and return typed conflict/storage outcomes; HTTP handlers map those outcomes without leaking filesystem paths.

- [ ] Confirm the isolated service is unreleased; stop its edits if evidence shows it is protected working infrastructure.
- [ ] Add failing PHP tests using a temporary private directory and fixture sessions: unauthenticated requests rejected even with localhost/development settings; invalid CSRF rejected; disallowed Origin rejected.
- [ ] Add schema parity fixtures and request-limit tests; reject invalid bodies before any draft/published change.
- [ ] Implement private storage configuration, schema validation, same-origin policy, token checks, method handling, ETags, and generic errors. Do not import database bootstrap code or change session/login behavior.
- [ ] Add store tests for stale draft/published revisions (`409`), two competing writers, write/rename failure, corrupt JSON, revision retention, and preserving last good published data after a failed write.
- [ ] Implement locking, unique revisions, checked writes, backups, and retention. Direct HTTP access to data/revisions must return `403` or `404` on the staging web server.
- [ ] Run `php -l` on changed isolated PHP files and `php tests/visual-config/php-store.test.php`; expect no syntax errors and all assertions pass. Run HTTP tests against a local fixture server only.
- [ ] Compare protected backend hashes to Task 1; expect identical hashes. Commit: `fix: secure isolated visual configuration persistence`.

### Task 4: Make administration truthful, conflict-aware, and recoverable

**Files:** `admin-panel/src/visualConfigApi.ts`, `ExplorerEditor.tsx`, `LandingBackgroundSettings.tsx`, `src/lib/visualConfigService.ts`, new `tests/visual-config/client.test.ts`.

**Interfaces:** `getConfig(): Promise<AdminVisualConfigState>` returns the server envelope. `saveDraft(config, expectedDraftRevision)` and `publish(config, expectedPublishedRevision, expectedDraftRevision)` throw typed errors on failure. Separate `saveLocalRecovery(config)` from server persistence; local data is never reported as published.

- [ ] Add failing client tests: `401`, `403`, `409`, `422`, `500`, offline, and HTML-instead-of-JSON all reject saves/publish; valid success updates revisions.
- [ ] Implement CSRF headers, runtime parsing, revision propagation, and error/status mapping. Do not silently replace an unavailable server draft with defaults before a publish.
- [ ] Show unsaved, locally recovered, server draft, and published states accurately. On conflict, retain edits and offer reload/reapply without automatic overwrite.
- [ ] Add explicit Preview locally / Exit preview controls. Publish must not set `attaie_visual_preview_config`; clear stale preview markers on explicit exit.
- [ ] Implement public config refresh after 60 seconds and on tab focus when stale; deduplicate requests and preserve last good data on transient failures. Keep intentional published deletions authoritative.
- [ ] Test missing service fallback, corrupt payload fallback, cache expiry, refresh recovery, explicit preview visibility, and failed publishing from both admin editors.
- [ ] Run focused client tests and both type checks. Commit: `fix: report visual publishing results accurately`.

### Task 5: Complete calibration and structural editing

**Files:** `ExplorerEditor.tsx`, `ImageRegionEditor.tsx`, new `FloorConfigForm.tsx`, `ApartmentConfigForm.tsx`, `src/lib/explorerGeometry.ts`, `tests/explorer/editor.test.tsx`.

**Interfaces:** `getImageContentRect(container, naturalWidth, naturalHeight, padding)` returns the actual rendered image rectangle. `clientPointToNormalized(point, imageRect)` returns a normalized point or null for outside-image input. Reuse these pure helpers in public rendering.

- [ ] Add failing editor tests: create floor and apartment from an empty project, edit/delete with explicit confirmation, and reject duplicate IDs/invalid polygons.
- [ ] Implement bilingual floor labels, floor groups/kinds, exterior image selection, masterplan/image pairs, apartment plan pairs, inventory unit linkage, polygon/anchor controls, and lighting polygon/color controls.
- [ ] Source selectable existing units from unchanged admin API reads. Never create/update inventory as a side effect of visual editing.
- [ ] Calibrate apartment footprints on `floor.masterplan` imagery. Keep apartment-specific technical/furnished plans for the apartment detail stage.
- [ ] Add image dimension loading and content-rectangle mapping. Reject clicks in padding; use pointer events for touch/mouse, suppress click-after-drag vertex creation, and release capture on cancel.
- [ ] Add a keyboard-accessible coordinate/list editing alternative. Keep unsaved calibration synchronized when reopening a selected floor or apartment.
- [ ] Run editor tests for portrait/landscape/square imagery at mobile and desktop sizes, then both type checks. Commit: `feat: complete visual explorer calibration controls`.

### Task 6: Repair public rendering and preserve project journeys

**Files:** Explorer components, `useExplorerNavigation.ts`, `src/pages/ProjectsPage.tsx`, `ProjectDetailPage.tsx`, `ProjectUnitsSection.tsx`, `projectExplorerUtils.ts`, `tests/explorer/navigation.test.tsx`, `geometry.test.ts`.

**Interfaces:** Public explorer consumes parsed visual configuration and read-only API unit data. Resolve live values by `inventoryUnitId`; unlinked layouts stay preview-only. Navigation resets whenever the project identity changes.

- [ ] Add failing tests for missing config, missing image layer, project switch during fetch, stale selected floor/apartment, deleted configured unit, and unavailable API data.
- [ ] Align exterior/floor SVG overlays with the same image content rectangle used by calibration. Apply consistent framing to comparison layers; use tabs when images cannot be registered accurately.
- [ ] Prevent reveal drag from triggering apartment selection; support touch, pointer cancel, keyboard arrows/Home/End, and reduced motion.
- [ ] Reset navigation on project changes; guard late responses. Treat absent floor/apartment references as a recoverable return to exterior/list.
- [ ] Preserve existing project detail, unit list, payment-plan, inquiry/contact, and deep-link behavior. Show accurate retry state for API failure and genuine empty state for a successful empty response.
- [ ] Use showcase previews only when explicitly labeled. Remove any generic cross-project artwork substitution that could imply the wrong project/unit plan.
- [ ] Verify all five project routes with isolated catalog/API fixtures, comparing restored V1 interactions to the baseline. Do not trigger real lead submission or click-to-call.
- [ ] Run geometry/navigation tests and build/type checks. Commit: `fix: align explorer rendering and preserve project navigation`.

### Task 7: Correct search contracts and request ordering

**Files:** `src/lib/dbService.ts`, `SearchBar.tsx`, new `tests/search/search-properties.test.ts`, `search-bar.test.tsx`; `vite.config.ts` only for mock parity.

**Interfaces:** Keep `searchProperties(query, { purpose, limit, signal }): Promise<GlobalSearchResponse>`. Buy maps to `listing_type === 'sale'`; Rent maps to `'rent'`; Commercial maps to `type === 'Commercial'`. Preserve actual frozen API behavior.

- [ ] Add failing fixtures for buy/rent/commercial, exact serial ranking, case-insensitive title/location, trimmed input, zero matches, and result limits.
- [ ] Inspect the frozen listing endpoint read-only to confirm whether its `search` filter includes serial numbers. If it excludes serials, fetch the complete read-only list for client matching; do not prefilter away valid serial matches or change PHP.
- [ ] Apply identical purpose filtering in mock and PHP fallback paths. Keep `/api/search` optional and fall back when unavailable or its response shape is invalid.
- [ ] Propagate cancellation through fallback requests using an optional backwards-compatible request-options parameter on `getProperties`; also guard UI results with a request generation ID.
- [ ] Test an older slow response arriving after a newer query, purpose change, clear input, and component unmount. Only the current request may change results/loading.
- [ ] Verify combobox active-option linkage, Enter/Escape/arrows, selection navigation, and submitted filter URL semantics.
- [ ] Run focused search tests and public type check. Commit: `fix: preserve search purpose and discard stale results`.

### Task 8: Finish localization, accessibility, and surface consistency

**Files:** Affected public explorer/search components, `src/i18n/locales/en.json`, `fa.json`, and affected visual admin components only.

**Interfaces:** All newly touched public copy uses existing `t()` conventions with matching EN/FA keys. Admin controls retain the current admin language conventions and gold/navy design; do not introduce a second framework.

- [ ] Audit new search/explorer/preview strings, fallback text, status labels, loading/error states, units, aria labels, and contact messages; add both locale entries.
- [ ] Replace physical left/right layout assumptions with direction-aware styles where required. Ensure reveal labels describe the actual image layer in each direction.
- [ ] Preserve existing fonts, focus rings, contrast, target sizes, reduced-motion rules, and responsive navigation. Do not change shared brand foundations.
- [ ] Check keyboard-only exterior/floor/unit selection and slider use; modal focus/escape/return if a modal is retained; programmatic error/status announcements.
- [ ] Browser-check English and Dari at widths 360, 768, and 1440 px with portrait/landscape plans. Expect no clipped controls, horizontal overflow, or displaced hotspots.
- [ ] Run locale-key parity and focused accessibility checks. Commit: `fix: complete bilingual explorer and search interactions`.

### Task 9: Repair fresh-checkout builds and manual staging packages

**Files:** Packaging scripts listed above, `scripts/generate-sitemap.mjs`, new `tests/packaging/package-contract.test.mjs`, `deployment/staging/README.md`, `DEPLOYMENT-READY.md` if present.

**Interfaces:** Packaging consumes `shared/showcase-catalog.json`, never regex/AST-extracted UI constants. Final output is `releases/manual-staging-<timestamp>/dist/` plus sibling SQL/private-login/setup instructions. Production static allowlist remains separate.

- [ ] Add failing package tests for missing catalog/artwork, omitted visual service, stale build output, PHP leaked into static-only release, and setup/login/SQL leaked into upload contents.
- [ ] Replace removed `FALLBACK_*` extraction with catalog consumption. Validate the five projects and original showcase layout counts `6,4,6,5,4` without claiming complete inventory.
- [ ] Include new isolated visual PHP/service files and required nested `.htaccess` in testing packages. Keep protected existing backend copies byte-identical; never include production configuration or mutable visual data in an upgrade archive.
- [ ] Document owner configuration of a private `VISUAL_CONFIG_STORAGE_DIR` outside document roots and required write permissions. No world-writable fallback and no public-data fallback.
- [ ] Preserve manual phpMyAdmin setup and PHP-compatible administrator hashing. Keep plaintext login details outside both uploaded files and SQL; never log the password in tool output.
- [ ] Require build provenance (source commit, dirty-state manifest, catalog hash, asset verification results) and reject accidental use of old repository-root `dist`.
- [ ] Keep test noindex rules and outbound click-to-call/AI blocking. Default package behavior must not overwrite existing private configuration on repeat uploads.
- [ ] Test sitemap generation against localhost fixtures, including unavailable API and explicit showcase policy; do not silently invent live project/inventory URLs or query production as part of tests.
- [ ] From a fresh isolated checkout, build both apps, generate the staging kit, then the manual folder. Inspect ZIP entries for hidden files, correct slash paths, all artwork, service files, and absence of secrets/setup materials inside `dist`.
- [ ] Run package tests and protected-file hash comparison. Commit: `fix: package complete isolated manual staging release`.

### Task 10: Integration evidence and owner handoff

**Files:** New `docs/project-explorer/2026-11-10-stabilization-verification.md`; deployment instructions updated only for observed results.

**Interfaces:** Verification report records source revision, commands/results, isolated environment, screenshots, package manifest/hash, known limitations, and rollback reference. A prepared package is not a deployed installation.

- [ ] Run public/admin type checks and Vite builds, focused Node/component tests, PHP syntax/store/HTTP tests, and package contract checks. Use current installed tooling; record exact commands and exit codes.
- [ ] Exercise isolated full flow: fixture login, draft edit, publish, separate visitor session read, cache refresh, conflict, rejected payload, failed write, reload, and explicit preview exit.
- [ ] Verify direct access to draft/revisions/private files is denied on a PHP/Apache staging-equivalent server. A Vite preview alone cannot establish PHP or `.htaccess` correctness.
- [ ] Confirm protected API/PHP hashes and production state remain untouched. Review scoped diff for accidental edits, secrets, invented inventory, and unrelated formatting.
- [ ] Record evidence for all five projects, English/Dari, RTL, mobile/desktop, search, existing unit/payment/contact journeys, and failure states.
- [ ] Prepare rollback: known-good static release, prior private visual published snapshot, matching manifests, and owner instructions. Rollback must not reset/overwrite production MySQL or frozen endpoints.
- [ ] Deliver exact manual upload folder, SQL location, private login-file location, checksum, and step order. Do not upload or import on the owner's behalf under this plan.
- [ ] After owner upload/import, request their server checks for login, five project routes, private-file denial, visual save/publish, and independent visitor read. Until then report “prepared and locally verified,” never “installed.”
- [ ] Commit verification documentation only after its claims match observed evidence.

## Test Tooling and Commands

At execution start, inventory existing test tools. For TS pure logic use a small Node test harness capable of loading TS; for React interactions use the smallest compatible component/browser setup available. If new dependencies are needed, add development-only dependencies, preserve public/admin React separation, and record the exact reproducible commands in `package.json` and the verification report.

Baseline commands already passed during review:

```powershell
npx tsc --noEmit
npx tsc --noEmit -p admin-panel/tsconfig.json
# Use fresh temporary output directories for review builds.
npx vite build --outDir <fresh-public-temp-directory>
npx vite build admin-panel --config admin-panel/vite.config.ts --outDir <fresh-admin-temp-directory>
```

Do not treat `npm run lint` as an independent ESLint audit: it currently runs TypeScript only. Do not run the full root build blindly: its sitemap step may read configured remote APIs and its admin build writes `public/admin`. Use local fixture API settings and isolated outputs during verification.

PHP was unavailable on PATH during review. Install/use a local PHP CLI or isolated runtime before marking PHP tasks verified; do not use a live production endpoint as a substitute. Read the applicable debugging, TDD, motion, UI, and verification skills when execution reaches their corresponding work.

## Dependencies and Delivery Gates

1. Task 1 establishes protected baseline and reproducible assets.
2. Task 2 establishes shared contracts; Task 3 implements matching persistence.
3. Task 4 integrates persistence. Tasks 5–6 complete editing/rendering against that contract.
4. Task 7 repairs search; Task 8 checks every touched public surface.
5. Task 9 packages the final result; Task 10 verifies and hands off.

No step authorizes production deployment. Stop on protected-resource conflicts, failed PHP checks, missing artwork, ambiguous inventory claims, or an unsafe package. Continue independent authorized work while documenting the specific blocker; do not weaken the constraints.

## Definition of Done

- [ ] Fresh checkout contains all five projects' required artwork and passes asset verification.
- [ ] Fresh isolated setup can create/edit/calibrate/publish usable visual configuration through the supplied admin UI.
- [ ] Server failures and conflicts are visible; local recovery is never called publication.
- [ ] Published JSON is validated, authenticated for writes, privately stored, versioned, and recoverable.
- [ ] Configured geometry stays aligned across supported viewports, input methods, and language directions.
- [ ] Unlinked layouts are labeled previews; existing APIs remain authoritative for live inventory.
- [ ] Search purpose filtering, cancellation, serial matching, keyboard behavior, and Dari copy pass focused checks.
- [ ] Existing project, unit, payment, inquiry/contact, and authentication journeys pass isolated regression checks.
- [ ] Manual testing upload folder contains all required public files/hidden files and excludes private/setup material.
- [ ] V1 database/deployment and frozen backend files remain unchanged, proven by scoped review and baseline hashes.
- [ ] Owner receives verifiable artifacts, remaining uncertainties, manual checks, and rollback instructions.

## Plan Self-Review

- All eight review findings have owning tasks; added cache, schema parity, concurrency, inventory truthfulness, and package reproducibility checks cover adjacent failure modes.
- PHP changes are restricted to the newly introduced isolated capability and require confirmation that it is unreleased.
- Shared names, envelopes, revision semantics, preview rules, and limits are defined before dependent tasks.
- Review Focus items map to explicit regression checks. Assertions are behavioral rather than implementation mirrors.
- Implementation remains unstarted. Geometry calibration and inventory completeness must be supported by inspected assets/API records, not inferred from this plan.
