import { expect, test } from "./fixtures/test";
import { auditReady, openAllSections, openDegree, savedCourse } from "./fixtures/degree";

test("ME history drives search badges and Take in C Term actions", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openDegree(page, JSON.stringify({ version: 1, sheetId: "me-2030", courses: [savedCourse({ code: "ES 2501", credits: 3, term: "A Term 2026" }), savedCourse({ code: "MA 1021", credits: 3, term: "B Term 2026" })], manual: [] }));
  const suggestions = page.getByRole("article").filter({ hasText: "Take in C Term" });
  const add = suggestions.getByRole("button", { name: /^Add .* to plan$/ }).first();
  await expect(add).toBeVisible({ timeout: 30_000 });
  const code = (await add.getAttribute("aria-label"))!.slice(4, -8);
  await add.click();
  await auditReady(page);
  await openAllSections(page);
  await expect(page.getByRole("button", { name: new RegExp(`^${code}, line \\d+, planned`) })).toBeVisible();
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Planner", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search courses" }).fill("ME 4323");
  const card = page.getByRole("region", { name: "Search results" }).getByRole("listitem").filter({ has: page.getByRole("heading", { level: 3, name: "ME 4323", exact: true }) });
  await expect(card).toContainText("Counts toward: Mechanical Systems", { timeout: 30_000 });
  await card.getByRole("button", { name: "Add ME 4323", exact: true }).click();
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "My degree", exact: true }).click();
  await auditReady(page);
  await openAllSections(page);
  await expect(page.getByRole("button", { name: /^ME 4323, line 30, planned/ })).toBeVisible();
});

for (const width of [1440, 834]) {
  test(`ME testers can select their sheet and confirm interpretations at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await openDegree(page, { courses: [savedCourse({ code: "ME 2300", credits: 3 })] });
    await page.getByRole("button", { name: "Change major" }).click();
    await page.getByRole("combobox", { name: "Major", exact: true }).click();
    await page.getByRole("option", { name: "Mechanical Engineering", exact: true }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await auditReady(page);
    await expect(page.getByText("Mechanical Engineering · Class of 2030 · Beta", { exact: true })).toBeVisible();
    await expect(page.getByText("Not yet checked by an ME student. Tell us if something looks wrong.")).toBeVisible();
    await openAllSections(page);
    await expect(page.getByRole("button", { name: /^ME 2300, line 42,/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `e2e/screenshots/degree-me-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: /^HUA theme:/ }).click();
    const controls = page.getByRole("checkbox", { name: "I confirmed Engineering elective distribution", exact: true });
    await expect(controls).not.toBeChecked();
    await expect(page.getByText(/At least two must be ME 2000\/3000-level courses/)).toBeVisible();
    await controls.focus();
    await page.keyboard.press("Space");
    await auditReady(page);
    await expect(controls).toBeChecked();
    await page.reload();
    await auditReady(page);
    await page.getByRole("button", { name: /^HUA theme:/ }).click();
    await expect(controls).toBeChecked();
    await page.screenshot({ path: `e2e/screenshots/degree-me-checks-${width}.png`, fullPage: true });
  });
}
