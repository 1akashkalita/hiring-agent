# Tailwind v4 + shadcn Foundation + Beige Bridge

**Date:** 2026-07-01
**Status:** Approved (design)
**Scope:** Phase 0 + Phase 1 of a larger migration (see "Where this fits")

## Context

The `web/` app ("Fix My Resume", ships at fixmyresume.dev) is a Next.js 15.1 /
React 19 app that styles itself with **hand-rolled CSS custom properties** in a
single `src/app/globals.css` — no Tailwind, no shadcn, no charting library. Its
palette is cool grey ("paper") + indigo (`--brand: #3A2DD0`), with dark mode via
a `[data-theme="dark"]` attribute set pre-paint and toggled by `ThemeProvider`.

The goal is to adopt **Tailwind v4 + shadcn** and re-theme the app to a **warm
beige/brown** palette (the pasted `21st.dev` token set), so that a shadcn/recharts
chart component can later be dropped in natively. The user chose a **value-first**
sequencing: stand up the foundation and flip the whole app to beige cheaply via a
bridge, ship the chart, then migrate component internals incrementally.

## Where this fits (overall phasing)

- **Phase 0 — Foundation** *(this spec)*: Tailwind v4 + shadcn tooling + beige tokens.
- **Phase 1 — Bridge** *(this spec)*: re-point existing CSS var names at the beige
  tokens so the whole app turns beige with zero component rewrites.
- **Phase 2 — Chart**: recharts + shadcn `ui/chart`, rebuild the screenshot chart
  (area + custom legend + floating stat cards), real data, Framer Motion entrance.
- **Phase 3 — Migrate internals**: convert each screen's inline `<style>` blocks to
  Tailwind/shadcn, screen by screen, then delete the bridge.

This spec covers **Phase 0 + Phase 1 only**. Phases 2 and 3 get their own specs.

## Goal / Done when

- App builds (`npm run build`) and runs on Tailwind v4 + shadcn.
- The **whole app renders beige in both light and dark**.
- Theme toggle still works with **no flash** (pre-paint bootstrap unchanged).
- Existing Vitest suite passes (`npm run test`); Sparkline/score-band greens & reds
  still render (semantic status colors preserved).
- **Zero component internals rewritten** — no `.tsx` inline `<style>` block is
  converted to Tailwind in this phase.

## Environment (verified)

- Next `^15.1.0`, React `^19.0.0`, `"type": "module"`, package manager **npm**
  (`package-lock.json`), `next.config.mjs` present.
- No existing `postcss.config.*`, `tailwind.config.*`, or `components.json`.
- `framer-motion ^12.42.0` already installed with a shared vocabulary in
  `src/ui/motion.tsx` (`fadeUp`, `useReveal`, `useStagger`, reduced-motion built in).
- Fonts loaded via `next/font`: Instrument Serif, Archivo, JetBrains Mono
  (CSS vars `--font-instrument-serif`, `--font-archivo`, `--font-jetbrains-mono`).

## Phase 0 — Tooling

Tailwind v4 is CSS-first (no `tailwind.config.js` required).

1. **Dependencies** (npm): `tailwindcss@4`, `@tailwindcss/postcss`, `postcss`,
   `clsx`, `tailwind-merge`, `class-variance-authority`, `tw-animate-css`.
2. **`postcss.config.mjs`**: `{ plugins: { "@tailwindcss/postcss": {} } }`.
3. **`components.json`** (shadcn): `style` default, `rsc: true`, `tsx: true`,
   Tailwind css `src/app/globals.css`, base color irrelevant (custom theme),
   aliases `@/components`, `@/lib/utils`, etc. (path alias `@/*` → `./src/*`).
4. **`src/lib/utils.ts`**: standard `cn()` (`clsx` + `twMerge`).
5. **`globals.css`**: add `@import "tailwindcss";` at the top, keep all existing
   rules below.
6. **Beige tokens**: paste the `:root { ... }` block; rename the pasted `.dark { ... }`
   block to `[data-theme="dark"] { ... }`. Keep `--radius`, `--chart-1..5`.
7. **`@theme inline` map**: paste the `--color-*: var(--*)` block so Tailwind
   utilities (`bg-background`, `text-foreground`, `border-border`, `rounded-[--radius]`,
   `bg-chart-1`, …) resolve to the tokens.
8. **Dark variant (decision #3)**: keep `[data-theme="dark"]`. Add
   `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));`
   so shadcn's `dark:` utilities target the existing attribute. `ThemeProvider`,
   the `layout.tsx` bootstrap script, and `localStorage['ha-theme']` are untouched.
9. **Fonts (decision #2)**: in `@theme inline`, map `--font-sans` →
   `var(--font-archivo)`, `--font-serif` → `var(--font-instrument-serif)`,
   `--font-mono` → `var(--font-jetbrains-mono)`. Do **not** adopt the pasted
   DM Sans / Georgia / Menlo defaults.

## Phase 1 — Bridge

Below the beige tokens, re-point the app's existing variable *names* at the beige
tokens (alias to a single source of truth; do not duplicate hex literals where a
`var()` reference works). Every existing `.wrap` / `.top` / `.nav` / `.chip` /
`.ha-*` rule then renders beige with **no component edits**. The bridge is deleted
in Phase 3.

| App var (name kept) | Light | Dark | maps to |
|---|---|---|---|
| `--paper` (page bg) | `#F1F0E5` | `#2d2521` | `--background` |
| `--panel` (cards) | `#FFFFFF` | `#3c332e` | `--popover` (light) / `--card` (dark) |
| `--panel-2` (subtle) | `#E9E1D2`* | `#4a3f39`* | derived |
| `--ink` (text) | `#56453F` | `#F1F0E5` | `--foreground` |
| `--ink-soft` | `#8A655A` | `#c5aa9b` | `--muted-foreground` |
| `--rule` (border) | `#BAAB92` | `#56453F` | `--border` |
| `--brand` | `#A37764` | `#C39E88` | `--primary` |
| `--brand-ink` (link text) | `#8A655A` | `#C39E88` | derived (darker primary) |
| `--brand-tint` | `primary` @10% | @16% | `color-mix(in srgb, var(--primary) …, transparent)` |
| `--good` / `--warn` / `--bad` (+`-tint`, +`-ink`) | **unchanged** | **unchanged** | — (decision #1) |
| `--shadow` | unchanged | unchanged | — |

<sub>*`--panel-2` derived value tuned visually against real screens; starting point above.</sub>

Also: update `viewport.themeColor` in `layout.tsx` from `#E7EAEE` / `#0F1320` to
`#F1F0E5` / `#2d2521` so the browser chrome matches the new paper color.

## Decisions

1. **Keep the semantic status colors** (`--good` green / `--warn` amber / `--bad`
   red, plus tints and AA-safe `-ink` variants) unchanged in both themes. They
   carry meaning (Sparkline, score bands, up/down deltas); the beige palette only
   provides a red (`--destructive`), and a "good" score must not render brown.
2. **Keep the app's fonts** (Instrument Serif / Archivo / JetBrains Mono); ignore
   the pasted DM Sans / Georgia / Menlo.
3. **Keep `[data-theme="dark"]`** rather than migrating to shadcn's `.dark` class —
   zero churn to the working, no-flash theme switcher.

## Out of scope (this phase)

- recharts / any charting library, and the chart component itself (Phase 2).
- Rewriting any component's inline `<style>` block to Tailwind utilities (Phase 3).
- Adding shadcn primitive components (`button`, `card`, …) — added on demand in
  Phase 2/3 when a component actually needs them.

## Verification

- `npm run build` succeeds.
- `npm run test` (Vitest) passes.
- Manual: load app, toggle light↔dark — no flash; every screen (Score, History,
  Results, Settings, Diff) is beige; the Sparkline and score-band greens/ambers/reds
  still render with meaning; the theme-color browser chrome matches paper.

## Risks / notes

- **Two token systems coexist** during Phases 1–2 (shadcn beige names + aliased app
  names). Intentional and temporary; removed in Phase 3.
- **Contrast**: a few beige mappings (e.g. `--brand-ink` for link text, `--panel-2`)
  need a visual AA check on real screens; values above are starting points.
- **Tailwind v4 + Next 15 + React 19** is a supported combo but new; if the
  `@tailwindcss/postcss` pipeline conflicts with an existing build step, resolve in
  the plan before proceeding.
