import { expect, test, type Locator, type Page } from "@playwright/test";
import { coursePanelTerm } from "./fixtures/coursePanel";
import type { TermFile } from "../src/lib/data/types";

const guide = (page: Page) => page.getByRole("dialog").filter({ has: page.getByRole("button", { name: "Close guide" }) });
const next = (page: Page) => guide(page).getByRole("button", { name: "Next", exact: true });
const settled = (page: Page) => expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");

async function data(page: Page, term: TermFile, waitForTerm?: Promise<void>) {
  term.term.name = "C Term";
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.route("**/data/index.json", (route) => route.fulfill({ json: { terms: [{
    ...term.term, status: "upcoming", courses: term.courses.length,
    sections: term.courses.reduce((count, course) => count + course.sections.length, 0), generatedAt: term.generatedAt,
  }] } }));
  await page.route(`**/data/${term.term.id}.json`, async (route) => { await waitForTerm; await route.fulfill({ json: term }); });
}

async function tabTo(page: Page, target: Locator) {
  for (let i = 0; i < 100; i++) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Tab could not reach ${await target.getAttribute("aria-label") ?? await target.textContent()}`);
}

async function advance(page: Page) {
  await expect(next(page)).toHaveAttribute("aria-disabled", "false");
  await tabTo(page, next(page));
  await page.keyboard.press("Enter");
}

async function capture(page: Page, state: string) {
  await page.evaluate(() => document.fonts.ready);
  const box = await guide(page).boundingBox();
  const target = await page.locator("[data-guide-target]").boundingBox();
  expect(box).not.toBeNull();
  expect(target).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(8);
  expect(box!.y).toBeGreaterThanOrEqual(8);
  expect(box!.x + box!.width).toBeLessThanOrEqual(1432);
  expect(box!.y + box!.height).toBeLessThanOrEqual(792);
  expect(box!.x >= target!.x + target!.width + 6 || box!.x + box!.width <= target!.x - 6 || box!.y >= target!.y + target!.height + 6 || box!.y + box!.height <= target!.y - 6).toBe(true);
  await page.screenshot({ path: `e2e/screenshots/guide-state-${state}-1440.png`, animations: "disabled" });
  await expect(page).toHaveScreenshot(`guide-state-${state}-1440.png`, { animations: "disabled" });
}

async function addCourse(page: Page, code: string) {
  await tabTo(page, page.getByRole("searchbox"));
  await page.keyboard.type(code);
  await page.keyboard.press("Enter");
  await settled(page);
}

test("states 30–33 and 35: keyboard guide uses real controls and keeps restrictions after finishing", async ({ page }) => {
  let release!: () => void;
  const loading = new Promise<void>((resolve) => { release = resolve; });
  await data(page, coursePanelTerm("04"), loading);
  await page.goto("/");
  await expect(guide(page).getByRole("heading", { name: "Choose your term" })).toBeFocused();
  await expect(next(page)).toHaveAttribute("aria-disabled", "true");
  await tabTo(page, next(page));
  await page.keyboard.press("Enter");
  await expect(next(page)).toBeFocused();
  await capture(page, "30");
  release();
  await advance(page);
  await expect(guide(page).getByRole("heading", { name: "Add the courses you need" })).toBeFocused();
  await expect(next(page)).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByText("Add your first course", { exact: true })).toBeHidden();
  await tabTo(page, page.getByRole("searchbox"));
  await page.keyboard.type("AE 2320");
  await expect(page.getByRole("button", { name: "Add AE 2320", exact: true })).toBeVisible();
  await capture(page, "31");
  await page.keyboard.press("Enter");
  await settled(page);
  await advance(page);
  await expect(guide(page).getByRole("heading", { name: "A professor preference is optional" })).toBeFocused();
  await expect(page.getByRole("combobox", { name: "Lecture professor" })).toHaveText("Any professor");
  await capture(page, "32");
  await advance(page);
  await tabTo(page, page.getByRole("combobox", { name: "Starts after" }));
  await page.keyboard.type("9");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("combobox", { name: "Starts after" })).toHaveValue("540");
  await tabTo(page, page.getByRole("button", { name: "Block a time", exact: true }));
  await page.keyboard.press("Enter");
  const block = page.getByRole("dialog", { name: "Block a time" });
  await expect(block.getByRole("textbox", { name: "Name (optional)" })).toBeFocused();
  await page.keyboard.type("Lunch");
  for (const day of ["Monday", "Wednesday", "Friday"]) {
    await tabTo(page, block.getByRole("checkbox", { name: day, exact: true }));
    await page.keyboard.press("Space");
  }
  await tabTo(page, block.getByRole("button", { name: "Block time", exact: true }));
  await page.keyboard.press("Enter");
  await settled(page);
  await expect(guide(page)).toContainText("Your 9 AM start and lunch break are already applied.");
  await capture(page, "33");
  await tabTo(page, page.getByRole("combobox", { name: "Starts after" }));
  await page.keyboard.type("10");
  await page.keyboard.press("Tab");
  await settled(page);
  await expect(page.getByRole("combobox", { name: "Starts after" })).toHaveValue("600");
  await advance(page);
  await expect(guide(page).getByRole("heading", { name: "You can finish with no matches" })).toBeVisible();
  await expect(guide(page).getByRole("button", { name: "Finish guide" })).toBeFocused();
  await capture(page, "35");
  await page.keyboard.press("Enter");
  await expect(guide(page)).toBeHidden();
  await expect(page.getByRole("region", { name: "Schedule browser" })).toBeFocused();
  await page.reload();
  await settled(page);
  await expect(guide(page)).toBeHidden();
  await expect(page.getByRole("combobox", { name: "Starts after" })).toHaveValue("600");
  await expect(page.getByRole("button", { name: "Remove blocked time Lunch, Mon, Wed, Fri 12 PM–1 PM" })).toBeVisible();
});

test("state 34: DEMO guide finishes while real professor, locks and schedule browsing stay usable", async ({ page }) => {
  const term = coursePanelTerm("24");
  const course = term.courses[0];
  for (const [code, start] of [["L03", 600], ["L04", 660]] as const) {
    const lecture = structuredClone(course.sections[0]);
    lecture.id = `DEMO 1001-${code}`;
    lecture.code = code;
    lecture.meetings = lecture.meetings.map((meeting) => ({ ...meeting, start, end: start + 50 }));
    course.sections.push(lecture);
    course.options.push([lecture.id, "DEMO 1001-B01", "DEMO 1001-D01"], [lecture.id, "DEMO 1001-B02", "DEMO 1001-D01"]);
  }
  await data(page, term);
  await page.goto("/");
  await advance(page);
  await addCourse(page, "DEMO 1001");
  await advance(page);
  const professor = page.getByRole("combobox", { name: "Lecture professor" });
  await tabTo(page, professor);
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await settled(page);
  await expect(professor).toHaveText("Alex Rivera");
  for (const section of ["B02", "B01"]) {
    await tabTo(page, page.getByRole("button", { name: "View other lab choices", exact: true }));
    await page.keyboard.press("Enter");
    await tabTo(page, page.getByRole("button", { name: `Choose Lab ${section}`, exact: true }));
    await page.keyboard.press("Enter");
    await settled(page);
  }
  await advance(page);
  await advance(page);
  await expect(guide(page).getByRole("button", { name: "Finish guide" })).toBeFocused();
  await expect(guide(page)).toHaveCSS("width", "330px");
  await capture(page, "34");
  await tabTo(page, page.getByRole("button", { name: "Next schedule", exact: true }));
  await page.keyboard.press("Enter");
  await expect(page.getByText("Schedule 2 of 3", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next schedule", exact: true })).toBeFocused();
  await tabTo(page, guide(page).getByRole("button", { name: "Finish guide" }));
  await page.keyboard.press("Enter");
  await expect(guide(page)).toBeHidden();
  await expect(professor).toHaveText("Alex Rivera");
  await expect(page.getByRole("button", { name: "Unlock Lab B01", exact: true })).toBeVisible();
});

test("a lab-only course skips the professor step and keeps progress stable until navigation", async ({ page }) => {
  await data(page, coursePanelTerm("29"));
  await page.goto("/");
  await advance(page);
  await addCourse(page, "DEMO 2001");
  await expect(guide(page)).toContainText("Getting started · 2 of 5");
  await advance(page);
  await expect(guide(page).getByRole("heading", { name: "Make room for your day" })).toBeFocused();
  await expect(guide(page)).toContainText("Getting started · 3 of 4");
  await expect(page.getByRole("combobox", { name: "Lecture professor" })).toHaveCount(0);
  await advance(page);
  await expect(guide(page)).toContainText("Getting started · 4 of 4");
  await expect(guide(page).getByRole("button", { name: "Finish guide" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(guide(page)).toBeHidden();
  await page.reload();
  await settled(page);
  await expect(guide(page)).toBeHidden();
});
