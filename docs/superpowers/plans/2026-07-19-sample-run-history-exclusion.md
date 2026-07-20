# Sample Run History Exclusion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display complete results for the bundled sample resume without adding sample runs to persistent history.

**Architecture:** Add a tab-scoped transient run store backed by `sessionStorage`. The shared run loader falls back to transient storage, while history listing continues to read only IndexedDB.

**Tech Stack:** TypeScript, React, Next.js, Vitest, IndexedDB, sessionStorage

## Global Constraints

- Identify sample scoring at the call site, not by filename.
- Never write a sample run to IndexedDB as a fallback.
- Normal uploaded resumes must continue to save persistently.
- Clearing browser data must remove transient sample runs.
- Work with the existing dirty worktree and do not revert unrelated changes.

---

### Task 1: Add Tab-Scoped Run Storage

**Files:**
- Modify: `web/src/lib/store.test.ts`
- Modify: `web/src/lib/store.ts`

**Interfaces:**
- Consumes: `RunRecord`
- Produces: `saveTransientRun(rec: RunRecord): Promise<void>` and transient fallback in `getRun(id)`

- [ ] **Step 1: Write failing transient storage tests**

Run the store tests in jsdom so the real tab-storage API is exercised:

```ts
// @vitest-environment jsdom
```

```ts
it("loads a transient run without adding it to history", async () => {
  const run = makeRun("sample", 100);
  await saveTransientRun(run);
  expect(await getRun("sample")).toEqual(run);
  expect(await listRuns()).toEqual([]);
});

it("clearAllRuns removes transient runs", async () => {
  await saveTransientRun(makeRun("sample", 100));
  await clearAllRuns();
  expect(await getRun("sample")).toBeUndefined();
});
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
cd web
npx vitest run src/lib/store.test.ts
```

Expected: FAIL because `saveTransientRun` does not exist.

- [ ] **Step 3: Implement transient storage**

Use one key per run so cleanup is deterministic:

```ts
const TRANSIENT_PREFIX = "ha-transient-run:";

export async function saveTransientRun(rec: RunRecord): Promise<void> {
  sessionStorage.setItem(`${TRANSIENT_PREFIX}${rec.id}`, JSON.stringify(rec));
}

function getTransientRun(id: string): RunRecord | undefined {
  try {
    const raw = sessionStorage.getItem(`${TRANSIENT_PREFIX}${id}`);
    return raw ? JSON.parse(raw) as RunRecord : undefined;
  } catch {
    return undefined;
  }
}
```

Make `getRun` fall back to `getTransientRun`. Remove matching transient keys in `deleteRun`, and remove every prefixed key in `clearAllRuns`.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```bash
cd web
npx vitest run src/lib/store.test.ts
```

Expected: all store tests pass.

### Task 2: Route Sample Scores To Transient Storage

**Files:**
- Modify: `web/src/ui/screens/ScoreScreen.tsx`
- Modify: `web/e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `saveRun`, `saveTransientRun`, `handleFile(file, persistence)`
- Produces: bundled sample results that load normally but do not appear in `listRuns()`

- [ ] **Step 1: Add an isolated sample end-to-end test**

Use a fresh Playwright page with stubbed Gemini responses, score the sample, then navigate to History and assert the empty state. Keep this separate from the uploaded-resume test because that test intentionally creates persistent history:

```ts
await page.getByRole("link", { name: "Score", exact: true }).click();
await page.getByRole("button", { name: "Score a sample resume" }).click();
await page.waitForURL("**/results?run=*");
await page.getByRole("link", { name: "History", exact: true }).click();
await expect(page.getByText("No history found.")).toBeVisible();
```

- [ ] **Step 2: Route persistence explicitly**

Change the file handler signature and storage selection:

```ts
async function handleFile(file: File, persistence: "history" | "transient" = "history") {
  // score the run
  if (persistence === "transient") await saveTransientRun(run);
  else await saveRun(run);
}
```

Call `handleFile(file, "transient")` only from `scoreSample`. Dropzone uploads continue calling the default history mode, including user files named `sample-resume.pdf`.

- [ ] **Step 3: Run the browser test and verify GREEN**

Run with no separate development server active:

```bash
cd web
PORT=3100 npx playwright test e2e/smoke.spec.ts
```

Expected: the sample report loads and History shows `No history found.`

### Task 3: Verify Both Active Changes

**Files:**
- Verify only

**Interfaces:**
- Consumes: always-on GitHub enrichment and transient sample storage
- Produces: verified integrated frontend behavior

- [ ] **Step 1: Run static and unit verification**

```bash
cd web
npm test
npx tsc --noEmit
```

Expected: all tests and type checking pass.

- [ ] **Step 2: Run production and browser verification sequentially**

```bash
cd web
npm run build
PORT=3100 npm run e2e
cd ..
git diff --check
```

Expected: production build and all browser tests pass with no whitespace errors.

- [ ] **Step 3: Preserve the implementation in the existing branch**

Do not commit shared dirty files unless the user explicitly asks for a commit. Report the exact verification results and keep the local preview available.
