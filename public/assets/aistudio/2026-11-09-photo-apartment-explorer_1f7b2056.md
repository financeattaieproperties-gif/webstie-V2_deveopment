# Photo-based Apartment Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The owner has requested planning only; do not start implementation until they approve it.

**Goal:** Replace the cluttered explorer with realistic illuminated-floor selection on building photography, whole-floor apartment selection, and a single 2D/furnished mouse reveal, while restoring landing-background administration.

**Architecture:** Use explicit, versioned image geometry and layout mappings rather than inferred floor bands or synthetic units. Build small React viewers and admin calibration tools around a new isolated visual-configuration service; existing APIs, PHP helpers, and database schemas remain frozen. Roll out to the separate testing host through the owner's manual file-upload workflow.

**Tech Stack:** Existing React/TypeScript, Tailwind v4 public tokens, existing admin inline styles, i18next, image assets with alpha, pointer events, and the installed animation library. New isolated PHP/JSON storage only; no 3D engine or database migration. Preserve existing `framer-motion` imports under the repository convention; do not turn this into a dependency migration. Prefer CSS opacity and pointer-driven CSS variables for the new viewer.

**Spec:** `docs/superpowers/specs/2026-11-09-photo-apartment-explorer-design.md` — proposed, not yet owner-approved.

## Global Constraints

- Target `https://website.attaieproperties.com` for testing, with its separate document root and MySQL database.
- Protect V1 production and its database; never test development writes against them.
- Do not edit existing APIs, PHP helpers, authentication, configuration, or request/response contracts.
- Reuse existing public/admin design foundations, EN/Dari translations, RTL, accessibility, and reduced-motion behavior.
- Actual exterior photo only; no displayed SVG/CAD building or render-photo mode control.
- 50/50 is a pointer-controlled 2D/furnished image reveal, used only for plans.
- Remove public room hotspots, 2D/3D mode buttons, side-by-side mode, and unrelated explorer controls.
- Keep all five project IDs and existing artwork associations intact; never invent floor inventory or dimensions.
- New feature storage is isolated file storage; no SQL update or repeat import is required.
- The owner manually uploads files. Preserve runtime data and never ask them to repeat the initial database import for a frontend update.

## Review Focus

1. Cropped or replaced images invalidate coordinates; portrait/landscape image bounds remain correct with letterboxing and RTL.
2. Template reuse across many floors does not duplicate physical unit IDs or fabricate availability; special floors use their own mappings.
3. Rapid pointer movement, divider drag, apartment click, back navigation, and delayed image responses never produce mismatched selections.
4. Failed config reads/uploads, expired login, stale revisions, concurrent admin saves, and missing private storage fail safely without touching V1.
5. Low-quality exterior assets, incomplete paired plans, and unverified floor labels block publication rather than producing a misleading polished simulation.

## File and interface map

Paths below are proposed new files unless explicitly marked existing. Keep shared schema types React-free and safe for both React major versions.

| Surface | Files | Responsibility |
|---|---|---|
| Shared visual model | `shared/visual-config.ts` | JSON contracts; no imports from either React app |
| Geometry and validation | `src/lib/explorerGeometry.ts`, `src/lib/explorerManifest.ts` | Image-frame transforms, pointer mapping, schema checks, floor/template resolution |
| Public config client | `src/lib/visualConfigService.ts` | Read published config; no fake success on service failure |
| Public explorer | `src/components/project/PhotoApartmentExplorer.tsx`, `PhotoFloorSelector.tsx`, `FloorPlanSelector.tsx`, `PlanReveal.tsx`, `useExplorerNavigation.ts` | Building/floor/apartment states, light overlays, apartment regions, reveal |
| Project integration | Existing `src/pages/ProjectDetailPage.tsx`, `src/components/project/ProjectUnitsSection.tsx` | Mount new explorer and route all plan actions to the same viewer |
| Landing background | Existing `src/components/sections/LandingPageContent.tsx`; new `src/components/sections/LandingHeroBackground.tsx` | Read configured hero image; preserve existing layout and default image |
| Admin clients/forms | `admin-panel/src/visualConfigApi.ts`, `components/visual/ExplorerEditor.tsx`, `ImageRegionEditor.tsx`, `PlanPairUpload.tsx`, `LandingBackgroundSettings.tsx` | Separate feature client, calibration, publishing, background settings |
| Admin integration | Existing `admin-panel/src/pages/ProjectForm.tsx`, `SettingsPage.tsx` | Embed focused visual-config editing without redesigning CRM |
| Isolated backend | `public/visual-config/read.php`, `admin.php`, `upload.php`, `media.php`, `preview.php`, `lib/.htaccess`, `lib/VisualConfigStore.php`, `lib/VisualConfigValidation.php` | New routes, auth/CSRF, private draft previews, published image serving, image validation, no MySQL calls |
| Assets/defaults | `public/assets/project-explorer/{project-id}/...`; `deployment/visual-config/defaults/` | Reviewed image derivatives, per-project mappings, seeds for new file storage only |
| Localization/style | Existing `src/i18n/locales/en.json`, `fa.json`, `src/styles/globals.css` | Scoped copy/styles; no shared token replacement |
| Local development | Existing `vite.config.ts`, `admin-panel/vite.config.ts` | Add a dev-only proxy for the new `/visual-config/` prefix to isolated local PHP; existing API routing remains intact |
| Verification/packaging | `tests/explorer/`, `tests/visual-config/`, `scripts/package-visual-update.ps1`, `deployment/visual-config/README.md` | Focused behavioral tests and manual update package |

### Contracts used by tasks

`NormalizedPoint = { x: number; y: number }`, with finite values in `[0,1]`.

`ImageAsset = { id: string; url: string; width: number; height: number; digest: string }`. Digest changes invalidate dependent geometry.

`PlanPair = { id: string; twoD: ImageAsset; furnished: ImageAsset; registration: PlanRegistration }`. `PlanRegistration` defines each source's approved content bounds/orientation and its transform into a common plan frame. Validation rejects distorted or unmatched geometry; it does not promise to align unrelated perspective renders automatically.

`ApartmentPlacement = { id: string; layoutId: string; label: { en: string; fa: string }; areaSqm: number | null; areaSource: 'approved' | 'showcase'; polygon: NormalizedPoint[]; labelAnchor: NormalizedPoint }`. This is reusable artwork and contains no physical inventory ID.

`FloorTemplate = { id: string; plan: PlanPair; apartments: ApartmentPlacement[] }` and `ApartmentLayout = { id: string; plan: PlanPair }` are reusable artwork, not inventory rows.

`FloorInventoryBinding = { placementId: string; inventoryUnitId: number; physicalFloorNumbers: number[] }` belongs to a physical floor instance, not a template.

`ExplorerFloor = { id: string; floorNumbers: number[]; label: { en: string; fa: string }; kind: 'residential' | 'commercial' | 'amenity' | 'duplex'; hitRegions: NormalizedPoint[][]; lightLayers: LightLayer[]; templateId: string; inventoryBindings: FloorInventoryBinding[] }`. A normal floor has one `floorNumbers` entry; a confirmed duplex group can explicitly use `[8,9]` and multiple exterior hit regions to open one approved two-level plan. This shares one physical inventory binding rather than creating a second upper-floor unit. Independent lower/upper plans require an explicit shared-unit association, not duplicate records. `LightLayer` references a source-aligned alpha image plus normalized placement bounds; it never uses a generic full-floor fill.

`ExplorerProject = { projectId: number; exterior: ImageAsset; floors: ExplorerFloor[]; floorTemplates: FloorTemplate[]; apartmentLayouts: ApartmentLayout[] }`.

`VisualConfig = { schemaVersion: 1; revision: string; home: { image: ImageAsset | null; focalPoint: NormalizedPoint }; projects: ExplorerProject[] }`. Draft and published revisions are stored separately. The service accepts an expected revision on writes and returns `409` on conflict.

`ExplorerSelection = { projectId: number; floorId: string | null; apartmentPlacementId: string | null }`. Hover previews are transient and must not overwrite committed selection.

## Task 1: Establish the authoritative asset and floor inventory

**Files:** Read existing project assets, `ProjectDetailPage.tsx`, `ProjectUnitsSection.tsx`, `projectExplorerUtils.ts`; create `docs/project-explorer/asset-audit.md` and draft manifests under `deployment/visual-config/defaults/`.

**Interfaces:** Produces a reviewed mapping for project IDs 1–5: exterior image, physical floor labels, reusable templates, apartment placements, area sources, and paired-image coverage.

- [ ] Record a source/build baseline and hashes of every protected PHP file. Read current `AGENTS.md`; do not reset existing work or use production for investigation.
- [ ] Audit all five exteriors and every distinct floor type. Record dimensions, baked-in margins/footer, current illumination, image quality, paired-image availability, and provenance.
- [ ] Trace why each representative sample unit appears on one floor. Mark sample layout data separately from verified physical units. Do not distribute sample rows across floors as if they were confirmed stock.
- [ ] Record exact missing images: typical, commercial, terrace, VIP, garden, studio, penthouse, and duplex variants as applicable. Get the owner to confirm physical numbering and floor assignments before publishing them.
- [ ] Inspect accessible background-feature history/backups. Record whether the original implementation can be recovered; do not claim recovery without finding it.
- [ ] Verify coverage report: each declared selectable floor has a whole-floor pair and an explicit set of apartment regions; each selectable apartment has its own pair. Unresolved entries stay unpublished.

**Acceptance:** Five projects are accounted for; no image/geometry/inventory assumptions are hidden. This task must reveal missing deliverables before coding the premium effect.

## Verification commands to establish during Task 2

Add only focused dev tooling and scripts: `test:explorer` runs Vitest with `tests/explorer/**/*.test.ts`; `test:explorer:browser` runs Playwright with `tests/explorer/**/*.spec.ts`. Keep the two discovery patterns separate. PHP tests use `tests/visual-config/run.php` with temporary storage and test-only config/session fixtures. Browser tests mock unrelated APIs and run only against local fixture URLs; no production fallback.

```text
npm run test:explorer
npm run test:explorer:browser
php tests/visual-config/run.php
npm run lint
npx tsc --noEmit -p admin-panel/tsconfig.json
npm run build:admin
npx vite build
```

Run a task's named tests first (Vitest accepts file arguments; Playwright accepts `--grep`), then the appropriate full focused suite. A passing verification means exit code 0 and all selected assertions passing. Do not label `npm run lint` as ESLint; it is TypeScript checking here. `npx vite build` plus `build:admin` deliberately avoids the root `build` script's sitemap crawler, whose default URL contacts production. Verify dependencies are installed before `npx` so it does not fetch an unexpected tool version. Preserve/restore tracked generated build artifacts after packaging without reverting unrelated work.

## Task 2: Implement the visual model and reliable image geometry

**Files:** `shared/visual-config.ts`, `src/lib/explorerGeometry.ts`, `src/lib/explorerManifest.ts`; focused tests `tests/explorer/geometry.test.ts`, `manifest.test.ts`.

**Interfaces:** `getContainedImageRect(container, imageSize): ImageRect`; `toNormalizedPoint(clientPoint, imageRect): NormalizedPoint | null`; `validateVisualConfig(input: unknown): ValidationResult`; `resolveFloorTemplate(project, floorId): FloorTemplate | null`.

- [ ] Add focused test tooling only at execution time after approval. Use an agreed small TypeScript test runner plus browser tests; do not add a project-wide test rewrite.
- [ ] Write failing tests: a 1000×500 image inside a 600×600 container has a 600×300 content frame at offset `(0,150)`; pointer `(300,300)` maps to `(0.5,0.5)`; pointers in the letterbox do not select geometry.
- [ ] Cover source crop changes, portrait images, device-pixel ratios, finite `[0,1]` bounds, and unchanged image orientation under RTL. Confirm failure before implementation.
- [ ] Define and validate the contracts above. Reject missing plan pairs, self-intersecting/out-of-bounds apartment regions, bad references, duplicate placement IDs within a template, invalid areas, and geometry for an outdated image digest. Verify floor-instance bindings reference a placement in that floor's template and a unit belonging to the correct project and physical floor(s).
- [ ] Test reuse: one floor template can serve multiple explicit floor instances; a physical inventory ID is not duplicated across different floors by template expansion. Duplex assignments need explicit lower/upper-floor mapping rather than two fake physical units.
- [ ] Implement geometry and resolution; run focused tests and both apps' TypeScript checks. Include shared contracts in each app's type-check scope without cross-importing React components.

**Acceptance:** Geometry remains registered under resizing and cropping; all later components consume the same validated model.

## Task 3: Add isolated persistence and upload routes

**Files:** New `public/visual-config/*` files from the map; clients `src/lib/visualConfigService.ts`, `admin-panel/src/visualConfigApi.ts`; tests `tests/visual-config/`.

**Interfaces:** Public `GET read.php` returns published `VisualConfig`; authenticated admin `GET admin.php` returns draft/published revisions; `PUT admin.php` saves an expected-revision draft; `POST admin.php` publishes a validated revision or resets only the hero override. `POST upload.php` accepts authorized multipart images and returns `{ asset: ImageAsset; previewUrl: string }`. Public `GET media.php?id=<asset-id>` serves published image bytes; authenticated `GET preview.php?id=<asset-id>` serves authorized draft bytes without caching.

- [ ] Before implementation, create isolated PHP fixtures with temporary test storage and fake sessions, never live credentials. Tests must prove zero `db()` calls and no inclusion of `api/bootstrap.php`.
- [ ] Write failing tests for unauthenticated access, missing/invalid CSRF, unsupported methods, invalid manifests, stale revisions, parallel writes, path traversal, executable/polyglot uploads, unsafe image dimensions, and missing configured private storage.
- [ ] Implement one explicitly configured private storage path per deployment; fail closed if absent. New helpers may read existing session/CSRF helpers through the established `db.php` contract, but must never edit it or trigger schema helpers. Support the current same-origin admin first; keep any Electron origin behavior allowlisted and credential-safe.
- [ ] Resolve the new feature base URL from the configured API root without changing existing client behavior. Add dev-only `/visual-config/` proxies in both Vite configs to a dedicated local PHP fixture server; test same-origin web requests and configured absolute Electron API roots. The public production build uses the new relative endpoint and contains no local-server override.
- [ ] Use separate draft/published JSON, file locks, atomic replacement, and a retained previous published revision. Public reads never expose draft fields, filesystem paths, sessions, or credentials.
- [ ] Store immutable image bytes by SHA-256 asset ID under the configured private storage root, beside config revisions. Private preview responses require the real admin session and `Cache-Control: private, no-store`; public media responses require membership in the current or retained published manifests and use the validated MIME, ETag, and `Cache-Control: public, max-age=31536000, immutable`. Test that guessing a draft-only asset ID still returns 404. Never take an arbitrary filesystem path from a URL.
- [ ] Keep current plus two prior published revisions and their assets, plus pinned rollback revisions. Validate image existence before atomically publishing metadata. Old image URLs retain their bytes; changed uploads receive new URLs. No automatic asset deletion is part of deployment. Test interruption before/after the manifest switch, authorized draft preview, stale published image references, and rollback without missing media.
- [ ] Define upload limits: at most 15 MB input and 16 million decoded pixels; at most 30 floors, eight hit regions per floor, 250 apartment placements, and 2000 total polygon points per project; at most 1 MB manifest body. Validate actual MIME; decode/re-encode allowed static PNG/WebP/JPEG assets, preserve alpha for light layers, reject executable/animated content, and do not fetch arbitrary remote URLs.
- [ ] Add PHP validation mirroring critical TypeScript checks. Test interrupted writes, schema-version mismatch, rollback, and public fallback when the service is unavailable.
- [ ] Run the PHP suite and syntax checks. Confirm hashes of all existing PHP files remain unchanged.

**Acceptance:** Shared cross-device settings persist without new SQL, endpoint edits, unsafe storage fallbacks, or false save-success messages.

## Task 4: Build the one plan-reveal interaction

**Files:** `src/components/project/PlanReveal.tsx`; `tests/explorer/plan-reveal.spec.ts`; scoped styles/translations.

**Interfaces:** `PlanReveal({ pair, imageKey, overlay, initialPercent = 50, onPercentChange })`; `overlay` hosts apartment labels/regions outside the clipped image layers.

- [ ] Write failing browser tests: initial divider is 50%; pointer at 25% reveals 25%; inputs clamp at 0/100%; there is no side-by-side or mode-button group.
- [ ] Add two matched image layers in the same contained content frame and one divider. Use pointer-driven CSS variables/animation values rather than React state updates on every frame.
- [ ] Separate divider gestures from apartment clicks using a six-CSS-pixel drag threshold; dragging from one apartment to another must not open either. Pointer-capture on divider drag only. Mousemove elsewhere updates the reveal without capturing normal click behavior.
- [ ] Make the divider keyboard-operable: arrow keys adjust 5%, Home = 0%, End = 100%. Provide tap-to-position on its track as a non-drag pointer alternative. Preserve normal touch page scrolling.
- [ ] Add matching-pair loading, stale-request cancellation, proper image alt text, and safe single-image failure/retry behavior. No incorrect-plan fallback.
- [ ] Verify portrait/landscape pairs, slow image loads, rapid plan switching, EN/Dari, RTL, reduced motion, and screen-reader slider labels. Reset new plan to 50%; restore prior value when navigating Back.

**Acceptance:** Both floor and apartment viewing use this same component, with no public “2D”, “3D”, “CAD”, or side-by-side mode controls.

## Task 5: Prove the premium exterior lighting on one building

**Files:** `PhotoFloorSelector.tsx`; first approved assets under `public/assets/project-explorer/1/`; `tests/explorer/photo-floor-selector.spec.ts`.

**Interfaces:** `PhotoFloorSelector({ project, previewFloorId, onPreviewFloor, onSelectFloor })`. It emits explicit floor IDs, never inferred band indices.

- [ ] Prepare Saljuqi's base exterior and one typical-floor pilot after Task 1 confirms the image's actual floor numbering. Remove presentation-only PDF/footer margins before calibration, preserving building geometry. Keep originals available for audit.
- [ ] Trace perspective-correct floor hit regions and window/interior masks. Prepare registered lit alpha layers with restrained frame occlusion and spill. Do not use a generic translucent floor rectangle or regenerate the entire facade.
- [ ] Crop alpha layers to their window/interior bounds; avoid one full-resolution building duplicate for every floor. Report compressed lighting bytes per project, preload only the active building's small light assets, and provide a before/after package-size report. Do not enlarge all five projects' downloads just to animate a single floor.
- [ ] Write failing interaction/geometry tests: hovering a mapped floor previews only its light layer; clicking selects that floor; leaving clears the preview; keyboard focus behaves equivalently. No SVG/CAD building or render-photo toggle exists.
- [ ] Implement photo rendering, transparent clipped HTML hit regions, static alpha overlays, floor labels, and keyboard/touch selection. Internal geometry must not become a visible CAD drawing.
- [ ] Tune light transitions against the actual photograph. No moving particles, neon outline, pulsing floor, image-wide brightness change, or animated expensive filter chain.
- [ ] Review the real effect with the owner at desktop, tablet, and phone sizes. Check windows, facade corners, balconies, sky, trees, and adjacent floors. Obtain visual approval before expanding asset production.
- [ ] If image detail or baked-in lighting prevents the required quality, document the limitation and obtain better source renders. Do not call a generic glow “premium” and proceed.

**Acceptance:** A visually approved pilot demonstrates the main requirement on the actual exterior. This is a release gate, not a promise that CSS alone can fix unsuitable imagery.

## Task 6: Connect building → full floor → apartment

**Files:** `PhotoApartmentExplorer.tsx`, `FloorPlanSelector.tsx`, `useExplorerNavigation.ts`; existing `ProjectDetailPage.tsx`, `ProjectUnitsSection.tsx`; `tests/explorer/journey.spec.ts`.

**Interfaces:** `PhotoApartmentExplorer({ projectId, config, inventory, initialSelection, onSelectionChange })`; navigation stores `ExplorerSelection` and prior reveal positions. Inventory links are optional and verified.

- [ ] Write failing end-to-end tests for one approved floor containing at least three apartments: building selection opens the whole floor, shows all labels, and does not select the first apartment automatically.
- [ ] Implement the three-state flow from the spec with one image stage, concise header, and Back action. Hover previews never commit navigation. Keep exterior-photo stage separate from the plan's 50/50 reveal.
- [ ] Render apartment footprints and persistent name/area labels at calibrated positions. Common spaces are not apartment targets. If labels collide at narrow widths, use short anchored labels and an accessible compact text alternative rather than incorrect coordinates.
- [ ] Clicking a placement opens its own pair. Changing floor clears apartment selection; Back restores floor/placement/reveal context. Announce state changes and move focus to the new stage heading without trapping the user.
- [ ] Remove the old explorer mount and unused page imports. Do not rewrite shared `BlueprintViewer` behavior used by unrelated property pages. Route lower inventory-card plan actions to the same new viewer; preserve independent sales actions.
- [ ] Remove synthetic A/B fallback units, generic hotspot defaults, and invented room dimensions from this project journey. Missing data gets a truthful unavailable state, not another project's assets.
- [ ] Test all Review Focus conditions: stale fetch results after project switch, empty inventory, sold/unlinked placements, disabled special floors, missing images, mobile touch, keyboard, RTL, and reduced motion.

**Acceptance:** The full journey is simple and predictable; removed controls cannot reappear through the old apartment modal or alternate viewer.

## Task 7: Add admin calibration and restore background control

**Files:** Admin visual components and integrations from the map; `LandingHeroBackground.tsx`, existing `LandingPageContent.tsx`; tests `tests/explorer/admin-authoring.spec.ts`, `landing-background.spec.ts`.

**Interfaces:** `ExplorerEditor({ projectId })` edits that project's visual config; `ImageRegionEditor({ image, regions, onChange })` returns normalized polygons/anchors; `LandingBackgroundSettings()` edits only `VisualConfig.home` through the new client.

- [ ] Write failing persistence tests: draft is private; valid publish appears in a fresh public-browser session; an expired login or rejected save does not display success. Background save/reset persists beyond localStorage and refresh.
- [ ] Embed “Interactive explorer” in the existing project form: exterior, floor mapping, paired-plan uploads, apartment regions/name/area, preview, draft save, and publish. Keep calibration complexity out of public UI.
- [ ] Support reusing one reviewed floor template across multiple explicit floor assignments. Keep layout IDs distinct from inventory IDs. Provide zoom only inside admin calibration if needed, with numeric coordinate and keyboard editing alternatives.
- [ ] Accept cropped plan uploads as-is; preserve transparency and aspect ratio. Compare dimensions/digests on replacement, invalidate dependent geometry, and require new preview approval rather than reusing stale coordinates.
- [ ] Restore landing background control in the existing Settings page: image, preview, focal point, Save, Reset. Wire it into the active hero while leaving text, search, overlays, layout, and default image unchanged.
- [ ] Test blank/failed image URLs, upload rejection, cropped plan replacement, incomplete pairs, stale revision conflict, repeat publish, new browser/device persistence, and default-hero fallback.
- [ ] Run both apps' type checks, focused tests, and browser inspection using their existing distinct React versions. Do not migrate animation packages, branding, or unrelated admin settings.

**Acceptance:** Admin can maintain these visuals without code edits, and visitors get published settings reliably. No extra MySQL tables are needed.

## Task 8: Calibrate all five projects and validate the manual update

**Files:** Final assets/default manifests for projects 1–5; `scripts/package-visual-update.ps1`, `deployment/visual-config/README.md`; compatibility fixtures.

- [ ] Apply the visually approved method to every building, keeping its unique perspective and windows. Approve every distinct floor template, paired image, apartment region, area label, and special-floor mapping. Do not copy one building's coordinates onto another.
- [ ] Build a coverage matrix: each exterior floor maps to the right whole-floor pair, all approved apartments, correct apartment pairs, and source-specific lighting. Mark missing source material explicitly and keep those entries unpublished.
- [ ] Verify existing routes, properties/projects, admin auth, contact/inquiry paths, and five project IDs using isolated fixtures and the testing database only. Do not run genuine calls or production submissions.
- [ ] Run the production builds and focused verification commands listed above, targeted PHP lint, and browser journeys at 390, 768, and 1440 CSS-pixel viewport widths. Avoid the production-contacting sitemap build step. Check Chrome/Edge plus Safari and touch behavior where available; do not claim unrun browser coverage.
- [ ] Measure response and asset cost: hover feedback within 100 ms after assets are loaded; target smooth pointer motion without per-frame React rerenders; no continuous expensive filters; reserved image dimensions; only the current project's exterior, active floor pair, active apartment pair, and limited prefetch loaded. Record measured values and device conditions rather than promising a score.
- [ ] Package an allowlisted manual update with new frontend assets and only the new `visual-config` routes/static derivatives. Exclude old PHP/API directories, runtime `db.php`, schema SQL, private settings, passwords, existing uploads, and published user mappings. Include a changed-file manifest and hashes proving protected PHP is unchanged.
- [ ] Provide manual cPanel instructions specific to `website.attaieproperties.com`, explicitly configure the new private root containing both config revisions and persistent image media, and state **no repeat database import**. Initial default visual config is copied only into new empty storage; an update must never overwrite admin-published data. Include a new, separate visual-feature config template only; do not replace runtime `api/db.php` or depend on cPanel Terminal.
- [ ] Prepare rollback of the previous frontend entry points and published visual revision. The owner performs upload after review; do not deploy as part of implementation without explicit release authorization.

**Acceptance:** All five projects pass coverage and visual checks; owner receives reviewable files and a safe manual update procedure. Existing production remains untouched.

## Suggested execution order and stopping points

1. Approve this design and the meaning of the reveal — now clarified as 2D/furnished pointer comparison.
2. Audit source material and approve accurate floor/template mappings.
3. Build shared data/geometry, isolated persistence, and the reusable reveal.
4. Approve one premium illuminated exterior and one full-floor journey.
5. Add admin authoring/background restoration and calibrate the remaining four buildings.
6. Complete staging validation and prepare manual upload files.

If the visual pilot fails quality review, stop asset rollout and improve the source/materials. If a floor pair or apartment boundary cannot be verified, stop publication of that item. Neither issue authorizes inventing project data or modifying protected backend resources.

## Plan review and implementation handoff

Confirm the proposed approach, flow, lighting pilot, admin authoring scope, and required source assets with the owner. Implementation has not started. For execution, native implementation with an independent final review is a reasonable default because the geometry, viewer, data, and admin interfaces are closely linked; a task-by-task subagent/reviewer workflow is available if the owner prefers more review gates. The owner still performs the final manual cPanel upload.

## Session handoff — 2026-11-09

The owner requested saving this work and continuing tomorrow. Stop here; no implementation or deployment has started for these requested changes. The proposed design and execution method have not yet been approved.

On resumption, read this plan and its linked design, retain the owner's comments, and continue from plan review rather than repeating the investigation. The latest clarification is decisive: 50/50 means mouse-controlled reveal between the 2D and furnished 3D versions of the same plan, for both floor and apartment views. It does not mean an exterior/plan split or side-by-side mode.

Preserve the actual-exterior default, realistic window lighting as the visual priority, the complete-floor-before-apartment flow, removal of public mode clutter, cropped future uploads, and restoration of admin landing-background control. Verify missing image pairs and physical floor mappings before publication. Testing remains on `website.attaieproperties.com` with separate storage and manual upload; V1 protections remain in force.

## Resumption audit - 2026-11-09

Preparatory audit recorded in `docs/project-explorer/asset-audit.md`, with dimensions/hashes for 98 project images and a 39-file protected PHP baseline. Unpublished asset candidates preserve project IDs 1-5 in `deployment/visual-config/defaults/asset-candidates.json`. Task 1 remains partial pending complete visual review, owner floor mappings, and missing plan pairs. No product implementation or deployment occurred. Design approval clarification was requested because the saved handoff explicitly recorded planning-only status.
