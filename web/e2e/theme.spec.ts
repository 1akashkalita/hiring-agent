import { test, expect } from "@playwright/test";

const LIGHT = "rgb(247, 249, 246)"; // #F7F9F6
const DARK = "rgb(20, 31, 28)"; // #141F1C

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

test("first visit defaults to light even when the operating system prefers dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("body")).toHaveCSS("background-color", LIGHT);
});

test("app renders the Paper alpine palette in light and dark", async ({ page }) => {
  await page.goto("/");

  // Force each theme deterministically after verifying the light first-visit default above.
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  await expect(page.locator("body")).toHaveCSS("background-color", LIGHT);

  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await expect(page.locator("body")).toHaveCSS("background-color", DARK);
});

test("header exposes an icon-only two-sided theme switch beside the privacy control", async ({ page }) => {
  await page.goto("/");

  const wordmark = page.getByRole("link", { name: "Fix My Resume home" });
  await expect(wordmark).toHaveText("fixmyresume");
  await expect(wordmark).toHaveCSS("font-weight", "400");
  await expect(wordmark.locator("span")).toHaveText("my");
  await expect(wordmark.locator("span")).toHaveCSS("font-weight", "700");

  const themeSwitch = page.getByRole("switch", { name: "Choose light or dark theme" });
  await expect(themeSwitch).toBeVisible();
  await expect(themeSwitch).toHaveText("");
  await expect(themeSwitch.locator("svg")).toHaveCount(2);
  await expect(themeSwitch).toHaveAttribute("aria-checked", "false");
  await expect(themeSwitch.locator("xpath=following-sibling::*[1]")).toHaveAccessibleName(/100% private/i);

  await themeSwitch.click();
  await expect(themeSwitch).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("privacy control is distinct from active navigation and explains the real data flow", async ({ page }) => {
  await page.goto("/");
  const badge = page.getByRole("button", { name: /100% private/i });

  await expect(badge).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await badge.click();
  await expect(page.getByRole("dialog", { name: "Your resume skips our servers." })).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("browser extracts the text from your PDF locally");
  await expect(page.getByRole("dialog")).toContainText("directly to Google Gemini");
  await expect(page.getByRole("dialog")).toContainText("local browser storage");
  await expect(page.getByRole("dialog")).not.toContainText("Works offline");

  const viewport = page.viewportSize()!;
  const backdrop = await page.locator(".dialog-backdrop").boundingBox();
  const dialog = await page.getByRole("dialog").boundingBox();
  expect(backdrop?.height).toBe(viewport.height);
  expect(dialog?.y).toBeGreaterThanOrEqual(0);
  expect((dialog?.y ?? 0) + (dialog?.height ?? 0)).toBeLessThanOrEqual(viewport.height);
});

test("fresh history shows an empty state instead of loading indefinitely", async ({ page }) => {
  await page.goto("/history");

  await expect(page.getByRole("heading", { name: "No history found." })).toBeVisible();
  await expect(page.getByText("Loading history...", { exact: true })).toHaveCount(0);
});

test("only the current destination has the compact green navigation bubble", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Score" })).toHaveClass(/nav-active/);
  await expect(page.getByRole("link", { name: "Settings", exact: true })).not.toHaveClass(/nav-active/);

  await page.goto("/settings");
  const settings = page.getByRole("link", { name: "Settings", exact: true });
  await expect(settings).toHaveClass(/nav-active/);
  await expect(settings.locator("svg")).toHaveCSS("width", "22px");
  await expect(page.getByRole("link", { name: "Score", exact: true })).not.toHaveClass(/nav-active/);
});

test("persistent shell keeps the header mounted while route content transitions", async ({ page }) => {
  await page.goto("/");

  const wordmark = page.getByRole("link", { name: "Fix My Resume home" });
  await wordmark.evaluate((element) => element.setAttribute("data-shell-instance", "original"));
  await expect(page.locator("[data-motion-route]")).toBeVisible();

  await page.getByRole("link", { name: "History", exact: true }).click();
  await expect(page).toHaveURL(/\/history$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "No history found." })).toBeVisible();
  await expect(wordmark).toHaveAttribute("data-shell-instance", "original");
  await expect(page.locator("[data-motion-route]")).toBeVisible();
});

test("motion-backed controls cover navigation, theme, upload, and the model menu", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("ha-remember-keys", "true");
    localStorage.setItem("ha-gemini-key", "test-key");
  });
  await page.goto("/");

  await expect(page.locator("[data-motion-nav-indicator]")).toHaveCount(1);
  await expect(page.locator("[data-motion-theme-indicator]")).toHaveCount(1);
  await expect(page.locator("[data-motion-dropzone]")).toBeVisible();

  await page.goto("/settings");
  await page.locator("#ha-model").click();
  await expect(page.locator("[data-motion-menu]")).toBeVisible();
  await page.getByRole("option").first().press("Escape");
  await expect(page.locator("[data-motion-menu]")).toHaveCount(0);
});

test("missing-key screen sends users to settings without false privacy claims", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Add your Gemini key. Then start scoring." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open settings" })).toHaveAttribute("href", "/settings");
  await expect(page.locator("main")).toContainText("directly to Google");
  await expect(page.locator("main")).not.toContainText("never leave this device");
});

test("settings offers the current Gemini models and migrates the old default", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("ha-model", "gemini-2.5-flash"));
  await page.goto("/settings");

  await expect(page.getByRole("link", { name: "Back to score a resume" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("link", { name: "Back to score a resume" })).toHaveText("back");
  await expect(page.locator(".settings-back .back-sub")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Clear all data" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "GitHub enrichment" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Browser preferences" })).toHaveCount(0);
  await expect(page.getByRole("switch", { name: "Enable GitHub enrichment" })).toHaveCount(0);
  await expect(page.getByRole("switch", { name: "Remember keys on this device" })).toHaveCount(0);

  await page.getByRole("button", { name: "How to get a Gemini API key" }).click();
  const help = page.getByRole("dialog", { name: "Get a key in about a minute." });
  await expect(help).toContainText("Google AI Studio");
  await expect(help.getByRole("link", { name: "Open AI Studio" })).toHaveAttribute(
    "href",
    "https://aistudio.google.com/apikey",
  );
  await expect(help.getByRole("link", { name: "Open AI Studio" })).toHaveCSS("color", "rgb(247, 249, 246)");
  await help.getByRole("button", { name: "Close" }).click();

  const model = page.locator("#ha-model");
  await expect(model.locator("span:first-child")).toHaveText("Gemini 3.1 Flash-Lite");
  await model.click();
  const options = page.getByRole("option");
  await expect(options).toHaveCount(4);
  await expect(options.locator("span:first-child")).toHaveText([
    "Gemini 3 Flash Preview",
    "Gemini 3.1 Flash-Lite",
    "Gemini 3.1 Pro Preview",
    "Gemini 3.5 Flash",
  ]);
});
