# Design System: Prototype — Build in Public × Video LLM SaaS
**Project ID:** 14232923435542206889

---

## 1. Visual Theme & Atmosphere

The interface embodies **dense technical darkness** — a cyberpunk developer dashboard where data breathes through carefully rationed light. The canvas is near-black, almost void-like, yet information never feels buried. Instead, glowing accents carve deliberate hierarchy from shadow.

The experience is **simultaneously claustrophobic and airy**: sections float as frosted glass panels suspended in deep space, each radiating subtle violet or cyan halos. There is no decorative noise — every visual element earns its place by carrying meaning. The aesthetic nods to mission-control terminals and developer tooling rather than consumer apps.

Motion is restrained and purposeful: a pulsing status dot proves liveness; a blinking cursor signals active computation; a gradient shimmer hints at live data flowing beneath the surface. Nothing moves without reason.

**Mood keywords:** Nocturnal · Technical · Precise · Alive · Confident

---

## 2. Color Palette & Roles

| Descriptive Name | Hex / Value | Functional Role |
|---|---|---|
| **Deep Void Black** | `#050508` | Page background — the infinite canvas |
| **Midnight Surface** | `#0c0c14` | Component surface layer, nav bars, section bases |
| **Frosted Glass Card** | `rgba(14, 14, 24, 0.70)` | Card and panel backgrounds — uses `backdrop-filter: blur(12px)` |
| **Whisper Border** | `rgba(255, 255, 255, 0.06)` | Card/section borders — barely-there delineation |
| **Soft Lunar White** | `#e2e4ec` | Primary body and heading text — warm, not harsh |
| **Cosmic Muted** | `#5a5b72` | Secondary text, metadata, timestamps |
| **Electric Violet** | `#8b5cf6` | Primary accent — CTAs, section highlights, gradient start |
| **Arctic Cyan** | `#06b6d4` | Secondary accent — metrics, data values, gradient end |
| **Emerald Signal** | `#10b981` | Success state — live status, active indicators, positive metrics |
| **Rose Alert** | `#f43f5e` | Danger/error state — destructive actions, ranking #1 badges |
| **Amber Caution** | `#f59e0b` | Warning/streak state — consecutive day badges, cost indicators |
| **Violet Glow Halo** | `rgba(139, 92, 246, 0.40)` | Glow blur behind violet accents (`text-shadow`, `box-shadow`) |
| **Cyan Glow Halo** | `rgba(6, 182, 212, 0.40)` | Glow blur behind cyan data values |

**Signature Gradients:**
- **Main Gradient** — `linear-gradient(135deg, #8b5cf6 → #06b6d4)` — Violet to Cyan; used on hero titles and primary CTAs
- **Warm Gradient** — `linear-gradient(135deg, #f43f5e → #f59e0b)` — Rose to Amber; used on streak and ranking elements

---

## 3. Typography Rules

**Two-font system — never mix beyond these two families:**

**Inter** (Google Fonts, weights 400/500/600/700/800/900)
- The workhorse: all prose, labels, UI elements, section titles
- Headings set tight with `letter-spacing: -0.02em` to `-0.03em` for density
- Hero titles use weight 800–900 with gradient clip for drama
- Body text stays at weight 400, line-height 1.6

**JetBrains Mono** (Google Fonts, weights 400/500/700)
- Reserved exclusively for: numeric metrics, code snippets, IDs, timestamps, author names, API routes, badge labels
- Creates instant visual separation between "data" and "prose"
- Uppercase labels use `letter-spacing: 0.06em` for legibility

**Size Scale:**
- Hero h1: `clamp(2.5rem, 6vw, 4rem)` weight 900
- Section titles: `2rem` weight 800
- Card titles: `0.75rem` uppercase, weight 600
- Stat values: `2.2rem` JetBrains Mono weight 800
- Body: `0.9rem`–`1rem` Inter weight 400
- Micro labels: `0.65rem`–`0.78rem`

---

## 4. Component Stylings

**Glow Cards (primary container unit)**
- Subtly rounded corners (16px border-radius)
- Frosted glass background (`rgba(14,14,24,0.70)`) with `backdrop-filter: blur(12px)`
- Whisper-thin border (`1px solid rgba(255,255,255,0.06)`)
- Gradient border glow via `::before` pseudo-element using `mask-composite` — visible only on hover or emphasis states
- Hover: lifts 2px upward, border brightens to `rgba(139,92,246,0.25)`
- Transition: `0.2s` ease-out on all transforms

**Status Badges**
- Pill-shaped (border-radius 20px)
- Colored glass fill: e.g., `rgba(16,185,129,0.10)` with matching `1px solid rgba(16,185,129,0.20)` border
- Text color matches the accent (emerald/amber/violet/rose)
- "LIVE" badge includes a pulsing circular dot (`@keyframes pulse`, 2s infinite)

**Buttons (Landing Page)**
- *Primary*: Gradient background (violet → deep violet), white text, weight 600, pill-shaped; hover lifts 1px with enhanced glow shadow
- *Secondary*: Frosted glass background, muted border, text color; hover increases border opacity

**Progress/Bar Elements**
- Thin horizontal bars (height 3px–4px)
- Gradient fill (violet → cyan) with `border-radius: 2px`
- Background track at `rgba(255,255,255,0.06)`

**Trending / List Rows**
- Flex row with `gap: 0.6rem; align-items: center`
- Rank numbers: `flex-shrink: 0; min-width: 24px` in JetBrains Mono
- Title: `flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap`
- Language dot: `width: 8px; height: 8px; border-radius: 50%` in accent color

---

## 5. Layout Principles

**Page width hierarchy:**
- Dashboard view: `max-width: 880px` centered — focused reading width
- Daily detail: `max-width: 800px` — narrower for single-column scan
- Landing/Marketing: `max-width: 1100px` — wider to accommodate feature grids

**Whitespace strategy:**
- Section gaps: `1.5rem`–`2rem` between major sections
- Card internal padding: `1rem`–`1.5rem`
- Grid gaps: tight at `0.6rem`–`0.8rem` for data-dense views, `1.25rem` for marketing views
- Page padding: `2rem 1.5rem` with mobile reducing to `1.5rem 1rem`

**Grid system:**
- Stats: 4 columns → 2 on mobile
- Features/Cards: 2 columns → 1 on mobile
- API/Video models: `auto-fill minmax(200px, 1fr)` — fluid packing
- Marketing features: `auto-fit minmax(240px, 1fr)`

**Responsive breakpoints:**
- `@media (max-width: 640px)`: Mobile — single-column grids, reduced font sizes
- `@media (max-width: 768px)`: Tablet — landing page adjustments

**Overflow discipline (enforced):**
- All flex text children: `min-width: 0; overflow: hidden`
- Truncating text: always use the triple (`white-space: nowrap` + `overflow: hidden` + `text-overflow: ellipsis`)
- Grid items: `min-width: 0` to prevent blowout

---

## 6. Template Variable Conventions

All templates use two placeholder patterns resolved at build time:
- `{{t.keyName}}` — i18n strings (English/Korean via `data/i18n.json`)
- `{{UPPERCASE_VAR}}` — pre-rendered HTML sections or scalar values injected by `src/generators/build.js`

New Stitch-generated sections must preserve these patterns exactly.
