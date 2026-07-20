# Unified Motion System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drive every intentional spatial and visibility transition in the website through one reduced-motion-aware Framer Motion system.

**Architecture:** The root layout owns one persistent `AppShell`; a keyed route transition animates only page content. Shared variants and hooks in `motion.tsx` power screens, conditional states, menus, navigation indicators, interactive surfaces, and SVG charts without changing application data flow.

**Tech Stack:** Next.js 15 App Router, React 19, Framer Motion 12, TypeScript, Playwright, Vitest.

## Global Constraints

- Preserve the Paper Alpine layout, typography, palette, copy, scoring behavior, storage behavior, and custom controls.
- Keep spatial movement at 14px or less and interaction movement at 2px or less.
- Use `useReducedMotion()` so reduced-motion users receive fully visible static content.
- Keep color-only hover transitions in CSS; remove CSS transitions that animate transforms, position, size, or visibility.

---

### Task 1: Persistent Shell And Route Transitions

**Files:**
- Create: `web/src/ui/RouteTransition.tsx`
- Modify: `web/src/ui/AppShell.tsx`
- Modify: `web/src/app/layout.tsx`
- Modify: `web/src/app/page.tsx`
- Modify: `web/src/app/history/page.tsx`
- Modify: `web/src/app/settings/page.tsx`
- Modify: `web/src/app/results/page.tsx`
- Modify: `web/src/app/diff/page.tsx`
- Test: `web/e2e/theme.spec.ts`

**Interfaces:**
- Produces: `RouteTransition({ routeKey, children })` and persistent `AppShell({ children })`.
- Consumes: `usePathname()` and shared motion tokens from `motion.tsx`.

- [ ] **Step 1: Write the failing browser test**

Add a test that writes a marker attribute onto the live wordmark, navigates from Score to History, verifies the marker remains on the same persistent shell, and verifies a `[data-motion-route]` wrapper exists.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `PORT=3100 npx playwright test e2e/theme.spec.ts --grep "persistent shell"`

Expected: FAIL because the current page-level `AppShell` remounts and no motion wrapper exists.

- [ ] **Step 3: Implement the persistent shell**

Move `AppShell` into `layout.tsx`, derive active navigation from `usePathname()`, remove page-level shell wrappers, and wrap page children in a keyed `AnimatePresence` route transition.

- [ ] **Step 4: Run the focused test**

Run: `PORT=3100 npx playwright test e2e/theme.spec.ts --grep "persistent shell"`

Expected: PASS.

### Task 2: Shared Presence And Interaction Motion

**Files:**
- Modify: `web/src/ui/motion.tsx`
- Modify: `web/src/ui/AppShell.tsx`
- Modify: `web/src/ui/ThemeToggle.tsx`
- Modify: `web/src/ui/Dropzone.tsx`
- Modify: `web/src/ui/screens/SettingsScreen.tsx`
- Modify: `web/src/ui/screens/ScoreScreen.tsx`
- Modify: `web/src/app/globals.css`
- Test: `web/e2e/theme.spec.ts`

**Interfaces:**
- Produces: shared route, presence, stagger, and interaction variants.
- Consumes: Framer Motion `motion`, `AnimatePresence`, `LayoutGroup`, and `useReducedMotion`.

- [ ] **Step 1: Write failing dropdown and navigation motion assertions**

Require motion markers on the active navigation indicator, theme indicator, dropzone, and model menu; verify the menu enters and exits without changing listbox behavior.

- [ ] **Step 2: Run the focused checks and confirm they fail**

Run: `PORT=3100 npx playwright test e2e/theme.spec.ts --grep "motion-backed controls"`

Expected: FAIL because these surfaces are currently CSS-driven or appear abruptly.

- [ ] **Step 3: Implement motion-backed controls and states**

Use shared layout indicators for active nav and theme, `motion.div` for the dropzone, `AnimatePresence` for model options and save status, and keyed presence transitions for Score screen modes. Remove the corresponding CSS transform and visibility transitions.

- [ ] **Step 4: Run the focused checks**

Run: `PORT=3100 npx playwright test e2e/theme.spec.ts --grep "motion-backed controls"`

Expected: PASS.

### Task 3: Screen, List, And Chart Motion

**Files:**
- Modify: `web/src/ui/screens/ResultsScreen.tsx`
- Modify: `web/src/ui/screens/HistoryScreen.tsx`
- Modify: `web/src/ui/screens/DiffScreen.tsx`
- Modify: `web/src/ui/screens/SettingsScreen.tsx`
- Modify: `web/src/ui/TotalChart.tsx`
- Modify: `web/src/ui/Sparkline.tsx`
- Modify: `web/src/ui/CoachSection.tsx`
- Modify: `web/src/ui/HistoryTable.tsx`
- Modify: `web/src/ui/RevisionRail.tsx`
- Test: `web/e2e/smoke.spec.ts`

**Interfaces:**
- Produces: motion-marked charts and staggered content groups.
- Consumes: `fadeUp`, `useReveal`, `useStagger`, and reduced-motion chart props from `motion.tsx`.

- [ ] **Step 1: Add failing score-result motion assertions**

After the stubbed scoring flow reaches Results, require a motion-backed score report and animated chart/category markers.

- [ ] **Step 2: Run the smoke test and confirm it fails**

Run: `PORT=3100 npx playwright test e2e/smoke.spec.ts`

Expected: FAIL because the current result screen and SVG charts lack the motion contract.

- [ ] **Step 3: Implement staggered screens and SVG drawing**

Apply shared reveal/stagger variants to result, history, diff, settings, coach, table, and revision groups. Convert chart paths, areas, and nodes to motion SVG elements with static reduced-motion fallbacks.

- [ ] **Step 4: Run the smoke test**

Run: `PORT=3100 npx playwright test e2e/smoke.spec.ts`

Expected: PASS.

### Task 4: Verification And Screenshots

**Files:**
- Modify: `web/docs/screenshots/01-score.png`
- Modify: `web/docs/screenshots/02-results.png`
- Modify: `web/docs/screenshots/03-history.png`
- Modify: `web/docs/screenshots/04-diff.png`
- Modify: `web/docs/screenshots/05-settings.png`
- Modify: `web/docs/screenshots/06-results-dark.png`
- Modify: `web/docs/screenshots/07-history-dark.png`

- [ ] **Step 1: Run unit tests and TypeScript**

Run: `npm test && npx tsc --noEmit`

Expected: 94 unit tests pass and TypeScript exits 0.

- [ ] **Step 2: Run the complete browser suite**

Run: `PORT=3100 npm run e2e`

Expected: all Playwright tests pass.

- [ ] **Step 3: Build production output**

Run: `npm run build`

Expected: all static routes build and export successfully.

- [ ] **Step 4: Regenerate screenshots and inspect desktop/mobile output**

Run: `SCREENSHOT_BASE_URL=http://127.0.0.1:3001 npm run screenshots`

Expected: all seven screenshots render without clipping, overlap, or blank animated content.
