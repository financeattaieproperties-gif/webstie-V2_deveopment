# DESIGN.md — Attaie Properties Design System (Codebase Specification)

## 1. Brand Overview & Visual Identity
- **Brand Name**: Attaie Properties (`attaieproperties.af`)
- **Domain**: Premier Real Estate Agency & Property Development Platform in Kabul, Afghanistan
- **Languages & Directionality**: Bilingual English (`LTR`) and Dari-Farsi (`RTL` via `html[dir="rtl"]`)
- **Aesthetic Direction**: Modern Architectural Prestige — crisp cool-tinted alabaster and ivory canvases (`#F5F7FB`, `#EDF1F5`), deep authoritative navy structural surfaces (`#020E3A`), electric royal-blue accents (`#0145F2`), subtle 60×60px Islamic geometric star watermark overlays, and high-trust editorial clarity.

---

## 2. Color Tokens (`src/styles/globals.css` `@theme`)

### Core Brand Palette
| Token Name | CSS Variable | Hex Value | Usage |
| :--- | :--- | :--- | :--- |
| `brand-gold` (Primary Accent) | `--color-brand-gold` | `#0145F2` | Primary CTAs, active indicators, eyebrows, icon highlights, focus rings |
| `brand-gold-dark` | `--color-brand-gold-dark` | `#0136C5` | Hover/active state for primary accent buttons and links |
| `brand-gold-lt` | `--color-brand-gold-lt` | `#D4E1FD` | Soft accent tint for icon containers, badges, and subtle highlights |
| `brand-navy` | `--color-brand-navy` | `#020E3A` | Primary headings, dark hero/header surfaces, dark buttons, structural text |
| `brand-navy-light` | `--color-brand-navy-light` | `#0A1F5C` | Hover state for navy buttons, secondary dark cards |
| `brand-navy-deep` | `--color-brand-navy-deep` | `#010826` | Deep footer background, high-contrast dark overlays |
| `brand-cream` | `--color-brand-cream` | `#F5F7FB` | Primary page canvas (`--background`) |
| `brand-ivory` | `--color-brand-ivory` | `#EDF1F5` | Alternating section background, subtle pill/chip fills |

### Semantic Status Palette
| Token Name | CSS Variable | Hex Value | Usage |
| :--- | :--- | :--- | :--- |
| `status-available` | `--color-status-available` | `#22C55E` | Available / For Rent positive status badge |
| `status-pending` | `--color-status-pending` | `#F59E0B` | Pending / Reserved status badge |
| `status-sold` | `--color-status-sold` | `#EF4444` | Sold status badge & form validation errors |
| `status-rented` | `--color-status-rented` | `#3B82F6` | Rented / Informational status badge |

### Neutral Scale
| Token Name | Hex Value | Role |
| :--- | :--- | :--- |
| `neutral-50` | `#FAFAFA` | Subtle input/table row background |
| `neutral-100` | `#F4F4F5` | Hairline dividers, secondary button fills |
| `neutral-200` | `#E4E4E7` | Card & input borders |
| `neutral-300` | `#D4D4D8` | Form field borders |
| `neutral-400` | `#A1A1AA` | Placeholders, muted micro-labels |
| `neutral-500` | `#71717A` | Secondary metadata text |
| `neutral-600` | `#52525B` | Body prose and descriptions |
| `neutral-900` | `#18181B` | Default foreground text (`--foreground`) |

---

## 3. Typography (`src/styles/globals.css`)

### Font Families
- **Display & Heading (`--font-display`, `--font-heading`)**: `'DM Sans', sans-serif` (weights: `300`, `400`, `500`, `600`, `700`, `800`)
- **Body (`--font-body`)**: `'DM Sans', sans-serif`
- **RTL / Dari-Farsi (`--font-arabic` when `html[dir="rtl"]`)**: `'Tajawal', sans-serif` (weights: `400`, `500`, `700`)

### Typographic Scale & Classes
- **Hero Display (`.text-display`)**:
  - `font-size`: `clamp(2.5rem, 5vw, 4rem)` (`40px` – `64px`)
  - `line-height`: `1.1`
  - `letter-spacing`: `-0.03em`
  - `font-weight`: `700` – `800`
- **Section Headline (`.text-headline`)**:
  - `font-size`: `clamp(1.75rem, 3vw, 2.5rem)` (`28px` – `40px`)
  - `line-height`: `1.2`
  - `letter-spacing`: `-0.02em`
  - `font-weight`: `700`
- **Eyebrow / Overline (`.eyebrow`, `.text-overline`)**:
  - `font-size`: `0.6875rem` (`11px`)
  - `letter-spacing`: `0.15em` – `0.2em`
  - `text-transform`: `uppercase`
  - `font-weight`: `700`
  - `color`: `#0145F2` (`--color-brand-gold`)
- **Body Copy**:
  - `font-size`: `0.9375rem` – `1rem` (`15px` – `16px`), `line-height`: `1.6`

---

## 4. Layout, Spacing & Geometry

- **Content Container (`.container-custom`)**:
  - `max-width`: `1280px`
  - `padding-left` / `padding-right`: `1.5rem` (`24px`)
  - Centered horizontally (`margin-inline: auto`)
- **Section Vertical Rhythm (`.section-padding`)**:
  - Mobile: `padding-top: 5rem; padding-bottom: 5rem` (`80px`)
  - Desktop (`>= 768px`): `padding-top: 6rem; padding-bottom: 6rem` (`96px`)
- **Border Radius Scale**:
  - Primary Cards & Search Bar Shells: `1rem` (`16px` / `rounded-2xl`)
  - Interactive Buttons & Inputs: `0.75rem` (`12px` / `rounded-xl`) or `0.5rem` (`8px` / `rounded-lg`)
  - Status & Pill Badges: `9999px` (`rounded-full`)

---

## 5. Elevation, Glass & Decorative Surfaces

- **Surface Card (`.surface-card`)**:
  - `background`: `#FFFFFF`
  - `border`: `1px solid rgba(2, 14, 58, 0.08)`
  - `border-radius`: `1rem` (`16px`)
  - `box-shadow`: `var(--shadow-sm)`
- **Shadow Tokens**:
  - `--shadow-sm`: `0 1px 3px rgba(2,14,58,0.08), 0 1px 2px rgba(2,14,58,0.04)`
  - `--shadow-md`: `0 4px 16px rgba(2,14,58,0.10), 0 2px 6px rgba(2,14,58,0.06)`
  - `--shadow-lg`: `0 12px 40px rgba(2,14,58,0.14), 0 4px 12px rgba(2,14,58,0.08)`
  - `--shadow-xl`: `0 24px 64px rgba(2,14,58,0.18), 0 8px 20px rgba(2,14,58,0.10)`
  - `--gold-glow-sm`: `0 4px 14px rgba(1,69,242,0.30)`
  - `--gold-glow-md`: `0 8px 28px rgba(1,69,242,0.35)`
- **Glass Surfaces**:
  - `.glass` (Dark context): `background: rgba(255,255,255,0.08)`, `backdrop-filter: blur(12px) saturate(1.5)`, `border: 1px solid rgba(255,255,255,0.12)`
  - `.glass-light` (Light context): `background: rgba(255,255,255,0.72)`, `backdrop-filter: blur(16px) saturate(1.8)`, `border: 1px solid rgba(1,69,242,0.15)`
- **Architectural Pattern**:
  - `.islamic-pattern` / `.islamic-pattern-light`: 60×60px repeating SVG geometric star tessellation at `12%–18%` stroke opacity.

---

## 6. Component Patterns

1. **Navigation Header (`Navbar`)**:
   - Brand lockup on left (`Attaie Properties` logo + live Kabul time/weather compact indicators), single-line navigation links in center (`Home`, `Properties`, `Projects`, `Agents`, `Careers`, `About`, `Contact`), language toggle (`EN / دری`) and primary consultation/call CTA on right.
2. **Hero & Search Bar**:
   - High-impact architectural hero with eyebrow kicker, bold `DM Sans` display headline, concise value proposition, 3 trust badges (`Trusted Company`, `Quality Projects`, `Professional Agents`), and a full-width floating white `rounded-2xl` multi-field search bar (`Location`, `Property Type`, `Bedrooms`, `Budget`, and `Search Properties` CTA in `#0145F2`).
3. **Category & Featured Project Split**:
   - 2-column asymmetric split: `Explore by Category` 4-card grid (`Apartments`, `Houses`, `Commercial`, `Projects`) paired beside a `Featured Project` showcase banner card (`rounded-2xl`, architectural photography, project title, and `View Apartments →` CTA).
4. **Property Cards (`PropertyCard`)**:
   - `rounded-2xl` white card with `16:10` image container, top-left listing status badge (`For Sale` in `#0145F2` / `#020E3A` or `For Rent` in `#22C55E`), top-right favorite/quick-action button, price in `#0145F2`, title in `#020E3A`, location with pin icon, and bed/bath/area spec pills.

---

## 7. Unified Dashboard Standard — Option 2: Alabaster Architectural Split-Rail

All internal management consoles, CRM panels, and **any future dashboards** must use the **Alabaster Architectural Split-Rail (Option 2)** light design system. Reference implementations:
- React / Tailwind SPA blueprint: `src/components/ui/dashboard-alabaster-split-rail.tsx`
- Framework-agnostic CSS tokens: `shared/alabaster-dashboard.css`
- Applied surfaces: Website Admin CRM (`/admin`), Internal Staff & Management Workspaces (`/dashboard`, `/management`, `/callcenter`), and `/unified-dashboard` (default Option 2).

### Visual Tokens (Dashboards)
- **Canvas (`--alabaster-bg`)**: `#F7F8FA`
- **Card / Sub-Drawer / Top Bar Surface (`--alabaster-surface`)**: `#FFFFFF`
- **Primary Pillar Rail Surface (`--alabaster-rail-bg`)**: `#FBFBFD`
- **Primary Active Ink / CTA Button Fill (`--alabaster-primary`)**: `#0F172A` (Hover: `#1E293B`)
- **Active Nav Row / Hover Fill (`--alabaster-hover`)**: `#F1F5F9`
- **Hairline Borders (`--alabaster-border`)**: `1px solid #E2E8F0`
- **Muted / Helper Metadata (`--alabaster-muted`)**: `#64748B` / `#94A3B8`
- **Numerals & Counts**: Always render financial amounts, unit counts, badge counters, and timestamps with `font-variant-numeric: tabular-nums`.

### Architectural Shell Anatomy
1. **Tier 1 — Primary Pillar Rail (`64px`, `#FBFBFD`)**:
   - Architectural brand logo mark at top (`36×36px`, `#FFFFFF`, `1px solid #CBD5E1`, `rounded-md`).
   - Vertically stacked crisp SVG icon buttons (`40×40px`, zero emojis) for workspace pillars (`Command`, `Sales & Client CRM`, `Operations & Finance`, `Organization & Web`). Active pillar icon uses solid `#0F172A` fill with white stroke.
   - Bottom-pinned persistent **Compact / Expand Sidebar** toggle (`PanelLeftClose` / `PanelLeftOpen`, persisted in `localStorage`) that collapses Tier 2 on desktop to icon-only `64px` mode (`#0F172A` active state), above the System / Profile icon button (`40×40px`).
2. **Tier 2 — Contextual Sub-Drawer (`224px`, `#FFFFFF`, collapsible via Tier 1 toggle)**:
   - Drawer header displaying `Attaie Properties` eyebrow and active Pillar title.
   - Active pillar navigation items (`#F1F5F9` fill + `#0F172A` semibold text — **no thick `border-left` stripes**).
   - Compact `"All Modules"` quick-jump section beneath a `1px solid #F1F5F9` divider so cross-department navigation is always one click away.
   - Pinned footer containing Role Lens Switcher (or Account/Version/Sign-out controls).
3. **Top Breadcrumb Header (`56px`, `#FFFFFF`, `1px solid #E2E8F0` bottom border)**:
   - Left: Mobile drawer hamburger trigger (`< 768px` / `< lg`), `Pillar > Current Page Title` breadcrumb, crisp chevron divider.
   - Right: Inline search/filter input, timezone/language toggle, or session avatar.
4. **KPI Strip & Data Surfaces**:
   - Flat hairline 4-cell KPI strip (`divide-y` / `divide-x #E2E8F0` on a single white `#FFFFFF` `1px solid #E2E8F0` container) or crisp flat metric cards — zero drop-shadow clutter, zero gold/teal gradients, zero decorative pulsing dots.
   - Responsive rule: Every CSS grid or flex main column must specify `min-width: 0` (`min-w-0`), and horizontal filter strips must use `max-width: 100%; overflow-x: auto` to guarantee zero horizontal overflow at `390px` mobile width.

