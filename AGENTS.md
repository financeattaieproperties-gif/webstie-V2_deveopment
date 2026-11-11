# AGENTS.md

A guide for AI coding agents working in this repository. Read this before making changes.

## Mandatory Session Rules: Version 2 Development

Owner clarification (2026-11-10): this repository is **Version 2 (V2)** development, with its own separate MySQL database and testing deployment at `https://website.attaieproperties.com`. The previous repository-wide V1 editing freeze is removed. These instructions supersede conflicting freeze restrictions in older plans, handoffs, and project notes, including notes in the V2 implementation worktree. Read and apply these rules at session start.

### 1. Develop V2 independently of the live V1 deployment

V2 source may be changed as needed for authorized development. Validate locally or on the testing subdomain. Do not upload V2 files into V1's document root or use V1 for development tests that change state. A development request alone does not authorize deployment to the main domain.

### 2. Use the separate V2 database

V2 schema changes, migrations, and development data are allowed within authorized work. Verify the target is the separate V2/testing database before database operations. Do not use V1 credentials or change V1's live database. Preserve existing V2 data unless a reset or destructive change is explicitly authorized; use fictional fixtures for automated tests.

### 3. V2 APIs and PHP endpoints may be edited

V2 backend source, including `public/api/` and `backend-php/` if present, is editable. This includes helpers, authentication, configuration, routing, request/response contracts, and dependencies. Update clients and validate affected workflows when changing contracts. V2 testing packages may include required V2 backend files. Keep real credentials and private setup materials outside uploadable files, and never overwrite V1 server files or configuration.

### 4. Follow the existing UX and UI design

Use the existing public website and admin CRM design foundations for V2 features. Reuse components, layout patterns, design tokens, typography, colors, spacing, navigation, forms, and interaction behavior. Preserve responsive behavior, accessibility, English/Dari translations, and RTL support. Unrelated redesigns require their own scope.

### Required agent conduct

- At session start, recognize this checkout as V2 and verify the target environment before external operations.
- Include these boundaries in delegated tasks and review changes against them before completion.
- Do not treat historical repository-wide API or database freezes as restrictions on V2 source or its separate database.
- Report files changed, validation performed, and remaining uncertainty. Documentation alone does not prove deployment safety.

### Owner-confirmed testing deployment workflow (2026-11-09)

- This deployment is for testing at `https://website.attaieproperties.com`, with its own document root and a separate MySQL database. It is not the protected V1 production deployment.
- The owner will manually upload the prepared `dist` contents through cPanel or a file-transfer client and manually create/import the tables through phpMyAdmin. Provide upload files, SQL, and clear manual instructions; do not require an automated installer or cPanel Terminal for this workflow.
- Preserve all five projects and their interactive explorer assets: Kabul Plaza Saljuqi, Moon Residency, Kabul Plaza Burj, Kabul Plaza 12, and Kabul Plaza 09 (ABC). Keep project IDs and artwork mappings consistent.
- V2 staff dashboards use Firebase Authentication: provision the first Admin (CEO) in Firebase and map its exact UID and role in V2 MySQL. Keep passwords out of SQL and uploaded files. This replaces the historical PHP-password-hash bootstrap for staff dashboards; existing website-admin authentication requires its own migration scope.
- Apply schema creation and sample-data imports only to the new, empty testing database. These instructions do not authorize changes to V1's database, PHP endpoints, or deployment.
- Use the specifically prepared manual-staging upload folder, not an arbitrary or stale repository-root `dist`. Upload its contents, including required hidden files, into the testing document root. Keep SQL, private login details, and setup materials outside the web root.
- Preparing files is not proof of server deployment. Confirm the owner's import and server checks before reporting the testing website as installed or verified.

---

## Project Overview

**Attaie Properties** is a bilingual (English / Dari-Farsi) real-estate marketing website and CRM for a Kabul-based property agency. It is a two-app monorepo:

| App | Location | Stack | Runtime |
|-----|----------|-------|---------|
| Public website | repo root | Vite + React 19 + TypeScript + Tailwind v4 + i18next | Static SPA, deployed to shared cPanel hosting |
| Admin CRM | `admin-panel/` | electron-vite + React 18 + TypeScript (Electron) **and** plain Vite (web) | Desktop app (Windows/macOS/Linux) **and** browser at `/admin` |

The backend is a set of PHP scripts backed by a MySQL database, deployed alongside the public site on the same shared host. There is no Node.js server, no SSR, and no Firebase — those were the original design intent (see `FULL-BUILD-PROMPT.md`) but the implementation migrated to Vite + PHP/MySQL. `src/lib/firebase.ts` is an empty placeholder kept only to avoid breaking stale imports.

The website domain is `attaieproperties.af`. The WhatsApp contact number is `93782222279`.

---

## Repository Layout

```
.
├── src/                      # Public website source
│   ├── App.tsx               # React Router v6 routes (createBrowserRouter)
│   ├── main.tsx              # Entry, imports i18n + globals.css
│   ├── pages/                # HomePage, PropertiesPage, PropertyDetailPage,
│   │                        #   ProjectDetailPage, ContactPage, AboutPage, NotFoundPage
│   ├── components/
│   │   ├── layout/           # Navbar, Footer
│   │   ├── sections/         # Landing-page sections + LandingPageContent (composer)
│   │   ├── ui/               # Button, Badge, PropertyCard, ProjectCard, Skeleton,
│   │   │   #                  HorizontalCarousel, ClickToCallButton, WhatsAppButton, etc.
│   │   ├── property/         # FilterSidebar, ImageGallery, VideoPlayer, MasterplanViewer
│   │   └── forms/            # InquiryForm (react-hook-form + zod), SearchBar
│   ├── i18n/
│   │   ├── index.ts          # i18next init, toggleLanguage(), sets <html dir>
│   │   └── locales/{en,fa}.json
│   ├── lib/
│   │   ├── dbService.ts      # Public fetch wrappers + Property/Project/Lead types
│   │   └── firebase.ts       # Empty placeholder (backend is PHP/MySQL)
│   └── styles/globals.css    # Tailwind v4 @theme tokens, fonts, utilities
├── public/
│   ├── api/                  # PHP backend (see "Backend API" below)
│   ├── admin/                # Output of admin-panel web build (gitignored build target)
│   ├── fonts/                # Self-hosted DM Sans + Tajawal TTFs
│   ├── .htaccess             # SPA fallback rewrite
│   ├── _redirects            # Netlify-style SPA fallback
│   ├── robots.txt, sitemap.xml, logo.png
├── admin-panel/              # Admin CRM (separate package.json)
│   ├── src/
│   │   ├── App.tsx           # Dual-runtime router (HashRouter vs BrowserRouter)
│   │   ├── main.tsx
│   │   ├── api.ts            # Admin API client + Property/Project/Lead types
│   │   ├── context/AuthContext.tsx
│   │   ├── pages/            # Login, Properties, PropertyForm, Projects, ProjectForm,
│   │   │   #                  Leads, SettingsPage
│   │   ├── components/       # Layout (sidebar), TitleBar, ImageUpload
│   │   ├── electron.d.ts     # window.electronAPI type bridge
│   │   └── vite-env.d.ts
│   ├── electron/
│   │   ├── main/index.ts     # BrowserWindow, tray, app menu, IPC handlers
│   │   └── preload/index.ts  # contextBridge → window.electronAPI
│   ├── electron-vite.config.ts
│   ├── vite.config.ts        # Web-only build (outputs to ../public/admin)
│   ├── electron-builder.yml  # NSIS/portable/DMG/AppImage targets
│   └── package.json
├── dist/                     # Public website build output (vite build)
├── out/                      # Stale Next.js export (legacy, gitignored)
├── docs/superpowers/         # Design specs + implementation plans (dated)
├── plans/                    # Earlier planning docs (frontend, backend, api, ux-ui, mobile)
├── index.html                # Vite entry for the public site
├── vite.config.ts            # Public site: react + tailwindcss plugins, @ alias
├── tailwind.config.ts        # Legacy color/font tokens (see "Brand tokens" note)
├── tsconfig.json             # strict, @/* → ./src/*, excludes admin-panel + dist
├── package.json              # Public site deps
└── CLAUDE.md                 # Older agent notes — largely accurate but see notes below
```

---

## Build & Test Commands

### Public website (run from repo root)

```bash
npm install
npm run dev        # Vite dev server at the default port (5173)
npm run build      # tsc --noEmit then vite build → dist/
npm run preview    # Preview the production build
npm run lint       # eslint src
```

Build output: `dist/`. The `@/` path alias resolves to `./src`.

### Admin panel (run from `admin-panel/`)

```bash
cd admin-panel
npm install

# Electron desktop app
npm run dev        # electron-vite dev — hot reload, opens a frameless Electron window
npm run build      # electron-vite build → out/{main,preload,renderer}
npm run pack       # build + electron-builder → installers in admin-panel/release

# Web browser build (no Electron) — used for the in-browser /admin CRM
npm run web:dev    # vite dev server (port 5173), proxies /api → localhost:8888
npm run web:build  # tsc -b && vite build → ../public/admin
npm run typecheck  # tsc --noEmit
```

Web build output goes to `../public/admin` so the static CRM is served alongside the PHP API and the SPA at `/admin`.

### Local PHP backend

The API scripts in `public/api/` expect a MySQL database and are served by the shared host's PHP. For local development:

- Copy `public/api/db.example.php` → `public/api/db.php` and fill in `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `ADMIN_USER`, `ADMIN_PASS`. `db.php` is gitignored.
- Run `public/api/schema.sql` in phpMyAdmin / a MySQL client to create the `properties`, `projects`, `leads`, `ctc_auth_cache`, and `ctc_public_call_log` tables.
- Serve `public/` with any PHP-capable server (e.g. `php -S localhost:8888 -t public`). The admin Vite configs proxy `/api` → `http://localhost:8888`.

### Tests

There is **no project-wide test suite**. The only test files are two ad-hoc Playwright scripts at the repo root (`pw-logo.config.cjs`, `pw-logo.test.cjs`) used once to strip the white background from `logo.png`; they are not part of the regular workflow and reference a machine-local Playwright cache path. `test-results/.last-run.json` records their last result.

Verification is done by: `npm run build` (runs `tsc --noEmit` for type-checking), `npm run lint`, and manual inspection via `npm run dev` / `npm run preview`.

---

## Technology Stack

### Public website (`src/`)

- **React 19** + **React Router v6** (`createBrowserRouter`) in `src/App.tsx`
- **Vite 5** with `@vitejs/plugin-react` and `@tailwindcss/vite`
- **Tailwind CSS v4** — tokens declared in `@theme {}` inside `src/styles/globals.css` (not in `tailwind.config.ts`)
- **i18next** + **react-i18next** — EN/FA, default namespace `common`, language persisted in `localStorage['lang']`
- **framer-motion** — the dominant animation library across sections and cards
- **lucide-react** — icons
- **react-helmet-async** — per-page SEO meta tags
- **react-hook-form** + **zod** — inquiry form validation (`InquiryForm`)
- **three** + `@types/three` — 3D hero (`Hero3DSection`)
- **swiper** — carousels
- **react-leaflet** + **leaflet** — maps
- **gsap** — additional animation
- **clsx** + **tailwind-merge** — `cn()` class helper in `src/components/ui/Button.tsx`

Routes (public): `/`, `/properties`, `/properties/:id`, `/projects/:id`, `/contact`, `/about`, `*` (NotFound).

### Admin panel (`admin-panel/src/`)

- **Electron 31** (desktop) **or** plain Vite (web) — same React 18 codebase, runtime-detected via `window.electronAPI?.isElectron`
- **React Router v6** — `HashRouter` in Electron (no server), `BrowserRouter` with `basename="/admin"` on web
- **sessionStorage**-based auth (`admin_logged_in`) backed by PHP session cookies
- Builder: **electron-builder** — Windows NSIS + portable, macOS DMG, Linux AppImage

### Backend (`public/api/`)

Plain PHP scripts over MySQL (`mysqli`, charset `utf8mb4`). No framework, no Composer. Helper functions (`db()`, `cors()`, `json_out()`, `require_admin()`, `body()`) live in `public/api/db.php`.

---

## Architecture & Module Divisions

### Public site data flow

- The **landing page** (`HomePage` → `LandingPageContent`) is composed of section components under `src/components/sections/` and uses **hardcoded** property, project, and testimonial data — it does not call the API.
- The **Properties** and **Projects** listing pages and the detail pages fetch live data through `src/lib/dbService.ts`, which wraps `fetch()` calls to the PHP endpoints under `/api`. The API base URL is `import.meta.env.VITE_API_URL || '/api'`.
- The **InquiryForm** (`src/components/forms/InquiryForm.tsx`) validates with zod and submits leads via `createLead()` → `POST /api/submit-lead.php`.
- The **ClickToCallButton** (`src/components/ui/ClickToCallButton.tsx`) posts a phone number to `POST /api/initiate-call.php`, which triggers the Etisalat CPaaS click-to-call flow (see below).

### Admin panel data flow

- All data access goes through `admin-panel/src/api.ts`, which wraps `fetch()` with `credentials: 'include'` against the same `/api` base. Base URL is overridable via `VITE_API_URL`.
- `AuthContext` wraps the app, gates the protected routes, and persists login state in `sessionStorage`.
- In Electron, the renderer is sandboxed with `contextIsolation: true` and `nodeIntegration: false`; the preload script exposes `window.electronAPI` with window controls, an image file dialog, OS notifications, external-link opening, and menu-navigation events.
- The native app menu provides `Ctrl+1/2/3` shortcuts to navigate to Properties / Projects / Leads; these are forwarded to the renderer and handled by `MenuNavigator` in `App.tsx`.

### Backend API endpoints (`public/api/`)

| Endpoint | Auth | Methods | Purpose |
|----------|------|---------|---------|
| `admin-login.php` | none | POST | Validates `ADMIN_USER`/`ADMIN_PASS`, sets `$_SESSION['admin']` |
| `admin-logout.php` | session | GET | Destroys session |
| `get-properties.php` | none | GET | List properties, filterable via `?status&type&listing_type` |
| `get-property.php` | none | GET | Single property by `?id` |
| `get-projects.php` | none | GET | List projects |
| `get-project.php` | none | GET | Single project by `?id` |
| `submit-lead.php` | none | POST | Insert a lead (name/email/phone/message/propertyId/propertyName) |
| `initiate-call.php` | none (rate-limited) | POST | Public Etisalat click-to-call; rings call center first, then bridges the customer |
| `ctc/ctc_auth.php` | internal | — | Caches Etisalat `idToken` in `ctc_auth_cache` |
| `admin/properties.php` | `require_admin()` | GET/POST/PUT/DELETE | Full CRUD for properties (incl. gallery + video) |
| `admin/projects.php` | `require_admin()` | GET/POST/PUT/DELETE | Full CRUD for projects |
| `admin/leads.php` | `require_admin()` | GET | List leads (no status edit in backend) |
| `admin/upload.php` | `require_admin()` | POST | Image upload (JPEG/PNG/WebP/GIF, ≤5 MB) → returns `{ url }` |
| `migrate-gallery.php` | — | — | One-off migration helper |

### Database schema (`public/api/schema.sql`)

`properties`, `projects`, `leads`, plus the click-to-call tables `ctc_auth_cache` (single-row token cache) and `ctc_public_call_log` (abuse/rate-limit log, indexed on `(ip_address, created_at)` and `(customer_number, created_at)`). The schema seeds one sample property.

The `Property` type supports `gallery_images: string[]` (stored as JSON) and `video_url`, even though `schema.sql` does not declare those columns — they are added by reading the live code/migrations; if you regenerate the DB from `schema.sql` you will need the `migrate-gallery.php` step or manual `ALTER TABLE` statements for gallery/video to work.

---

## Brand Tokens & Styling

Tailwind v4 tokens live in `@theme {}` inside **`src/styles/globals.css`**. The current values there are:

| Token | CSS variable | Value (current in globals.css) |
|-------|--------------|-------------------------------|
| brand-gold | `--color-brand-gold` | `#0145F2` (blue) |
| brand-gold-dark | `--color-brand-gold-dark` | `#0136C5` |
| brand-gold-lt | `--color-brand-gold-lt` | `#D4E1FD` |
| brand-navy | `--color-brand-navy` | `#020E3A` |
| brand-navy-light | `--color-brand-navy-light` | `#0A1F5C` |
| brand-navy-deep | `--color-brand-navy-deep` | `#010826` |
| brand-ivory | `--color-brand-ivory` | `#EDF1F5` |
| brand-cream | `--color-brand-cream` | `#F5F7FB` |

Status colors: `available` `#22C55E`, `pending` `#F59E0B`, `sold` `#EF4444`, `rented` `#3B82F6`.

Fonts: `font-heading` and `font-body` use **DM Sans** (self-hosted, `public/fonts/dm-sans-*.ttf`); `font-arabic` uses **Tajawal** (self-hosted). The `html[dir="rtl"]` rule in `globals.css` swaps heading/body to Tajawal. Fonts are self-hosted deliberately (the comment notes "works behind GFW" / no Google Fonts dependency).

### ⚠️ Discrepancy to be aware of

The brand accent was **migrated from gold to blue** in `globals.css` (`brand-gold` → `#0145F2`) but older config and the admin panel still use the **original gold** (`#B8944A`):

- `tailwind.config.ts` — still declares `brand-gold: '#B8944A'`, `brand-navy: '#1A2335'`, etc. This file is largely superseded by `@theme` in `globals.css`, but if any code resolves tokens via `tailwind.config.ts` it will get the old gold.
- `CLAUDE.md` — the "Brand Tokens" table documents the **old** gold values as authoritative.
- `admin-panel/src/components/Layout.tsx`, `SettingsPage.tsx`, `PropertyForm.tsx`, `ProjectForm.tsx` — inline `S` style objects hardcode `#B8944A` (gold) and `#1A2335` (navy).

When changing brand colors, update **all** of these or confirm which surface you are affecting. The public site is the source of truth (blue); the admin panel is deliberately a darker CRM and uses its own inline styles, not the Tailwind tokens.

Custom CSS utilities in `globals.css` (used widely in `LandingPageContent.tsx` and sections): `.container-custom`, `.section-padding`, `.text-display`, `.text-headline`, `.text-overline`, `.islamic-pattern`, `.islamic-pattern-light`, `.glass`, `.glass-light`, `.link-underline`, `.shimmer`, `.pulse-gold`, `.flash-gold`, `.float-gentle`, `.scroll-bounce`, `.shadow-brand-*`, `.shadow-gold-*`. The file also defines semantic CSS custom properties (`--background`, `--foreground`, `--shadow-*`, `--ease-*`, `--gold-glow-*`, `--dur-*`) and a `prefers-reduced-motion` override.

The `Button` component (`src/components/ui/Button.tsx`) exports the shared `cn()` helper (clsx + tailwind-merge) — import `cn` from there rather than re-declaring it.

---

## Coding Conventions

- **TypeScript strict** mode on both apps; the public `tsconfig.json` excludes `admin-panel` and `dist`.
- Path alias: `@/` → `./src` (public site only). The admin panel imports everything via relative paths.
- **React 19** in the public site, **React 18** in the admin panel — do not swap or cross-import component libraries between the two apps; they have separate `package.json` files and separate React majors.
- Tailwind v4: declare new design tokens in `@theme {}` in `globals.css`, not in `tailwind.config.ts`.
- Use `react-hook-form` + `zod` for validated forms (see `InquiryForm.tsx` for the established pattern).
- Use `framer-motion` for animations; the public site already defines shared variants (`fadeUp`, `staggerParent`) in `LandingPageContent.tsx`.
- Per-page SEO: wrap page content in `<Helmet>` (from `react-helmet-async`) and set `<title>`, `<meta name="description">`, `<link rel="canonical">`, and OG tags — see `HomePage.tsx` / `PropertiesPage.tsx`.
- i18n: route user-facing strings through `t('key')` from `react-i18next`; add keys to both `src/i18n/locales/en.json` and `fa.json`. The CSS `html[dir="rtl"]` flip handles RTL automatically once `toggleLanguage()` sets the `dir` attribute.
- Accessibility: the globals include a `:focus-visible` ring and a `prefers-reduced-motion` block — preserve these when adding animations. Icon-only buttons need `aria-label`s (existing components follow this).
- Admin panel inline styles: the admin pages use inline `S` style objects (`Layout.tsx`, `SettingsPage.tsx`) rather than Tailwind, and hardcode the gold/navy hex values. Keep that style consistent within the admin app unless migrating it.

---

## Deployment

### Public website

1. `npm run build` → produces `dist/`.
2. Zip the **contents** of `dist/` (not the folder itself) and upload to `public_html/` on the shared host.
3. Ensure `public/api/db.php` exists on the server with real credentials (copy from `db.example.php`) and that `schema.sql` has been applied.
4. `public/.htaccess` handles the SPA fallback (`RewriteRule ^ /index.html [L]` after serving real files). `public/_redirects` is the equivalent for Netlify-style hosts.
5. `uploads/` (created by `admin/upload.php` at `public_html/uploads/`) must be writable by the web server.

### Admin panel — desktop

```bash
cd admin-panel
npm run pack   # → admin-panel/release/ (NSIS + portable on Windows)
```

Targets are configured in `electron-builder.yml`: Windows NSIS + portable, macOS DMG (x64 + arm64), Linux AppImage.

### Admin panel — web

`npm run web:build` outputs to `../public/admin`, so the in-browser CRM is served at `/admin` on the same host as the public site. `admin-panel/vite.config.ts` sets `base: '/admin/'`.

### Environment variables

- Public site: `VITE_API_URL` overrides the API base (defaults to `/api`). Other `VITE_*` vars are read via `import.meta.env`.
- Admin panel: `VITE_API_URL` likewise.
- PHP backend: `DB_*` and `ADMIN_*` constants in `public/api/db.php`. Etisalat click-to-call secrets (`CTC_USERNAME`, `CTC_PASSWORD`, `CTC_CLI`, `CTC_CALLCENTER_NUMBER`, `CTC_BASE_URL`) are read via `getenv()` — set them through cPanel → Setup PHP App → Environment Variables, **never** in committed files.
- `.env.local` exists at the repo root and is gitignored. It is a sensitive file (credential pattern) and must not be read into the conversation or committed.

---

## Security Considerations

- **Admin auth** is PHP-session-based (`$_SESSION['admin']`). The admin API endpoints call `require_admin()` which 401s without a session. The frontend mirrors this with `sessionStorage['admin_logged_in']`. Credentials are compared with `===` against the PHP constants — a production deploy should replace the example values in `db.php` with strong credentials.
- **SQL injection**: all queries use `mysqli` prepared statements with `bind_param`. Do not introduce string concatenation into SQL.
- **CORS**: `cors()` in `db.php` reflects the `Origin` header and allows credentials — broad by default so the same API serves both the SPA and the Electron app. The click-to-call endpoint (`initiate-call.php`) is **stricter**: it allows only `https://attaieproperties.com` / `www.` origins. Update that allowlist if the domain changes.
- **Click-to-call abuse protection** (public-facing, unauthenticated): `initiate-call.php` validates Afghan mobile format server-side (`preg_match('/^(93)?0?7\d{8}$/'`), normalizes to `93XXXXXXXXX`, and enforces two rate limits — **3 calls per IP per 10 minutes** and **1 call per number per 2 minutes** — using `ctc_public_call_log`. It logs every attempt with status and Etisalat response payload. The doc in `docs/WEBSITE_CLICK_TO_CALL_INTEGRATION.md` is the spec; `initiate-call.php` is the implementation (note the spec uses PDO while the implementation uses `mysqli`/`db()`).
- **Secrets**: `public/api/db.php` (real DB credentials) and `.env.local` are gitignored. The CTC credentials come from `getenv()`, not from the filesystem. Do not echo secrets in errors — the `Throwable` handler in `initiate-call.php` returns a generic message rather than `$e->getMessage()`.
- **File uploads** (`admin/upload.php`): restricted to JPEG/PNG/WebP/GIF, ≤5 MB, saved with a `uniqid()` name under `uploads/`. The endpoint requires admin auth.
- **Etisalat token caching**: `ctc_auth.php` caches the `idToken` in `ctc_auth_cache` with a conservative 9-hour expiry and refreshes when ≤60s remain.
- **Electron sandbox**: the admin main process uses `contextIsolation: true`, `nodeIntegration: false`, and a single preload script as the only bridge. New window opens (`setWindowOpenHandler`) are routed to the system browser via `shell.openExternal` rather than new Electron windows. Do not disable these protections.
- Open item flagged in the click-to-call doc: confirm the exact phone-number format Etisalat expects for `bpartyno`/`apartyno` before going live; the normalization regex is a best guess and should be validated against a real call.

---

## Reference Docs

- `CLAUDE.md` — older agent notes; mostly accurate for the public site architecture, but its **brand-token table documents the old gold (`#B8944A`) values** that `globals.css` has since replaced with blue (`#0145F2`). Trust `globals.css` for colors, not `CLAUDE.md`.
- `docs/WEBSITE_CLICK_TO_CALL_INTEGRATION.md` — Etisalat CPaaS click-to-call design spec (frontend + backend + rollout). The PHP in the doc uses PDO as an example; the shipped implementation uses `mysqli` via `db()`.
- `docs/superpowers/specs/` and `docs/superpowers/plans/` — dated design specs and implementation plans (landing page, CMS admin panel, Next.js→Vite migration, premium frontend upgrade, hero redesign). Treat these as historical context; the current code is the source of truth.
- `plans/` — earlier high-level plans (frontend, backend, api, ux-ui, android, ios). Also historical.
- `FULL-BUILD-PROMPT.md` — the **original** build brief targeting Next.js 15 + Firebase + Dubai. The project has since migrated to Vite + PHP/MySQL + Kabul; use this only to understand design intent, not current behavior.
