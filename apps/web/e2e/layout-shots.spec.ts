import { expect, test } from "./fixtures/test";
import type { Page } from "@playwright/test";
import { fixtureHistory, openDegree } from "./fixtures/degree";

const stage = process.env.LAYOUT_SHOTS ?? "after";

async function openPlanner(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("goatplan:term:v1", "2027-C");
    localStorage.setItem("goatplan:tutorial:v1", "dismissed");
    localStorage.setItem("goatplan:degree:v1", "on");
    localStorage.setItem(
      "goatplan:draft:v1:2027-C",
      JSON.stringify({ version: 1, courses: ["MA 1022", "PH 1110", "AE 2320"], preferences: { startsAfter: 540, blocked: [], onlyOpen: false }, locks: {}, professorByCourse: {}, sortPreset: "bestOverall", alternatives: {} }),
    );
  });
  await page.goto("/");
  await expect(page.locator("[data-planner-term-status]")).toHaveAttribute("data-planner-term-status", "ready", { timeout: 30_000 });
  await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done", { timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
}

for (const [width, height] of [[1440, 900], [834, 1112], [375, 812]] as const) {
  test(`layout screenshots at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openPlanner(page);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `e2e/screenshots/layout/planner-${width}-${stage}.png`, animations: "disabled" });
    const mid = fixtureHistory("degree-history-mid.json");
    await page.context().clearCookies();
    await openDegree(page, { ...mid, courses: mid.courses.map((course, index) => ({ ...course, term: index % 3 === 0 ? "A Term 2026" : index % 3 === 1 ? "B Term 2026" : "Prior credit" })) });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `e2e/screenshots/layout/degree-${width}-${stage}.png`, animations: "disabled", fullPage: true });
  });
}

test("the calendar header at 1280 when seats failed to refresh", async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await context.route("**/api/seats?*", (route) => route.abort());
  await openPlanner(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `e2e/screenshots/layout/planner-1280-seats-failed-${stage}.png`, animations: "disabled" });
});
