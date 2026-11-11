# Photo-based apartment explorer and landing background design

**Status:** Proposed for owner review. Planning only; implementation and deployment are not authorized by this document.

## Owner requirements

1. Start with the actual building exterior photograph/render. Floors are selected directly on that image.
2. Selecting or hovering a floor should realistically illuminate its windows from inside. This is the visual priority: professional architectural lighting, aligned to the real facade.
3. Clicking a floor opens its whole-floor plan, containing all mapped apartments on that floor.
4. Each apartment has its name and area displayed over its actual location on the whole-floor plan.
5. Clicking an apartment opens that apartment's own plan.
6. Both whole-floor and apartment plans use one image comparison: initially 50% 2D and 50% 3D furnished. Moving the mouse moves the reveal between those two images.
7. The 50/50 behavior applies to the plan itself. It is not an exterior-versus-plan layout and not a side-by-side viewing mode.
8. Remove room hotspots, CAD/SVG building presentation, separate 2D/CAD and 3D/furnished viewing modes, side-by-side mode, render-photo toggles/icons, and unrelated controls.
9. Future plan uploads contain the cropped plan itself, without surrounding white PDF margins.
10. Restore admin control of the landing-page background.
11. Preserve all five projects, EN/Dari, RTL, responsive behavior, and existing V1 design foundations.
12. Deliver for manual deployment to `website.attaieproperties.com` with its separate testing database. The owner uploads files and imports any necessary SQL manually.

## Findings in the current source

- `HomePage.tsx` renders `LandingPageContent.tsx`; its active hero uses the imported `stitchHeroImg` directly. `Hero3DSection.tsx` is not the component used by this route.
- `SettingsPage.tsx` has connection and application settings, but no persisted landing background controls. Targeted source/history searches have not recovered the prior control. This does not prove it never existed in another branch or backup.
- `DualPaneElevationXRayView.tsx` defaults to `svg-cad`, exposes multiple viewing modes, and changes the active plan on floor hover.
- Its photorealistic mode uses generic band percentages. Those percentages do not encode each facade's actual perspective or window boundaries.
- `buildFloorGroups()` uses only floors represented by live unit rows when rows exist. Existing showcase rows frequently assign one layout to one representative floor.
- The current manual import contains five projects and 25 showcase layouts, not complete floor-by-floor inventory. This is a material limit of the package previously prepared.
- The blueprint modal receives default unit coordinates of `0,0`; the shared viewer treats numeric zero as a provided coordinate. Elsewhere the viewer can invent default apartment positions and sample data. Neither is suitable for a calibrated floor plan.
- `resolveUnitPlans()` commonly resolves the generic typical masterplan before selecting a special unit. Commercial, VIP, terrace, and duplex floors need explicit floor-plan mappings.
- All five project image folders exist, but whole-floor 2D/furnished coverage is incomplete. Furnished floor variants exist without corresponding technical masterplans for Saljuqi and Moon Residency; special floors in other projects also need an asset audit.
- An inspected exterior contains a baked-in contact footer and existing illumination. An inspected whole-floor plan has surrounding white margins. Asset preparation and image registration are required for a convincing result.

## Approaches considered

**A. Calibrated photography with authored light layers and plan mappings — recommended.** Keep the real exterior, trace each floor and its windows, composite aligned illumination, and connect explicit floor/apartment regions to their plans. Fits the existing React/PHP deployment, keeps the public interface simple, and avoids a 3D engine. Requires careful image preparation for each building.

**B. Real-time 3D building/shader viewer.** Can simulate lighting but requires accurate 3D models and a larger rendering pipeline. The owner requested selection on the actual exterior image; this would add substantial complexity without being necessary.

**C. Rectangular CSS bands over the photograph.** Quick but does not respect perspective, balconies, windows, or occlusions. It does not meet the requested quality bar.

The plan proposes A; the owner has not yet approved the implementation approach.

## Public journey

Use one focused explorer with three states: **Building → Floor → Apartment**. A short breadcrumb and a contextual Back action provide navigation. Reuse existing typography, blue/navy tokens, panel styling, and spacing. Do not add a new design system.

### Building

- Show the actual exterior as the default and only building view. Do not show a CAD diagram or a photo-mode selector.
- Align transparent floor hit regions to the building's perspective. Keep sky, neighboring buildings, balcony slabs, trees, and foreground outside the lighting regions.
- On mouse hover or keyboard focus, preview that floor's interior lighting and show a small floor label. Do not open another screen merely because the pointer moved.
- On click, Enter, or tap, select the floor, briefly retain its light feedback, then open its whole-floor plan.
- Initial copy: “Select a floor to explore.” A touch user can tap directly; hover is never required to navigate.

### Floor

- Show the complete selected floor plan first; do not automatically open its first apartment.
- Start the 2D/furnished reveal at 50%. Both source images occupy the same registered image frame.
- Place readable labels such as “Apartment A · 173 m²” over the correct apartment regions. The final values come from approved project data, not this example.
- Apartment interaction uses the actual apartment footprint, not a room pin or generic quadrant.
- Moving the pointer changes the 2D/furnished reveal. Clicking an apartment selects it. Dragging the divider must not accidentally select an apartment.
- Clicking an apartment opens its apartment plan. Shared corridors, stairs, elevators, and common spaces do not select an apartment.

### Apartment

- Show only the selected apartment's matched 2D/furnished plan pair, initially at 50%.
- Display apartment name, area, and selected floor in one concise header. Keep detailed sales actions outside the image.
- Back returns to the same floor and preserves its selection. Changing floor clears the previous apartment.
- No room hotspots, generated room measurements, technical metadata panels, view tabs, comparison-mode buttons, or side-by-side switch.
- The existing inventory section below the explorer must not reopen the old cluttered apartment modal; route its plan actions to this same viewer. Preserve its unrelated sales information.

## Premium lighting

The effect must be asset-led, not a glowing rectangle. For each exterior, author floor hit polygons plus window/interior masks. Build an aligned lit overlay from the same image geometry, with warmer interior light, realistic frame occlusion, restrained spill, and facade-appropriate intensity. Balcony walls, concrete slabs, and sky remain intact.

Prefer a matching unlit/lit architectural render pair when available. Otherwise prepare a registered lit layer from the existing photo, restricted to approved window/interior masks. AI may assist asset preparation later, but a regenerated facade is not accepted without alignment verification. The plan does not assume AI can infer accurate floor assignments, interiors, or apartment geometry.

Use approximately 180 ms for hover light-in, 220 ms for light-out, and 220–280 ms for a plan transition as starting values to tune against actual images. Animate opacity of precomposed light layers; avoid per-frame animated blur or filter stacks. Reduced-motion mode gives immediate/static state feedback.

Existing images already have some lit windows and limited detail. A source with baked-in light cannot become a perfect lights-off rendering through CSS alone. Review source quality before promising the final effect. Higher-resolution originals or a matched render may be required for the premium acceptance gate.

## Images, coordinates, and the 50/50 reveal

- Exterior, floor, and apartment images each have their own image version and dimensions. Store all geometry normalized to that image's content frame.
- Cropping occurs before calibration. Do not reuse coordinates from the original PDF page after changing the crop.
- Preserve aspect ratio with `object-fit: contain`. All overlays must use the actual displayed image bounds, including letterbox offsets, not the outer card bounds.
- Whole-floor and individual-apartment plan pairs are distinct assets. A whole-floor 2D image must never be paired with one apartment's furnished image.
- Matching plans require the same orientation, framing, and sufficiently matching geometry. Different perspective renders cannot be made accurate by stretching them. Use an aligned, preferably top-down furnished view or obtain a matching asset.
- The owner supplies already-cropped future uploads. Do not add artificial white margins or auto-crop live images. If an admin intentionally crops/replaces an image, invalidate affected geometry and require review before publishing.
- Start at 50%; follow horizontal mouse movement within the image with a clamped 0–100% reveal. Keep labels outside the clipping layer so they remain readable on both halves.
- Provide the same divider as a keyboard slider with arrow keys, Home, End, and a clear accessible name. Touch users drag the handle or tap the divider track; preserve vertical page scrolling.
- Use a small drag threshold so divider movement and apartment clicks remain separate. Reset comparison to 50% on a new plan; retain it when returning to the previous plan in the same session.
- A missing pair is a configuration issue. Never substitute a different floor/unit image. Published configurations require complete pairs; if a published asset later fails, show the remaining correct image with concise feedback and retry.

## Explicit project data and admin authoring

Introduce a separate visual configuration containing the exterior, floor geometry, light layers, floor plan pairs, and apartment placements. Keep it separate from existing database tables and PHP endpoints.

- Distinguish **layout templates** from **physical units on a floor**. Reusing a template across floors must not duplicate a real database unit ID or fabricate stock/availability.
- Every selectable floor has an explicit layout mapping. Typical floors may reuse a template, while commercial, VIP, garden, terrace, penthouse, and duplex floors have separate assignments.
- Apartment polygons and name/area anchors are calibrated once per reusable floor template. Floor instances link placements to existing inventory IDs only where the linkage is verified.
- Inventory bindings belong to the physical floor instance, never the reusable template. A duplex can explicitly span two floor numbers and share one physical inventory identity; the model must not create a second apartment for its upper level.
- Names/areas can exist for layout browsing without a live stock link; no availability or price is inferred from that absence. Common spaces and special floors are not silently populated with residential units.
- Replacing or deleting a linked inventory record leaves an admin-visible validation error and a safe public fallback; it never falls back to another apartment.
- Admin editing belongs inside the existing project form in a focused “Interactive explorer” section. Provide upload, trace/select, reuse template, preview, save draft, and publish steps. Detailed calibration tools are admin-only.
- New-plan authoring needs two matched images: the 2D plan and furnished plan. “50/50” is a comparison of existing images, not automatic 2D-to-3D generation. Do not require PDF uploads or white page borders.

### Landing background

First check accessible history/backups for the original feature. Reuse compatible behavior if recovered; otherwise restore the capability with a small settings section: upload/select image, preview, focal point, save, and reset to the current default. Preserve the rest of the landing page.

Wire the setting to the active `LandingPageContent.tsx` hero. It must persist server-side and appear in a fresh browser on another device; localStorage is not an acceptable publication mechanism. A failed or missing custom image falls back to the current default without an empty hero. Image-only scope is proposed; video/slideshow features were not requested.

## Protected architecture and storage

- V1 production, its database, existing PHP files/helpers, and existing endpoint contracts remain unchanged. New work is validated locally and on the separate testing host only.
- Recommended storage: new site-local, protected, file-based visual configuration plus versioned static assets. No SQL migration is needed for this feature. Existing unit data is read through current contracts; normal pre-existing admin editing remains unchanged.
- Add new endpoints outside the frozen API tree, for example `/visual-config/read.php` and `/visual-config/admin.php`, with new private helper files. They must not include the auto-migrating `api/bootstrap.php` or invoke `db()` for visual configuration operations.
- Reuse existing session authentication and CSRF through read-only loading of `api/db.php` helpers where compatible. Prove the contract in tests; fail closed if required helpers/session/token are unavailable. Do not modify login or shared authentication configuration.
- Public reads expose only published visual content. Admin reads/writes require the real PHP session; sessionStorage alone grants no access. Enforce CSRF on mutations, validate an allowlisted manifest, escape displayed text, and accept only local asset references or approved HTTPS upload sources. Avoid server-side arbitrary URL fetching.
- New storage is explicitly configured per deployment outside its web root. No shared sibling-directory or system-temporary fallback is allowed. Protect media staging paths and prevent executable uploads. Use file locking, revision checks, atomic replacement, draft/published separation, and a previous published revision for rollback.
- Store uploaded media privately under immutable content hashes inside that configured storage root. Authenticated, CSRF-protected uploads return an asset descriptor plus a private preview URL; previews require the real admin session and send `Cache-Control: private, no-store`. Public `media.php` serves only assets referenced by the current or retained published revisions, with a validated image MIME and immutable cache headers. Unpublished draft-only assets are never publicly served, even when their hash is known. Do not expose filesystem paths or accept arbitrary filenames.
- Retain the current and two previous published configurations and their image bytes, plus any explicitly pinned rollback revision. Publishing verifies that all referenced media exists, then atomically switches the manifest; failure leaves the previous revision active. Never overwrite image bytes at an existing asset URL. Keep unused/draft media until an explicit reviewed cleanup; deployment does not delete it. Previously published images are public content and may remain cached after unpublishing.
- Existing upload endpoints stay unchanged. The new feature gets an isolated uploader where lossless/transparent asset preservation is required; the current generic optimizer may flatten large transparent PNGs to white JPEG. Validate actual MIME, image dimensions, decoded-pixel and size limits, and disable animation for light assets.
- Package new endpoints only as explicitly named feature additions for testing. Never distribute frozen backend directories in a frontend update. Keep runtime settings, credentials, uploads, and existing mappings out of overwrite packages. The owner manually uploads the selected files; no deployment is performed by this plan.

## Acceptance gates

1. One building and one typical floor pass visual review before expanding to all five projects.
2. The actual facade is the only building presentation; floor lighting follows windows and perspective at desktop and mobile sizes.
3. Floor selection opens a complete floor plan before any apartment plan. Apartment labels match approved names, areas, and locations.
4. The mouse-controlled 2D/furnished reveal works for both floor and apartment plans; there is no side-by-side or mode selector.
5. Every declared selectable floor and apartment of all five projects has a verified mapping and image pair, or is explicitly unpublished until supplied. Missing assets are reported; they are not invented.
6. Admin-uploaded cropped plans retain geometry, aspect ratio, and crisp labels. Replacement requires recalibration.
7. Background changes persist across sessions/devices; save/reset/failure paths work.
8. Keyboard, touch, screen-reader labels, EN/Dari, RTL, reduced motion, and back navigation work without accidental selection.
9. No synthetic availability, default A/B apartments, arbitrary hotspot positions, or generated room dimensions appear as real project information.
10. Existing API files and protected resources have unchanged hashes. Manual staging packaging preserves the five project IDs and includes only reviewed additions.

## Inputs and decisions still requiring review

- Approval of the proposed photographic/light-layer approach and three-state flow.
- Accurate floor numbering, all apartment placements, area sources, and special-floor assignments for each building. Existing source descriptions are leads to verify, not authoritative architecture.
- Missing matching 2D/furnished whole-floor and apartment pairs, plus higher-quality exterior originals where the extracted image is insufficient.
- Visual review of the first calibrated lighting effect. A generic animation demonstration cannot establish quality across all five different facades.

These are implementation review gates, not reasons to invent data. This document makes no claim that product changes, uploads, or database operations have occurred.
