import { expect, test } from "./fixtures/test";
import { auditReady, openAllSections, openDegree, savedCourse } from "./fixtures/degree";
import { SUGGESTIONS_ON } from "../src/components/degree/degreeFeatures";

test("DS history drives search badges and explicit course suggestions", async ({ page }) => {
  test.skip(!SUGGESTIONS_ON, "Suggestions are paused");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openDegree(page, JSON.stringify({ version: 1, sheetId: "ds-2030", courses: [savedCourse({ code: "DS 1010", credits: 3, term: "A Term 2026" }), savedCourse({ code: "MA 1021", credits: 3, term: "B Term 2026" })], manual: [] }));
  await page.getByRole("button", { name: "Sheet options" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Suggest courses", exact: true }).click();
  const suggestions = page.getByRole("region", { name: "Suggest courses", exact: true });
  await suggestions.getByRole("combobox", { name: "Term to plan for" }).selectOption("C Term 2027");
  const add = suggestions.getByRole("button", { name: /^Plan .* for C Term 2027$/ }).first();
  await expect(add).toBeVisible({ timeout: 60_000 });
  const code = (await add.getAttribute("aria-label"))!.replace(/^Plan /, "").replace(/ for C Term 2027$/, "");
  await add.click();
  await page.keyboard.press("Escape");
  await auditReady(page);
  await openAllSections(page);
  await expect(page.getByRole("button", { name: new RegExp(`^${code}, line \\d+, planned`) })).toBeVisible();
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Planner", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search courses" }).fill("DS 2010");
  const card = page.getByRole("region", { name: "Search results" }).getByRole("listitem").filter({ has: page.getByRole("heading", { level: 3, name: "DS 2010", exact: true }) });
  await expect(card).toContainText("Counts toward: Data Science Core", { timeout: 30_000 });
  await card.getByRole("button", { name: "Add DS 2010", exact: true }).click();
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "My degree", exact: true }).click();
  await auditReady(page);
  await openAllSections(page);
  await expect(page.getByRole("button", { name: /^DS 2010, line 17, planned/ })).toHaveCount(0);
});

for (const width of [1440, 834]) {
  test(`DS testers can select their sheet and confirm interpretations at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await openDegree(page, { courses: [savedCourse({ code: "DS 1010", credits: 3 })] });
    await page.getByRole("button", { name: "Change major" }).click();
    await page.getByRole("combobox", { name: "Major", exact: true }).click();
    await page.getByRole("option", { name: "Data Science", exact: true }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await auditReady(page);
    await expect(page.getByText("Data Science · Class of 2030 · Beta", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /^DS 2030 tracking sheet/ })).toBeVisible();
    await openAllSections(page);
    await expect(page.getByRole("button", { name: /^DS 1010, line 16,/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `e2e/screenshots/degree-ds-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: /^HUA theme:/ }).click();
    const controls = page.getByRole("checkbox", { name: "I confirmed DS elective source differences", exact: true });
    await expect(controls).not.toBeChecked();
    await expect(page.getByText(/The 2030 sheet includes CS 4343/)).toBeVisible();
    await controls.focus();
    await page.keyboard.press("Space");
    await auditReady(page);
    await expect(controls).toBeChecked();
    await page.reload();
    await auditReady(page);
    await page.getByRole("button", { name: /^HUA theme:/ }).click();
    await expect(controls).toBeChecked();
    await page.screenshot({ path: `e2e/screenshots/degree-ds-checks-${width}.png`, fullPage: true });
  });
}
