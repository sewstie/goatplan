import { expect, test } from "./fixtures/test";
import { auditReady, openAllSections, openDegree, savedCourse } from "./fixtures/degree";
import { SUGGESTIONS_ON } from "../src/components/degree/degreeFeatures";
import { pickTerm } from "./fixtures/pickers";

test("ECE history drives search badges and explicit course suggestions", async ({ page }) => {
  test.skip(!SUGGESTIONS_ON, "Suggestions are paused");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openDegree(page, JSON.stringify({ version: 1, sheetId: "ece-2030", courses: [savedCourse({ code: "ECE 2010", credits: 3, term: "A Term 2026" }), savedCourse({ code: "MA 1021", credits: 3, term: "B Term 2026" })], manual: [] }));
  await page.getByRole("button", { name: "Sheet options" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Suggest courses", exact: true }).click();
  const suggestions = page.getByRole("region", { name: "Suggest courses", exact: true });
  await pickTerm(suggestions, "Term to plan for", "C Term 2027");
  const add = suggestions.getByRole("button", { name: /^Plan .* for C Term 2027$/ }).first();
  await expect(add).toBeVisible({ timeout: 60_000 });
  const code = (await add.getAttribute("aria-label"))!.replace(/^Plan /, "").replace(/ for C Term 2027$/, "");
  await add.click();
  await page.keyboard.press("Escape");
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
  await expect(page.getByRole("button", { name: /^ECE 2112, line 32, planned/ })).toHaveCount(0);
});

for (const width of [1440, 834]) {
  test(`ECE testers can select their sheet and confirm interpretations at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await openDegree(page, { courses: [savedCourse({ code: "ECE 2799", credits: 3 })] });
    await page.getByRole("button", { name: "Change major" }).click();
    await page.getByRole("radio", { name: "Electrical and Computer Engineering", exact: true }).check();
    await page.getByRole("button", { name: "Open my sheet", exact: true }).click();
    await auditReady(page);
    await expect(page.locator(".degree-major").getByText("Electrical and Computer Engineering", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /^ECE 2030 tracking sheet/ })).toBeVisible();
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
