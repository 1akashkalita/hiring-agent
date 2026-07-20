# Favicon And Tab Branding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy favicon with the approved `my` monogram and set the browser-tab title to `fixmyresume`.

**Architecture:** Keep branding metadata in the root Next.js layout and retain the App Router file-based `icon.svg`. Verify the browser-visible title and fetched icon asset through Playwright, then inspect rasterized favicon output at real display sizes.

**Tech Stack:** Next.js metadata, SVG, TypeScript, Playwright, Chromium

## Global Constraints

- The browser title is exactly `fixmyresume`.
- The favicon background is `#DCEAE4` and the monogram is `#174C3C`.
- The favicon contains no legacy purple, serif `F`, gradients, or shadows.
- Social-sharing titles remain descriptive.
- Work with the existing dirty worktree and do not revert unrelated changes.

---

### Task 1: Add Browser Branding Coverage

**Files:**
- Modify: `web/e2e/theme.spec.ts`

**Interfaces:**
- Consumes: document metadata and the generated `link[rel="icon"]`
- Produces: browser assertions for the title and favicon SVG

- [ ] **Step 1: Write a failing browser test**

```ts
test("uses the fixmyresume tab title and alpine monogram favicon", async ({ page, request }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("fixmyresume");

  const href = await page.locator('link[rel="icon"]').getAttribute("href");
  expect(href).toBeTruthy();
  const response = await request.get(new URL(href!, page.url()).toString());
  expect(response.ok()).toBe(true);
  const svg = await response.text();
  expect(svg).toContain("#DCEAE4");
  expect(svg).toContain("#174C3C");
  expect(svg).toContain('aria-label="my"');
  expect(svg).not.toContain("#3A2DD0");
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run with no separate development server active:

```bash
cd web
PORT=3100 npx playwright test e2e/theme.spec.ts -g "tab title"
```

Expected: FAIL because the current title is `Fix My Resume` and the favicon uses purple `#3A2DD0`.

### Task 2: Implement The Approved Branding

**Files:**
- Modify: `web/src/app/layout.tsx`
- Modify: `web/src/app/icon.svg`

**Interfaces:**
- Consumes: Next.js root metadata and file-based icon discovery
- Produces: lowercase browser title and self-contained monogram favicon

- [ ] **Step 1: Update root title metadata**

```ts
export const metadata: Metadata = {
  metadataBase: new URL("https://fixmyresume.dev"),
  title: "fixmyresume",
  applicationName: "fixmyresume",
  // Keep the existing description, Open Graph, and Twitter metadata.
};
```

- [ ] **Step 2: Replace the favicon SVG**

Use the approved palette and a heavy geometric lowercase monogram:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" role="img" aria-label="my">
  <rect width="32" height="32" rx="8" fill="#DCEAE4"/>
  <text x="16" y="21.5" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="800" letter-spacing="-1" fill="#174C3C">my</text>
</svg>
```

- [ ] **Step 3: Run the focused browser test and verify GREEN**

```bash
cd web
PORT=3100 npx playwright test e2e/theme.spec.ts -g "tab title"
```

Expected: PASS.

### Task 3: Visual And Regression Verification

**Files:**
- Verify only

**Interfaces:**
- Consumes: `/icon.svg` and final application metadata
- Produces: verified small-size legibility and regression status

- [ ] **Step 1: Rasterize and inspect the favicon**

Use Chromium to render the SVG at 16px, 32px, and 256px on a neutral background. Capture a combined screenshot and inspect it for legibility, centering, correct colors, and the absence of clipped pixels.

- [ ] **Step 2: Run full verification sequentially**

```bash
cd web
npm test
npx tsc --noEmit
npm run build
PORT=3100 npm run e2e
cd ..
git diff --check
```

Expected: all unit tests, type checking, production build, browser tests, and whitespace checks pass.

- [ ] **Step 3: Preserve the implementation in the existing branch**

Do not commit shared dirty files unless the user explicitly asks for a commit. Restart the local preview on port 3001 and report the verification results.

