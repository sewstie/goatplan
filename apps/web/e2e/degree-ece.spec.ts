import { expect, test } from "./fixtures/test";
import { auditReady, openAllSections, openDegree, savedCourse } from "./fixtures/degree";

test("ECE history drives search badges and Take in C Term actions", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openDegree(page, JSON.stringify({ version: 1, sheetId: "ece-2030", courses: [savedCourse({ code: "ECE 2010", credits: 3, term: "A Term 2026" }), savedCourse({ code: "MA 1021", credits: 3, term: "B Term 2026" })], manual: [] }));
  const suggestions = page.getByRole("article").filter({ hasText: "Take in C Term" });
  const add = suggestions.getByRole("button", { name: /^Add .* to plan$/ }).first();
  await expect(add).toBeVisible({ timeout: 30_000 });
  const code = (await add.getAttribute("aria-label"))!.slice(4, -8);
  await add.click();
  await auditReady(page);
  await openAllSections(page);
  await expect(page.getByRole("button", { name: new RegExp(`^${code}, line \\d+, planned`) })).toBeVisible();
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Planner", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search courses" }).fill("ECE 2112");
  const card = page.getByRole("region", { name: "Search results" }).getByRole("listitem").filter({ has: page.getByRole("heading", { level: 3, name: "ECE 2112", exact: true }) });
  await expect(card).toContainText("Counts toward: Electrical Engineering", { timeout: 30_000 });
  await card.getByRole("button", { name: "Add ECE 2112", exact: true }).click();
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "My degree", exact: true }).click();
  await auditReady(page);
  await openAllSections(page);
  await expect(page.getByRole("button", { name: /^ECE 2112, line 32, planned/ })).toBeVisible();
});

for (const width of [1440, 834]) {
  test(`ECE testers can select their sheet and confirm interpretations at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await openDegree(page, { courses: [savedCourse({ code: "ECE 2799", credits: 3 })] });
    await page.getByRole("button", { name: "Change major" }).click();
    await page.getByRole("combobox", { name: "Major", exact: true }).click();
    await page.getByRole("option", { name: "Electrical and Computer Engineering", exact: true }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await auditReady(page);
    await expect(page.getByText("Electrical and Computer Engineering · Class of 2030 · Beta", { exact: true })).toBeVisible();
    await expect(page.getByText("Not yet checked by an ECE student. Tell us if something looks wrong.")).toBeVisible();
    await openAllSections(page);
    await expect(page.getByRole("button", { name: /^ECE 2799, line 37,/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `e2e/screenshots/degree-ece-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: /^HUA theme:/ }).click();
    const controls = page.getByRole("checkbox", { name: "I confirmed Engineering design placement", exact: true });
    await expect(controls).not.toBeChecked();
    await expect(page.getByText(/Confirm ECE 2799 counts on lines/)).toBeVisible();
    await controls.focus();
    await page.keyboard.press("Space");
    await auditReady(page);
    await expect(controls).toBeChecked();
    await page.reload();
    await auditReady(page);
    await page.getByRole("button", { name: /^HUA theme:/ }).click();
    await expect(controls).toBeChecked();
    await page.screenshot({ path: `e2e/screenshots/degree-ece-checks-${width}.png`, fullPage: true });
  });
}
