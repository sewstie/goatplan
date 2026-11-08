import { expect, test } from "./fixtures/test";
import { auditReady, fixtureHistory, openDegree, openHistory, panel, savedCourse, stored } from "./fixtures/degree";
import { SUGGESTIONS_ON } from "../src/components/degree/degreeFeatures";
import { pickTerm } from "./fixtures/pickers";

for (const width of [1440, 834, 375]) {
  test(`standalone degree sheet and suggestions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 834 ? 1112 : 900 });
    await openDegree(page, fixtureHistory("degree-history-mid.json"));
    await expect(page.getByRole("combobox", { name: "Term", exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `e2e/screenshots/degree-standalone-${width}.png`, fullPage: true, animations: "disabled" });
    if (!SUGGESTIONS_ON) return;
    await page.getByRole("button", { name: "Sheet options" }).focus();
    await page.keyboard.press("Enter");
    await page.getByRole("dialog").getByRole("button", { name: "Suggest courses", exact: true }).focus();
    await page.keyboard.press("Enter");
    const suggestions = panel(page, "Suggest courses");
    await pickTerm(suggestions, "Term to plan for", "C Term 2027");
    await expect(suggestions.getByRole("button", { name: /^Plan .* for C Term 2027$/ }).first()).toBeVisible({ timeout: 30_000 });
    await expect(suggestions.getByText(/^Offered · \d+ sections$/).first()).toBeVisible();
    await page.screenshot({ path: `e2e/screenshots/degree-suggestions-${width}.png`, animations: "disabled" });
    await page.keyboard.press("Escape");
    await expect(suggestions).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Sheet options" })).toBeFocused();
  });
}

test("catalog-only courses can be planned for unpublished terms", async ({ page }) => {
  await openDegree(page);
  await page.getByRole("button", { name: "Find your courses" }).click();
  await page.getByRole("button", { name: /^Adding to/ }).click();
  await page.getByRole("button", { name: "D Term 2030", exact: true }).click();
  await expect(page.getByRole("button", { name: "Planned", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("combobox", { name: "Course code or title" }).fill("CS 4120");
  await expect(page.getByText(/^Not offered in \d{4}–\d{2}$/).first()).toBeVisible();
  await page.getByRole("button", { name: "Add CS 4120", exact: true }).click();
  await page.keyboard.press("Escape");
  await auditReady(page);
  expect((await stored(page)).courses).toEqual([expect.objectContaining({ code: "CS 4120", title: "Analysis of Algorithms", status: "planned", term: "D Term 2030" })]);
  const history = await openHistory(page);
  await history.getByRole("button", { name: "Edit CS 4120" }).click();
  await expect(page.getByRole("button", { name: "Open in planner", exact: true })).toHaveCount(0);
  await page.reload();
  await auditReady(page);
  expect((await stored(page)).courses[0].status).toBe("planned");
});

test("planner courses reach My degree only through the explicit menu action", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("goatplan:draft:v1:2027-C", JSON.stringify({ version: 1, courses: ["MA 1021", "CS 2303"], preferences: { startsAfter: 0, blocked: [], onlyOpen: true }, locks: {}, professorByCourse: {}, sortPreset: "bestOverall", alternatives: {} })));
  await openDegree(page, { courses: [savedCourse({ code: "MA 1021", credits: 3 })] });
  await expect(page.getByRole("button", { name: /^CS 2303, line/ })).toHaveCount(0);
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Planner", exact: true }).click();
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  await page.getByRole("button", { name: "Add to My degree", exact: true }).click();
  await expect.poll(async () => (await stored(page)).courses).toEqual([
    expect.objectContaining({ code: "MA 1021", status: "taken" }),
    expect.objectContaining({ code: "CS 2303", status: "planned", term: "C Term 2027" }),
  ]);
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "My degree", exact: true }).click();
  await auditReady(page);
  const history = await openHistory(page);
  await history.getByRole("button", { name: "Edit CS 2303" }).click();
  await page.getByRole("button", { name: "Open in planner", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  expect((await stored(page)).courses).toHaveLength(2);
});

test("future suggestions use only observed term letters and leave the planner alone", async ({ page }) => {
  test.skip(!SUGGESTIONS_ON, "Suggestions are paused");
  await openDegree(page, { courses: [savedCourse({ code: "CS 1101", credits: 3 })] });
  await page.getByRole("button", { name: "Sheet options" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Suggest courses", exact: true }).click();
  const suggestions = panel(page, "Suggest courses");
  await pickTerm(suggestions, "Term to plan for", "C Term 2030");
  await expect(suggestions.getByText("Usually offered in C").first()).toBeVisible();
  await expect(suggestions.getByText("Offering not known yet").first()).toBeVisible();
  await expect(suggestions.getByRole("button", { name: "Add to schedule", exact: true })).toHaveCount(0);
  await suggestions.getByRole("button", { name: /^Plan .* for C Term 2030$/ }).first().click();
  expect((await stored(page)).courses.at(-1)).toMatchObject({ status: "planned", term: "C Term 2030" });
  expect(await page.evaluate(() => localStorage.getItem("goatplan:draft:v1:2030-C"))).toBeNull();
});

test("Add to schedule opens the selected published term without adding degree history", async ({ page }) => {
  test.skip(!SUGGESTIONS_ON, "Suggestions are paused");
  await openDegree(page, { courses: [savedCourse({ code: "CS 1101", credits: 3 })] });
  await page.getByRole("button", { name: "Sheet options" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Suggest courses", exact: true }).click();
  const suggestions = panel(page, "Suggest courses");
  await pickTerm(suggestions, "Term to plan for", "C Term 2027");
  const row = suggestions.getByRole("listitem").filter({ has: page.getByRole("heading", { name: /^CS 3043 ·/ }) });
  await row.getByRole("button", { name: "Add to schedule", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('[data-planner-term="2027-C"][data-planner-term-status="ready"]')).toBeAttached();
  await expect(page.locator('[data-course-row="CS 3043"]')).toBeVisible();
  expect((await stored(page)).courses).toEqual([expect.objectContaining({ code: "CS 1101", status: "taken" })]);
});

test("legacy histories persist the migration and load without any published term data", async ({ page }) => {
  await page.route(/\/data\/(index|\d{4}-[A-Z])\.json$/, (route) => route.fulfill({ status: 503 }));
  await openDegree(page, JSON.stringify({ version: 1, courses: [
    { code: "CS 2102", title: "Design", credits: 3, inProgress: true, apIb: false, source: "found" },
    { code: "MA 1021", title: "Calculus", credits: 3, inProgress: false, apIb: false, source: "found" },
  ], manual: [] }));
  const history = await stored(page);
  expect(history.version).toBe(2);
  expect(history.courses.map((course: { status: string }) => course.status)).toEqual(["planned", "taken"]);
  expect(JSON.stringify(history)).not.toContain("inProgress");
  await expect(page.getByRole("button", { name: /^1 Planned/ })).toBeVisible();
  await page.reload();
  await auditReady(page);
});

test("catalog failures offer a retry without losing degree progress", async ({ page }) => {
  let failed = true;
  await page.route("**/data/catalog.json", (route) => failed ? route.fulfill({ status: 503 }) : route.fallback());
  await openDegree(page);
  await page.getByRole("button", { name: "Find your courses" }).click();
  await expect(page.getByText("The course catalog couldn’t be loaded.")).toBeVisible();
  failed = false;
  await page.getByRole("dialog").getByRole("button", { name: "Try again", exact: true }).click();
  await page.getByRole("combobox", { name: "Course code or title" }).fill("CS 4120");
  await expect(page.getByRole("button", { name: "Add CS 4120", exact: true })).toBeVisible();
});

test("unusual catalog identifiers stay in history for review without breaking the audit", async ({ page }) => {
  await openDegree(page);
  await page.getByRole("button", { name: "Find your courses" }).click();
  await page.getByRole("combobox", { name: "Course code or title" }).fill("American Antiquarian Seminar");
  await page.getByRole("button", { name: "Add HU—AAS-50", exact: true }).click();
  await page.keyboard.press("Escape");
  await auditReady(page);
  expect((await stored(page)).courses[0]).toMatchObject({ code: "HU—AAS-50", title: "American Antiquarian Seminar" });
  const history = await openHistory(page);
  await history.getByRole("button", { name: "Edit HU—AAS-50" }).click();
  await expect(panel(page, "Edit course")).toContainText("needs a numbered WPI course code before it can count");
});
