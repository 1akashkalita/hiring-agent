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
