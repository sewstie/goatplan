import { expect, test } from "./fixtures/test";
import { auditReady, openAllSections, openDegree, savedCourse } from "./fixtures/degree";
import { SUGGESTIONS_ON } from "../src/components/degree/degreeFeatures";
import { pickTerm } from "./fixtures/pickers";

test("RBE history drives search badges and explicit course suggestions", async ({ page }) => {
  test.skip(!SUGGESTIONS_ON, "Suggestions are paused");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openDegree(page, JSON.stringify({ version: 1, sheetId: "rbe-2030", courses: [savedCourse({ code: "RBE 1001", credits: 3, term: "A Term 2026" }), savedCourse({ code: "MA 1021", credits: 3, term: "B Term 2026" })], manual: [] }));
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
  await page.getByRole("searchbox", { name: "Search courses" }).fill("RBE 3001");
  const card = page.getByRole("region", { name: "Search results" }).getByRole("listitem").filter({ has: page.getByRole("heading", { level: 3, name: "RBE 3001", exact: true }) });
  await expect(card).toContainText("Counts toward: Robotics Engineering", { timeout: 30_000 });
  await card.getByRole("button", { name: "Add RBE 3001", exact: true }).click();
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "My degree", exact: true }).click();
  await auditReady(page);
  await openAllSections(page);
  await expect(page.getByRole("button", { name: /^RBE 3001, line 31, planned/ })).toHaveCount(0);
});

for (const width of [1440, 834]) {
  test(`RBE testers can select their sheet and confirm interpretations at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await openDegree(page, { courses: [savedCourse({ code: "RBE 2001", credits: 3 })] });
    await page.getByRole("button", { name: "Change major" }).click();
    await page.getByRole("radio", { name: "Robotics Engineering", exact: true }).check();
    await page.getByRole("button", { name: "Open my sheet", exact: true }).click();
    await auditReady(page);
    await expect(page.locator(".degree-major").getByText("Robotics Engineering", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /^RBE 2030 tracking sheet/ })).toBeVisible();
    await openAllSections(page);
    await expect(page.getByRole("button", { name: /^RBE 2001, line 29,/ })).toBeVisible();
    await page.screenshot({ path: `e2e/screenshots/degree-rbe-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: /^HUA theme:/ }).click();
    const controls = page.getByRole("checkbox", { name: "I confirmed Classical controls", exact: true });
    await expect(controls).not.toBeChecked();
    await expect(page.getByText(/The sheet lists ME 3703; the catalog lists AE 2310/)).toBeVisible();
    await controls.check();
    await auditReady(page);
    await expect(controls).toBeChecked();
    await page.reload();
    await auditReady(page);
    await page.getByRole("button", { name: /^HUA theme:/ }).click();
    await expect(controls).toBeChecked();
    await page.screenshot({ path: `e2e/screenshots/degree-rbe-checks-${width}.png`, fullPage: true });
  });
}
