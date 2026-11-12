# Shared dashboard UI and UX

Owner instruction, 2026-11-11: use UI/UX Pro Max and ensure all dashboards have the same UI and UX. This supersedes the earlier visual distinction between Management and Call Center; it does not remove department-specific workflows or existing language support.

## Foundation

- Extend the existing staff React application and shared components. Use the current Call Center teal palette across department dashboards: primary `#0B3D3B`, accent `#14B8A6`, secondary `#99F6E4`, surface `#E6FFFB`, and background `#F8FFFE`.
- Share semantic CSS tokens, typography, spacing, navigation, page headers, cards, tables, forms, dialogs, buttons, status badges, and loading/empty/error states. Do not create department-specific copies of the design system.
- Use the same sidebar/topbar structure, page navigation, filter behavior, pagination, validation feedback, save/retry behavior, and task interactions. Role permissions determine which actions are available.
- Reuse self-hosted fonts and Lucide icons. Preserve English/Dari and RTL support where enabled; retain Call Center's existing English-only behavior.
- Keep the public website design and interactive project explorers outside this dashboard styling change.

## UI/UX Pro Max application

The product search for `operations dashboard data tables` returned Analytics Dashboard, with Data-Dense Dashboard and Minimalism guidance. Apply its operational data and drill-down guidance within the existing staff foundation. The initial broad real-estate query returned a marketing hero pattern and was rejected as unsuitable for internal dashboards.

- Visible labels and field-level errors; retain form values after recoverable failures.
- Visible keyboard focus, accessible dialog behavior, labeled icon buttons, and status text in addition to color.
- Minimum 44-by-44-pixel interactive targets and readable contrast.
- Responsive checks at 375, 768, 1024, and 1440 pixels; tables may use an explicitly scrollable region without forcing whole-page overflow.
- Reduced-motion support and clear loading feedback; no decorative animation required.
- Verify Dari layouts, directional icons, navigation, and forms under RTL.

## Verification

After each implementation phase, record changed components, tests, visual checks, and remaining limitations in the master implementation log. A written design rule alone is not evidence that dashboards have been visually verified.

## Shared sign-in logo animation

Owner request, 2026-11-11: use the animation in `Attaie_Logo_React_Package.zip` upon user sign-in across all dashboards.

Archive review:

- The package provides `AttaieLogo.jsx`, layer bounds, ten transparent PNG layers, and a final original PNG, plus a standalone layered SVG and Vite demo.
- The architectural entrance draws the swoosh and tower, then reveals the roof, windows, name, Properties text, and keys. The last layer finishes approximately 1.62 seconds after playback starts; image decoding happens before playback.
- The component uses `motion/react`, relative asset imports, an SVG viewBox of `1870 841`, and `useReducedMotion`. It falls back to the original image if layer decoding fails.
- The archive is source artwork and a demo, not a replacement for this repository's package manifest or lockfile. Keep existing React versions, build configurations, and authentication behavior.

Integration behavior for implementation:

- Use one shared animation implementation across dashboard login flows, including Admin and future department dashboards. Use adapters compatible with each application's React version; do not share React runtimes between the React 18 Admin and React 19 staff applications.
- Play once after an explicitly successful sign-in, before revealing the authenticated workspace. Do not play for invalid credentials, password reset, navigation, or restored sessions on refresh.
- The animation is visual feedback, not authentication or authorization. Preserve permission checks and session expiry handling.
- Respect reduced motion by showing the settled artwork and proceeding without waiting through the entrance.
- Provide a bounded fallback so missing images, failed decoding, or missing animation completion cannot trap the user. Clean up timers and async work on unmount.
- Keep the same responsive presentation across dashboards and translate any transition status text using the application's established language support.
- Verify successful login, failed login, restored sessions, reduced motion, image failure, expiry during transition, repeated sign-ins, and deployed subdirectory asset paths.

Status: archive analyzed and integration behavior recorded; animation has not yet been integrated or visually verified.
