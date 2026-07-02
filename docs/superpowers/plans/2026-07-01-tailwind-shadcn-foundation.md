# Tailwind v4 + shadcn Foundation + Beige Bridge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up Tailwind v4 + shadcn tooling in `web/` and flip the whole app to the warm beige palette in both light and dark, with zero component internals rewritten.

**Architecture:** Add Tailwind v4 (CSS-first) + shadcn scaffolding. Define the beige tokens under shadcn names (`--background`, `--primary`, …) as the source of truth, then *bridge* the app's existing legacy var names (`--paper`, `--panel`, `--ink`, `--brand`, …) to point at them — so every existing hand-rolled CSS rule renders beige with no `.tsx` edits. The bridge is temporary and removed in a later phase.

**Tech Stack:** Next.js 15.1, React 19, Tailwind v4 (`@tailwindcss/postcss`), shadcn (`clsx` + `tailwind-merge` + `cva`), Playwright (existing), Vitest (existing). Package manager: **npm**.

**Spec:** `docs/superpowers/specs/2026-07-01-tailwind-shadcn-foundation-design.md`

**Working dir note:** all paths below are under `web/`; all commands run from `web/` (`cd /Users/akashkalita/hiring-agent/web`).

---

### Task 1: Tooling — deps, PostCSS, `cn()`, shadcn config

Stands up the build tooling. No visual change (Tailwind not imported into CSS yet); the goal is a green build with the new PostCSS pipeline active.

**Files:**
- Modify: `web/package.json` (+ `web/package-lock.json`) via npm
- Create: `web/postcss.config.mjs`
- Create: `web/src/lib/utils.ts`
- Create: `web/components.json`

- [ ] **Step 1: Install dependencies**

Run:
```bash
cd /Users/akashkalita/hiring-agent/web
npm install -D tailwindcss@^4 @tailwindcss/postcss postcss tw-animate-css
npm install clsx tailwind-merge class-variance-authority
```
Expected: installs succeed; `package.json` gains the deps.

- [ ] **Step 2: Create the PostCSS config**

Create `web/postcss.config.mjs`:
```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 3: Create the `cn()` utility**

Create `web/src/lib/utils.ts`:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Create the shadcn config**

Create `web/components.json` (shadcn primitives, added on demand in later phases, land under `@/components/ui`, kept separate from the hand-rolled `@/ui`):
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 5: Verify the build still passes**

Run:
```bash
cd /Users/akashkalita/hiring-agent/web && npm run build
```
Expected: build succeeds. No visual change (Tailwind is not yet imported into any CSS; the PostCSS plugin passes existing CSS through untouched).

- [ ] **Step 6: Commit**

```bash
cd /Users/akashkalita/hiring-agent/web
git add package.json package-lock.json postcss.config.mjs src/lib/utils.ts components.json
git commit -m "build(web): add Tailwind v4 + shadcn tooling (postcss, cn, components.json)"
```

---

### Task 2: Beige token layer (Tailwind import + tokens + `@theme` + dark variant)

Adds Tailwind's import, the beige tokens under shadcn names, the `@theme inline` map (so `bg-background`/`text-foreground`/etc. utilities exist), and the dark variant wired to the existing `[data-theme="dark"]` attribute. The app still looks grey after this task — the legacy vars are untouched until Task 3. This is deliberate: a safe, invisible foundation step.

**Files:**
- Modify: `web/src/app/globals.css` (insert at the very top, above the existing `:root{ --paper... }` on line 1)

- [ ] **Step 1: Insert the Tailwind/beige layer at the top of `globals.css`**

Insert this block **before** the current first line (`:root{`). Note: `--font-*` point at the app's existing `next/font` variables (decision #2 — not DM Sans/Georgia). Sidebar and shadow tokens from the source palette are intentionally omitted (the app has no sidebar and keeps its own `--shadow`).

```css
@import "tailwindcss";

/* shadcn's dark: utilities target the app's existing pre-paint attribute. */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

/* Beige design tokens (shadcn names) — source of truth. */
:root {
  --radius: 0.5rem;
  --background: #F1F0E5;
  --foreground: #56453F;
  --card: #F1F0E5;
  --card-foreground: #56453F;
  --popover: #FFFFFF;
  --popover-foreground: #56453F;
  --primary: #A37764;
  --primary-foreground: #FFFFFF;
  --secondary: #BAAB92;
  --secondary-foreground: #FFFFFF;
  --muted: #E4C7B8;
  --muted-foreground: #8A655A;
  --accent: #E4C7B8;
  --accent-foreground: #56453F;
  --destructive: #1f1a17;
  --destructive-foreground: #FFFFFF;
  --border: #BAAB92;
  --input: #BAAB92;
  --ring: #A37764;
  --chart-1: #A37764;
  --chart-2: #8A655A;
  --chart-3: #C39E88;
  --chart-4: #BAAB92;
  --chart-5: #A28777;
  --font-sans: var(--font-archivo), system-ui, sans-serif;
  --font-serif: var(--font-instrument-serif), serif;
  --font-mono: var(--font-jetbrains-mono), monospace;
}

[data-theme="dark"] {
  --background: #2d2521;
  --foreground: #F1F0E5;
  --card: #3c332e;
  --card-foreground: #F1F0E5;
  --popover: #3c332e;
  --popover-foreground: #F1F0E5;
  --primary: #C39E88;
  --primary-foreground: #2d2521;
  --secondary: #8A655A;
  --secondary-foreground: #F1F0E5;
  --muted: #56453F;
  --muted-foreground: #c5aa9b;
  --accent: #BAAB92;
  --accent-foreground: #2d2521;
  --destructive: #E57373;
  --destructive-foreground: #2d2521;
  --border: #56453F;
  --input: #56453F;
  --ring: #C39E88;
  --chart-1: #C39E88;
  --chart-2: #BAAB92;
  --chart-3: #A37764;
  --chart-4: #8A655A;
  --chart-5: #A28777;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --font-sans: var(--font-sans);
  --font-serif: var(--font-serif);
  --font-mono: var(--font-mono);
}
```

The existing `:root{ --paper:#E7EAEE; ... }` block and everything below it stays exactly as-is for now.

- [ ] **Step 2: Verify the build passes and the app is unchanged**

Run:
```bash
cd /Users/akashkalita/hiring-agent/web && npm run build
```
Expected: build succeeds (Tailwind processes `@import "tailwindcss"`, `@custom-variant`, `@theme`). App still renders grey/indigo — legacy vars are untouched. This confirms the token layer compiles without changing appearance.

- [ ] **Step 3: Commit**

```bash
cd /Users/akashkalita/hiring-agent/web
git add src/app/globals.css
git commit -m "feat(web): add beige design tokens and Tailwind v4 theme layer"
```

---

### Task 3: The bridge — re-point legacy vars, update theme-color (TDD)

Points the legacy var names at the beige tokens. This is what turns the app beige. Semantic status colors (`--good`/`--warn`/`--bad`) are kept unchanged (decision #1). Guarded by a Playwright test written first (fails while grey, passes once bridged).

**Files:**
- Create: `web/e2e/theme.spec.ts`
- Modify: `web/src/app/globals.css` (the existing legacy `:root` and `[data-theme="dark"]` blocks only)
- Modify: `web/src/app/layout.tsx:36-39` (`viewport.themeColor`)

- [ ] **Step 1: Write the failing guard test**

Create `web/e2e/theme.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

// Guards the beige bridge: body background must resolve to the beige "paper"
// token in both themes. Fails if the token bridge or dark variant breaks.
const LIGHT = "rgb(241, 240, 229)"; // #F1F0E5
const DARK = "rgb(45, 37, 33)"; // #2d2521

test("app renders beige paper in light and dark", async ({ page }) => {
  await page.goto("/");

  // Force each theme deterministically (bootstrap otherwise follows the OS).
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  await expect(page.locator("body")).toHaveCSS("background-color", LIGHT);

  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await expect(page.locator("body")).toHaveCSS("background-color", DARK);
});
```

- [ ] **Step 2: Run the guard — verify it FAILS**

Run (install the browser first if Playwright reports it's missing: `npx playwright install chromium`):
```bash
cd /Users/akashkalita/hiring-agent/web && npx playwright test e2e/theme.spec.ts
```
Expected: FAIL. Light body background is still the old `--paper` `#E7EAEE` → `rgb(231, 234, 238)`, not `rgb(241, 240, 229)`.

- [ ] **Step 3: Bridge the legacy `:root` block**

In `web/src/app/globals.css`, replace the existing legacy light block:
```css
:root{
  --paper:#E7EAEE; --panel:#FFFFFF; --panel-2:#F4F6F8;
  --ink:#15181D; --ink-soft:#5E6772; --rule:#D3D9DF;
  --brand:#3A2DD0; --brand-tint:rgba(58,45,208,.08); --brand-ink:#2A1FA8;
  --good:#2F7A57; --good-tint:rgba(47,122,87,.12);
  --warn:#A9741B; --warn-tint:rgba(169,116,27,.12);
  --bad:#BA413B; --bad-tint:rgba(186,65,59,.11);
  /* Darker text-only variants so small (11–13px) status/delta labels clear
     WCAG AA (4.5:1) on the light paper; the base hues stay for fills/borders. */
  --good-ink:#15663F; --warn-ink:#7A530F; --bad-ink:#9E2F2A;
  --shadow:0 1px 3px rgba(21,24,29,.10);
}
```
with (legacy names now alias the beige tokens; status colors unchanged):
```css
/* Legacy var bridge → beige tokens. Removed in Phase 3. */
:root{
  --paper:var(--background); --panel:var(--popover); --panel-2:#E9E1D2;
  --ink:var(--foreground); --ink-soft:var(--muted-foreground); --rule:var(--border);
  --brand:var(--primary); --brand-tint:color-mix(in srgb,var(--primary) 10%,transparent); --brand-ink:#8A655A;
  --good:#2F7A57; --good-tint:rgba(47,122,87,.12);
  --warn:#A9741B; --warn-tint:rgba(169,116,27,.12);
  --bad:#BA413B; --bad-tint:rgba(186,65,59,.11);
  /* Darker text-only variants so small (11–13px) status/delta labels clear
     WCAG AA (4.5:1) on the light paper; the base hues stay for fills/borders. */
  --good-ink:#15663F; --warn-ink:#7A530F; --bad-ink:#9E2F2A;
  --shadow:0 1px 3px rgba(21,24,29,.10);
}
```

- [ ] **Step 4: Bridge the legacy `[data-theme="dark"]` block**

In the same file, replace the existing legacy dark block:
```css
[data-theme="dark"]{
  --paper:#0F1320; --panel:#171C2A; --panel-2:#1C2233;
  --ink:#ECEEF4; --ink-soft:#98A1B2; --rule:#2A3142;
  --brand:#897CFF; --brand-tint:rgba(137,124,255,.16); --brand-ink:#B7AEFF;
  --good:#4FBE8E; --good-tint:rgba(79,190,142,.15);
  --warn:#E0B24B; --warn-tint:rgba(224,178,75,.15);
  --bad:#E66B63; --bad-tint:rgba(230,107,99,.15);
  /* Dark-theme semantic hues already clear AA on the dark panels — reuse them. */
  --good-ink:var(--good); --warn-ink:var(--warn); --bad-ink:var(--bad);
  --shadow:0 2px 10px rgba(0,0,0,.40);
}
```
with (this is the second `[data-theme="dark"]` block in the file; the first — from Task 2 — sets the beige tokens, this one bridges the legacy names to them):
```css
/* Legacy var bridge (dark) → beige tokens. Removed in Phase 3. */
[data-theme="dark"]{
  --paper:var(--background); --panel:var(--popover); --panel-2:#4a3f39;
  --ink:var(--foreground); --ink-soft:var(--muted-foreground); --rule:var(--border);
  --brand:var(--primary); --brand-tint:color-mix(in srgb,var(--primary) 16%,transparent); --brand-ink:var(--primary);
  --good:#4FBE8E; --good-tint:rgba(79,190,142,.15);
  --warn:#E0B24B; --warn-tint:rgba(224,178,75,.15);
  --bad:#E66B63; --bad-tint:rgba(230,107,99,.15);
  /* Dark-theme semantic hues already clear AA on the dark panels — reuse them. */
  --good-ink:var(--good); --warn-ink:var(--warn); --bad-ink:var(--bad);
  --shadow:0 2px 10px rgba(0,0,0,.40);
}
```

- [ ] **Step 5: Update the browser theme-color**

In `web/src/app/layout.tsx`, replace the `viewport.themeColor` values (lines 36-39):
```ts
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#E7EAEE" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1320" },
  ],
```
with:
```ts
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F1F0E5" },
    { media: "(prefers-color-scheme: dark)", color: "#2d2521" },
  ],
```

- [ ] **Step 6: Run the guard — verify it PASSES**

Run:
```bash
cd /Users/akashkalita/hiring-agent/web && npx playwright test e2e/theme.spec.ts
```
Expected: PASS. Body background is `rgb(241, 240, 229)` in light and `rgb(45, 37, 33)` in dark.

- [ ] **Step 7: Run full build + unit tests — verify no regressions**

Run:
```bash
cd /Users/akashkalita/hiring-agent/web && npm run build && npm run test
```
Expected: build succeeds; Vitest passes (the token change does not touch tested `lib/` logic).

- [ ] **Step 8: Manual visual check**

Run `npm run dev`, open `http://localhost:3000`, and confirm:
- Every screen (Score `/`, History `/history`, Results, Settings, Diff) renders beige.
- Toggle light↔dark via the header toggle — no flash on reload.
- Sparkline / score-band greens, ambers, and reds still render (status colors preserved).

- [ ] **Step 9: Commit**

```bash
cd /Users/akashkalita/hiring-agent/web
git add src/app/globals.css src/app/layout.tsx e2e/theme.spec.ts
git commit -m "feat(web): bridge legacy CSS vars to beige tokens; app-wide reskin"
```

---

## Self-review

**Spec coverage:**
- P0 tooling (Tailwind v4, PostCSS, shadcn `cn`/`components.json`) → Task 1. ✓
- Beige tokens + `@import` + `@theme inline` + `@custom-variant dark` + fonts → Task 2. ✓
- P1 bridge (legacy var mapping table) → Task 3 steps 3-4. ✓
- `viewport.themeColor` update → Task 3 step 5. ✓
- Decision #1 (keep status colors) → Task 3 keeps `--good/--warn/--bad`. ✓
- Decision #2 (keep fonts) → Task 2 `--font-*` map to app fonts. ✓
- Decision #3 (keep `[data-theme="dark"]`) → Task 2 `@custom-variant`. ✓
- Verification (build, Vitest, beige in both themes) → Task 3 steps 6-8. ✓
- Out-of-scope (recharts, chart, component rewrites) → not present in any task. ✓

**Placeholder scan:** No TBD/TODO; all CSS/TS/JSON blocks are complete. `--panel-2` uses concrete derived hexes (`#E9E1D2` / `#4a3f39`) flagged in the spec as visually tunable — not a placeholder. ✓

**Type/name consistency:** `cn` (utils.ts) matches `components.json` `aliases.utils`. Token names in the `@theme inline` map, the beige blocks, and the bridge aliases all agree (`--background`, `--popover`, `--foreground`, `--muted-foreground`, `--border`, `--primary`). Playwright RGB literals match the hex tokens (`#F1F0E5`→`rgb(241, 240, 229)`, `#2d2521`→`rgb(45, 37, 33)`). ✓

## Notes for the executor
- `tw-animate-css` and `class-variance-authority` are installed as part of the shadcn foundation but not imported/used in this phase — they're for the shadcn primitives added in Phase 2. Do not add an `@import "tw-animate-css"` yet.
- Duplicate `:root` / `[data-theme="dark"]` selectors are intentional and temporary (beige source-of-truth block from Task 2 + legacy-alias block from Task 3). Both are removed/merged in Phase 3.
