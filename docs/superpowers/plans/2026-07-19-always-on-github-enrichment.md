# Always-On GitHub Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make GitHub enrichment run automatically on every resume score without an enable/disable preference.

**Architecture:** Remove the `enableGitHub` feature flag from stored settings and the scoring pipeline contract. The pipeline always performs profile extraction, conditionally fetches GitHub data when a profile exists, and continues without enrichment when the profile is absent or GitHub fails.

**Tech Stack:** TypeScript, React, Next.js, Vitest, Playwright, browser localStorage, GitHub REST API

## Global Constraints

- A GitHub token remains optional and only increases GitHub API limits.
- Missing GitHub profiles and GitHub request failures must not block scoring.
- Existing `ha-enable-github` browser values must no longer affect behavior.
- Do not add a GitHub toggle to the approved Settings layout.
- Work with the existing dirty worktree and do not revert unrelated changes.

---

### Task 1: Remove The Enrichment Feature Flag

**Files:**
- Modify: `web/src/lib/pipeline.test.ts`
- Modify: `web/src/lib/settings.test.ts`
- Modify: `web/src/lib/pipeline.ts`
- Modify: `web/src/lib/settings.ts`
- Modify: `web/src/lib/schemas.ts`
- Modify: `web/src/ui/SettingsProvider.tsx`
- Modify: `web/src/lib/runScore.ts`

**Interfaces:**
- Consumes: `StoredSettings`, `PipelineDeps.settings`, `scoreResume`
- Produces: `Settings = { geminiKey: string; githubToken: string | null; model: string }` and `StoredSettings` without `enableGitHub`

- [ ] **Step 1: Write failing pipeline tests for automatic enrichment**

Replace flag-dependent fixtures with settings that contain no `enableGitHub`, and assert extraction always occurs:

```ts
it("always extracts profiles and enriches when github is present", async () => {
  const d = deps({
    settings: { geminiKey: "k", githubToken: null, model: "m" },
    fetchGitHub: vi.fn(async () => ({ profile: { username: "octocat" }, projects: [] })),
  });
  const record = await scoreResume(new ArrayBuffer(0), d);
  expect(d.runExtraction).toHaveBeenCalledOnce();
  expect(d.fetchGitHub).toHaveBeenCalledWith("https://github.com/octocat");
  expect(record.githubSummary?.profile?.username).toBe("octocat");
});

it("skips the github request when extraction finds no profile", async () => {
  const d = deps({ runExtraction: vi.fn(async () => ({ basics: { profiles: [] } })) });
  await scoreResume(new ArrayBuffer(0), d);
  expect(d.runExtraction).toHaveBeenCalledOnce();
  expect(d.fetchGitHub).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Write failing settings tests for removal of the flag**

Update expected settings objects so they omit `enableGitHub`, seed the legacy key, and prove it is ignored and removed on persistence:

```ts
localStorage.setItem("ha-enable-github", "false");
expect(loadSettings()).not.toHaveProperty("enableGitHub");

persistSettings(base());
expect(localStorage.getItem("ha-enable-github")).toBeNull();

expect(toPipelineSettings(base())).toEqual({
  geminiKey: "k",
  githubToken: null,
  model: "m",
});
```

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```bash
cd web
npx vitest run src/lib/pipeline.test.ts src/lib/settings.test.ts
```

Expected: FAIL because `enableGitHub` is still required and a false value still skips extraction.

- [ ] **Step 4: Remove `enableGitHub` from production contracts and persistence**

Change the pipeline settings type and make extraction unconditional:

```ts
export type Settings = {
  geminiKey: string;
  githubToken: string | null;
  model: string;
};

let githubSummary: GitHubSummary | null = null;
throwIfAborted(deps.signal);
deps.onProgress?.("Extracting resume");
const parsedResume = normalizeResume(await deps.runExtraction(resumeText));
const url = findGitHubProfileUrl(parsedResume);
if (url) {
  deps.onProgress?.("Enriching from GitHub");
  try {
    githubSummary = await deps.fetchGitHub(url);
  } catch {
    githubSummary = null;
  }
}
```

Remove `enableGitHub` from `StoredSettings`, provider defaults, fixtures, and `toPipelineSettings`. Delete the legacy key whenever settings persist:

```ts
const LEGACY_ENABLE_GH = "ha-enable-github";

export function persistSettings(s: StoredSettings): void {
  lsRemove(LEGACY_ENABLE_GH);
  // persist the remaining settings
}
```

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
cd web
npx vitest run src/lib/pipeline.test.ts src/lib/settings.test.ts
```

Expected: both test files pass with no warnings.

### Task 2: Align Progress And Privacy Copy

**Files:**
- Modify: `web/src/ui/screens/ScoreScreen.tsx`
- Modify: `web/src/ui/PrivacyChip.tsx`
- Modify: `web/e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: progress messages emitted by `scoreResume`
- Produces: a single always-on stage sequence and accurate privacy explanation

- [ ] **Step 1: Add a failing browser assertion for the automatic stages**

In the scoring smoke test, assert the automatic stages appear after choosing a PDF:

```ts
await expect(page.getByText("Finding structured details")).toBeVisible();
await expect(page.getByText("Reading public GitHub projects")).toBeVisible();
```

- [ ] **Step 2: Run the focused browser test and verify RED**

Run with no separate development server active:

```bash
cd web
PORT=3100 npx playwright test e2e/smoke.spec.ts
```

Expected: FAIL because the current stage list depends on the removed setting.

- [ ] **Step 3: Use one always-on progress sequence and update privacy text**

Replace the conditional stage constants with:

```ts
const STAGES = [
  "Reading PDF",
  "Extracting resume",
  "Enriching from GitHub",
  "Scoring",
  "Coaching",
];
```

Update the privacy dialog footnote to explain that public GitHub enrichment runs automatically when the resume includes a GitHub profile and connects directly to GitHub's API.

- [ ] **Step 4: Run the focused browser test and verify GREEN**

Run:

```bash
cd web
PORT=3100 npx playwright test e2e/smoke.spec.ts
```

Expected: PASS.

### Task 3: Update Documentation And Verify The Product

**Files:**
- Modify: `README.md`
- Modify: `web/README.md`

**Interfaces:**
- Consumes: the final always-on pipeline behavior
- Produces: public documentation that accurately describes automatic enrichment

- [ ] **Step 1: Replace obsolete documentation language**

Change references to "optional enrichment" and "when enabled" so they state:

```md
When a resume contains a GitHub profile, the scorer automatically fetches public profile and repository evidence. A GitHub token is optional and only raises the API rate limit.
```

Document that each run makes extraction, scoring, and coaching Gemini calls because extraction is now always required to locate profile links.

- [ ] **Step 2: Scan for obsolete feature-flag references**

Run:

```bash
rg -n "enableGitHub|ha-enable-github|optional GitHub enrichment|when GitHub enrichment is enabled" web/src web/README.md README.md
```

Expected: only the intentional legacy-key cleanup and its test remain.

- [ ] **Step 3: Run the complete verification suite**

Run sequentially:

```bash
cd web
npm test
npx tsc --noEmit
npm run build
PORT=3100 npm run e2e
cd ..
git diff --check
```

Expected: 0 failures, successful production build, all end-to-end tests passing, and no whitespace errors.

- [ ] **Step 4: Preserve the implementation in the existing branch**

Do not commit shared dirty files unless the user explicitly asks for a commit. Report the exact verification results and keep the local preview available.

