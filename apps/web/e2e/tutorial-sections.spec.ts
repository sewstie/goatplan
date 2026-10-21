import { expect, test, type Page } from "@playwright/test";
import { lectureProfessorTerm } from "../src/lib/store/testing/lectureProfessors";

const code = "AE 2320";
const guide = (page: Page) => page.getByRole("region", { name: "First plan tutorial" });
const details = (page: Page) => page.getByRole("complementary", { name: "Course details" });
const professor = (page: Page) => details(page).getByRole("combobox", { name: "Professor" });
const next = (page: Page) => guide(page).getByRole("button", { name: "Next", exact: true });
const settled = (page: Page) => expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");

async function open(page: Page, width: number, course = code) {
  const term = lectureProfessorTerm();
  term.term = { ...term.term, id: "2099-C", year: 2099, start: "2099-01-13", end: "2099-03-05" };
  for (const section of term.courses[1].sections) section.type = "lab";
  await page.setViewportSize({ width, height: width === 834 ? 1194 : 900 });
  await page.route("**/data/index.json", (route) => route.fulfill({ json: { terms: [{
    ...term.term, status: "upcoming", courses: 2,
    sections: term.courses.reduce((count, item) => count + item.sections.length, 0), generatedAt: term.generatedAt,
  }] } }));
  await page.route("**/data/2099-C.json", (route) => route.fulfill({ json: term }));
  await page.goto("/");
  await next(page).press("Enter");
  await page.getByRole("searchbox").fill(course);
  await page.getByRole("searchbox").press("Enter");
  await settled(page);
}

async function capture(page: Page, state: string, width: number) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `e2e/screenshots/tutorial-${state}-${width}.png`, fullPage: true, animations: "disabled" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
}

async function inspectSections(page: Page) {
  const headings = await details(page).getByRole("heading", { level: 4 }).allTextContents();
  expect(headings).toHaveLength(3);
  const calendar = page.getByRole("region", { name: "Weekly schedule" });
  for (const heading of headings) {
    await guide(page).getByRole("button", { name: `Find ${heading}`, exact: true }).press("Enter");
    const target = details(page).getByRole("heading", { name: heading, exact: true });
    await expect(target).toBeFocused();
    const box = await target.boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    const section = heading.split(" ")[1];
    await expect(calendar.getByRole("button", { name: new RegExp(`^${code} ${section},`) })).toBeVisible();
  }
  return headings.map((heading) => heading.split(" ")[1]);
}

for (const width of [1440, 834]) {
  test(`optional professor guidance keeps real filtered sections through saving at ${width}`, async ({ page }) => {
    await open(page, width);
    await expect(professor(page)).toHaveValue("");
    await capture(page, "professor-default", width);
    await guide(page).getByRole("button", { name: `Find Professor for ${code}` }).press("Enter");
    await expect(professor(page)).toBeFocused();
    const box = await professor(page).boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    await professor(page).selectOption("Ye Lu");
    await settled(page);
    await expect(page.getByText("Schedule 1 of 4", { exact: true })).toBeVisible();
    await capture(page, "professor-chosen", width);
    await next(page).press("Enter");
    await guide(page).getByRole("button", { name: "Back", exact: true }).press("Enter");
    await expect(professor(page)).toHaveValue("Ye Lu");
    await next(page).press("Enter");
    await next(page).press("Enter");
    await expect(guide(page)).toContainText("You can finish this guide without saving.");
    await capture(page, "details", width);
    const lectures: string[] = [];
    let shown: string[] = [];
    for (let index = 0; index < 4; index++) {
      shown = await inspectSections(page);
      lectures.push(shown.find((section) => section.startsWith("CL"))!);
      await expect(details(page).getByRole("heading", { name: "Discussion CD01", exact: true })).toBeVisible();
      await expect(details(page).getByRole("heading", { name: /Lecture CL0[346]/ })).toHaveCount(0);
      if (index < 3) await page.getByRole("button", { name: "Next schedule", exact: true }).press("Enter");
    }
    expect(lectures.sort()).toEqual(["CL01", "CL02", "CL02", "CL05"]);
    await guide(page).getByRole("button", { name: "Finish tutorial" }).press("Enter");
    await expect(page.getByRole("region", { name: "Schedule browser" })).toBeFocused();
    await expect(professor(page)).toHaveValue("Ye Lu");
    await page.getByRole("button", { name: "Save schedule", exact: true }).press("Enter");
    const dialog = page.getByRole("dialog", { name: "Save schedule" });
    await dialog.getByRole("textbox", { name: "Plan name" }).fill("My section choices");
    await dialog.getByRole("button", { name: "Save", exact: true }).press("Enter");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: "Saved", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Saved plans", exact: true }).click();
    await page.getByRole("link", { name: "Sections to register", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sections to register · My section choices");
    const rows = page.getByRole("table").getByRole("row");
    await expect(rows).toHaveCount(4);
    for (const section of shown) await expect(rows.filter({ hasText: section })).toContainText(code);
    await expect(page.getByRole("button", { name: "Copy section list", exact: true })).toBeVisible();
  });

  test(`Any professor stays optional and completion needs no saved plan at ${width}`, async ({ page }) => {
    await open(page, width);
    await guide(page).getByRole("button", { name: `Find Professor for ${code}` }).press("Enter");
    await expect(professor(page)).toHaveValue("");
    await next(page).press("Enter");
    await next(page).press("Enter");
    await expect(page.getByText("Schedule 1 of 6", { exact: true })).toBeVisible();
    await inspectSections(page);
    await guide(page).getByRole("button", { name: "Finish tutorial" }).press("Enter");
    await page.reload();
    await settled(page);
    await expect(guide(page)).toBeHidden();
    await expect(professor(page)).toHaveValue("");
    await expect(page.getByText("Schedule 1 of 6", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save schedule", exact: true })).toBeEnabled();
  });

  test(`a lab-only course has no professor tip or missing lecture target at ${width}`, async ({ page }) => {
    await open(page, width, "AE 2410");
    await expect(guide(page).getByRole("button", { name: /^Find Professor/ })).toHaveCount(0);
    await expect(professor(page)).toHaveCount(0);
    await capture(page, "professor-no-lectures", width);
    await next(page).press("Enter");
    await next(page).press("Enter");
    await expect(guide(page).getByRole("button", { name: /^Find (Lecture|Discussion)/ })).toHaveCount(0);
    await guide(page).getByRole("button", { name: "Find Lab S01", exact: true }).press("Enter");
    await expect(details(page).getByRole("heading", { name: "Lab S01", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Next schedule", exact: true }).press("Enter");
    await guide(page).getByRole("button", { name: "Find Lab S02", exact: true }).press("Enter");
    await expect(details(page).getByRole("heading", { name: "Lab S02", exact: true })).toBeFocused();
    await guide(page).getByRole("button", { name: "Finish tutorial" }).press("Enter");
    await expect(guide(page)).toBeHidden();
    await expect(page.getByRole("region", { name: "Schedule browser" })).toBeFocused();
  });
}
