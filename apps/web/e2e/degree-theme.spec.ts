import { expect, test } from "./fixtures/test";
import { auditReady, fixtureHistory, openAllSections, openDegree, openHistory, panel } from "./fixtures/degree";

test("My degree shares the planner theme and keyboard control across navigation and reload", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("degree-theme-seeded")) {
      localStorage.setItem("goatplan:theme:v1", "dark");
      sessionStorage.setItem("degree-theme-seeded", "yes");
    }
  });
  await openDegree(page, fixtureHistory("degree-history-mid.json"));
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  const light = page.getByRole("button", { name: "Switch to light theme" }).filter({ visible: true });
  await expect(light).toBeVisible();
  await light.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeFocused();
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await page.reload();
  await auditReady(page);
  await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeVisible();
  await page.getByRole("link", { name: "Planner", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Schedule planner", exact: true })).toBeAttached();
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await page.getByRole("button", { name: "Switch to dark theme" }).filter({ visible: true }).click();
  await page.getByRole("link", { name: "My degree", exact: true }).click();
  await expect(page).toHaveURL("/degree");
  await auditReady(page);
  await expect(light).toBeVisible();
  await page.reload();
  await auditReady(page);
  await expect(light).toBeVisible();
});

for (const width of [1440, 834]) {
  for (const theme of ["light", "dark"]) {
    test(`degree sheet, history, pickers and feedback work in ${theme} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 834 ? 1112 : 900 });
      await page.addInitScript((theme) => localStorage.setItem("goatplan:theme:v1", theme), theme);
      const history = fixtureHistory("degree-history-mid.json");
      await openDegree(page, {
        ...history,
        courses: [
          ...history.courses.map((course, index) => ({ ...course, term: index % 2 ? "A Term 2026" : "B Term 2026" })),
          { code: "CS 2999", credits: 3, title: "", source: "typed", apIb: false, status: "taken" },
        ],
        pins: [{ code: "CS 2022", line: 38 }],
      });
      await expect(page.getByText("Looking through this term’s courses…")).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      const capture = (name: string) => page.screenshot({ path: `e2e/screenshots/degree-theme-${name}-${theme}-${width}.png`, animations: "disabled", fullPage: true });
      await expect(page.locator("html")).toHaveCSS("color-scheme", theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await capture("sheet");
      const views = page.getByRole("navigation", { name: "Degree views" });
      await views.getByRole("button", { name: "Plan ahead" }).click();
      await page.getByRole("heading", { name: "Credits per term", exact: true }).scrollIntoViewIfNeeded();
      await expect(page.getByRole("figure", { name: "Units per term chart" })).toBeVisible();
      const chart = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Credits per term", exact: true }) });
      await chart.screenshot({ path: `e2e/screenshots/degree-theme-chart-${theme}-${width}.png`, animations: "disabled" });
      await page.getByRole("button", { name: "Show as table" }).click();
      await chart.screenshot({ path: `e2e/screenshots/degree-theme-chart-table-${theme}-${width}.png`, animations: "disabled" });
      await page.getByRole("button", { name: "Show chart" }).click();
      await views.getByRole("button", { name: "Sheet" }).click();
      await openAllSections(page);
      await expect(page.getByRole("button", { name: /^CS 2022, line 38, done, pinned/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /^CS 3041, line \d+, (planned|in progress)/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /^CS 2999, line \d+, check this yourself/ })).toBeVisible();
      await expect(page.getByRole("combobox", { name: "Term", exact: true })).toHaveCount(0);
      await openHistory(page);
      await capture("history");
      await panel(page, "Course history").getByRole("button", { name: "Edit CS 2022" }).click();
      const details = panel(page, "Edit course");
      await expect(details).toBeVisible();
      await capture("details");
      await details.getByRole("radio", { name: "Other" }).click();
      await details.getByRole("textbox", { name: "Units", exact: true }).fill("invalid");
      await details.getByRole("button", { name: "Save changes" }).click();
      await expect(details.getByText("Enter WPI units, like 1/3 or 1/6.")).toBeVisible();
      await capture("feedback");
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: /See the courses behind it/ }).first().click();
      await expect(panel(page, "Requirement checks")).toBeVisible();
      await capture("checks");
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "List", exact: true }).click();
      await expect(page.getByRole("region", { name: "Your requirements" })).toBeVisible();
      await capture("list");
    });
  }
}

test("degree print colors stay Light while Dark is selected", async ({ page }) => {
  await openDegree(page, fixtureHistory("degree-history-mid.json"));
  const colors = () => page.locator("html").evaluate((root) => {
    const style = getComputedStyle(root);
    return ["canvas", "ink", "surface", "tile-done", "tile-empty", "tile-check", "tile-planned-line", "chart-done", "chart-planned", "chart-grid", "track"]
      .map((token) => style.getPropertyValue(`--color-${token}`).trim());
  });
  const light = await colors();
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  expect(await colors()).not.toEqual(light);
  await page.emulateMedia({ media: "print" });
  expect(await colors()).toEqual(light);
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await page.emulateMedia({ media: "screen" });
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
});

for (const theme of ["light", "dark"]) {
  test(`the first degree visit works in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript((theme) => localStorage.setItem("goatplan:theme:v1", theme), theme);
    await openDegree(page);
    await expect(page.getByRole("heading", { name: "Your sheet starts here" })).toBeVisible();
    await page.screenshot({ path: `e2e/screenshots/degree-theme-first-visit-${theme}-1440.png`, animations: "disabled", fullPage: true });
    await page.getByRole("button", { name: "Add AP or IB credit" }).click();
    await expect(panel(page, "Add manual credit")).toBeVisible();
    await page.screenshot({ path: `e2e/screenshots/degree-theme-manual-${theme}-1440.png`, animations: "disabled" });
  });
}
