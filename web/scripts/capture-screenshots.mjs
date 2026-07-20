import { chromium } from "@playwright/test";
import { resolve } from "node:path";

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? "http://127.0.0.1:3000";
const OUTPUT_DIR = resolve("docs/screenshots");
const requestedFiles = new Set(process.argv.slice(2));
const now = Date.now();

function wants(fileName) {
  return requestedFiles.size === 0 || requestedFiles.has(fileName);
}

function evaluation(scores, bonus) {
  return {
    is_resume: true,
    scores,
    bonus_points: { total: bonus, breakdown: "Active open-source maintainer." },
    deductions: { total: 0, reasons: "None." },
    key_strengths: ["Open-source contributions", "Shipped self-directed projects"],
    areas_for_improvement: ["Quantify production impact"],
  };
}

const coach = {
  verdict: "Strong builder - now thin on production.",
  fixes: [
    {
      priority: 1,
      category: "production",
      title: "Quantify your internship impact",
      detail: "Production is your weakest category. Add 2-3 bullets with numbers - latency cut, users served, load handled - so the work reads as real shipped impact.",
      estGain: 8,
    },
    {
      priority: 2,
      category: "self_projects",
      title: "Ship one project to real users",
      detail: "You're one rung below the top band. A deployed project with even modest real adoption is what moves it.",
      estGain: 6,
    },
    {
      priority: 3,
      category: "open_source",
      title: "Link the pull requests directly",
      detail: "Your open-source claims are strong but unlinked. Add the PR URLs so a reviewer can verify them at a glance.",
      estGain: 3,
    },
  ],
  boosts: [
    {
      category: "technical_skills",
      text: "One point off max - show depth in a single area, a performance win or a tricky bug fixed, rather than more breadth.",
      estGain: 1,
    },
    {
      category: "open_source",
      text: "Triage or review issues on the projects you've contributed to - sustained involvement nudges this higher.",
      estGain: 2,
    },
    {
      category: "self_projects",
      text: "Add a short architecture note to your best project so its real complexity is legible at a glance.",
      estGain: 2,
    },
  ],
};

const runs = [
  {
    id: "resume-v1",
    createdAt: now - 30 * 24 * 60 * 60 * 1000,
    fileName: "resume_v1.pdf",
    model: "gemini-3.1-flash-lite",
    parsedResume: { basics: { name: "Demo Candidate", profiles: [] } },
    evaluation: evaluation({
      open_source: { score: 20, max: 35, evidence: "Early contributions to community projects." },
      self_projects: { score: 17, max: 30, evidence: "Personal projects show initiative." },
      production: { score: 10, max: 25, evidence: "One internship with limited impact detail." },
      technical_skills: { score: 9, max: 10, evidence: "Broad, current engineering stack." },
    }, 10),
    coach,
  },
  {
    id: "resume-v2",
    createdAt: now - 12 * 24 * 60 * 60 * 1000,
    fileName: "resume_v2.pdf",
    model: "gemini-3.1-flash-lite",
    parsedResume: { basics: { name: "Demo Candidate", profiles: [] } },
    evaluation: evaluation({
      open_source: { score: 23, max: 35, evidence: "Linked contributions to community projects." },
      self_projects: { score: 20, max: 30, evidence: "Two complete full-stack projects." },
      production: { score: 10, max: 25, evidence: "One internship with limited impact detail." },
      technical_skills: { score: 10, max: 10, evidence: "Broad and well-evidenced engineering stack." },
    }, 12),
    coach,
  },
  {
    id: "resume-v3",
    createdAt: now,
    fileName: "resume_v3.pdf",
    label: "My SWE resume",
    model: "gemini-3.1-flash-lite",
    parsedResume: { basics: { name: "Demo Candidate", profiles: [] } },
    evaluation: evaluation({
      open_source: { score: 28, max: 35, evidence: "3 merged PRs to libraries with 1k+ stars; real outside contributions, not just personal repos." },
      self_projects: { score: 22, max: 30, evidence: "Two full-stack apps with auth + DB and live demos. Add one with real users to reach the top band." },
      production: { score: 10, max: 25, evidence: "One internship, no scope or impact described. Quantify what shipped and who it affected." },
      technical_skills: { score: 9, max: 10, evidence: "Broad and evidenced across projects and work. Little headroom left here." },
    }, 12),
    coach,
  },
];

async function seed(page) {
  await page.goto(BASE_URL);
  await page.evaluate(async (records) => {
    localStorage.setItem("ha-theme", "light");
    localStorage.setItem("ha-remember-keys", "true");
    localStorage.setItem("ha-gemini-key", "demo-gemini-api-key");
    localStorage.setItem("ha-github-token", "");
    localStorage.setItem("ha-model", "gemini-3.1-flash-lite");
    localStorage.setItem("ha-enable-github", "false");
    await new Promise((resolvePromise, reject) => {
      const request = indexedDB.open("hiring-agent", 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("runs")) {
          const store = db.createObjectStore("runs", { keyPath: "id" });
          store.createIndex("by-createdAt", "createdAt");
        }
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("runs", "readwrite");
        const store = transaction.objectStore("runs");
        store.clear();
        for (const record of records) store.put(record);
        transaction.oncomplete = () => {
          db.close();
          resolvePromise(undefined);
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }, runs);
}

async function capture(context, path, fileName, readySelector, theme = "light") {
  const page = await context.newPage();
  try {
    await page.addInitScript((nextTheme) => localStorage.setItem("ha-theme", nextTheme), theme);
    const targetPath = process.env.SCREENSHOT_STATIC === "1" && path !== "/"
      ? path.includes("?") ? path.replace("?", ".html?") : `${path}.html`
      : path;
    await page.goto(`${BASE_URL}${targetPath}`);
    await page.locator(readySelector).waitFor({ state: "visible" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    await page.screenshot({ path: resolve(OUTPUT_DIR, fileName), fullPage: true });
  } finally {
    await page.close();
  }
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 860 },
  deviceScaleFactor: 2,
  colorScheme: "light",
  reducedMotion: "reduce",
});
const page = await context.newPage();

try {
  await seed(page);
  await page.close();
  if (wants("01-score.png")) await capture(context, "/", "01-score.png", ".score-page");
  if (wants("02-results.png")) await capture(context, "/results?run=resume-v3", "02-results.png", ".scorebar");
  if (wants("03-history.png")) await capture(context, "/history", "03-history.png", ".stats-grid");
  if (wants("04-diff.png")) await capture(context, "/diff?a=resume-v3&b=resume-v2", "04-diff.png", ".diff-totals");
  if (wants("05-settings.png")) await capture(context, "/settings", "05-settings.png", ".settings-layout");
  if (wants("06-results-dark.png")) await capture(context, "/results?run=resume-v3", "06-results-dark.png", ".scorebar", "dark");
  if (wants("07-history-dark.png")) await capture(context, "/history", "07-history-dark.png", ".stats-grid", "dark");
} finally {
  await browser.close();
}
