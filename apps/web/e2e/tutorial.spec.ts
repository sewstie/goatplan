import { expect, test, startsAfterText } from "./fixtures/test";
import type { Locator, Page } from "@playwright/test";
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

/**
 * State 04's term, with a second AE 2320 lecture by another professor so the guide has its professor step
 * (it skips the step when picking a professor would change nothing). Same 9 AM time, so a 10 AM start still
 * leaves no matches.
 */
function twoProfessorTerm(): TermFile {
  const term = coursePanelTerm("04");
  const course = term.courses.find((item) => item.code === "AE 2320")!;
  const lecture = { ...structuredClone(course.sections[0]), id: "AE 2320-CL02", code: "CL02", instructors: ["Alex Rivera"] };
  course.sections.push(lecture);
  course.options.push(...course.options.map((option) => option.map((id) => (id === "AE 2320-CL01" ? lecture.id : id))));
  return term;
}

test("states 30–33 and 35: keyboard guide uses real controls and keeps restrictions after finishing", async ({ page }) => {
  let release!: () => void;
  const loading = new Promise<void>((resolve) => { release = resolve; });
  await data(page, twoProfessorTerm(), loading);
  await page.goto("/");
  await expect(guide(page).getByRole("heading", { name: "Pick your term" })).toBeFocused();
  await expect(next(page)).toHaveAttribute("aria-disabled", "true");
  await tabTo(page, next(page));
  await page.keyboard.press("Enter");
  await expect(next(page)).toBeFocused();
  await capture(page, "30");
  release();
  await advance(page);
  await expect(guide(page).getByRole("heading", { name: "Add your courses" })).toBeFocused();
  await expect(next(page)).toHaveAttribute("aria-disabled", "true");
  await expect(guide(page)).toContainText("Add a course to continue.");
  await expect(page.getByText("Add your first course", { exact: true })).toBeHidden();
  await tabTo(page, page.getByRole("searchbox"));
  await page.keyboard.type("AE 2320");
  await expect(page.getByRole("button", { name: "Add AE 2320", exact: true })).toBeVisible();
  await capture(page, "31");
  await page.keyboard.press("Enter");
  await settled(page);
  await expect(guide(page)).not.toContainText("Add a course to continue.");
  await advance(page);
  await expect(guide(page).getByRole("heading", { name: "Prefer a professor?" })).toBeFocused();
  await expect(guide(page)).toContainText("Optional. Pick one to see only their lectures.");
  await expect(page.getByRole("combobox", { name: "Lecture professor" })).toHaveText("Any professor");
  await capture(page, "32");
  await advance(page);
  await expect(guide(page)).toContainText("Click Block a time, then drag across your busy hours.");
  await expect(page.locator("[data-guide-target]")).toHaveAccessibleName("Block a time");
  await tabTo(page, page.getByRole("combobox", { name: "Starts after" }));
  await page.keyboard.type("9");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("combobox", { name: "Starts after" })).toHaveText(startsAfterText(540));
  await tabTo(page, page.getByRole("button", { name: "Block a time", exact: true }));
  await page.keyboard.press("Enter");
  await tabTo(page, page.getByRole("button", { name: "Type a time instead", exact: true }));
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
  await capture(page, "33");
  await tabTo(page, page.getByRole("combobox", { name: "Starts after" }));
  await page.keyboard.type("10");
  await page.keyboard.press("Enter");
  await settled(page);
  await expect(page.getByRole("combobox", { name: "Starts after" })).toHaveText(startsAfterText(600));
  await advance(page);
  await expect(guide(page).getByRole("heading", { name: "Nothing fits yet" })).toBeVisible();
  await expect(guide(page).getByRole("button", { name: "Done" })).toBeFocused();
  await expect(guide(page)).toContainText("The panel shows why and suggests fixes.");
  await expect(guide(page)).not.toContainText("Your plan is saved in this browser.");
  await expect(page.locator("[data-guide-target]")).toContainText("Ways to fix it");
  await capture(page, "35");
  await page.keyboard.press("Enter");
  await expect(guide(page)).toBeHidden();
  await expect(page.locator("#tutorial-diagnosis")).toBeFocused();
  await page.reload();
  await settled(page);
  await expect(guide(page)).toBeHidden();
  await expect(page.getByRole("combobox", { name: "Starts after" })).toHaveText(startsAfterText(600));
  await page.getByRole("button", { name: /blocked time/ }).first().click();
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
  await expect(guide(page).getByRole("button", { name: "Done" })).toBeFocused();
  await expect(guide(page)).toHaveCSS("width", "280px");
  await capture(page, "34");
  await tabTo(page, page.getByRole("button", { name: "Next schedule", exact: true }));
  await page.keyboard.press("Enter");
  await expect(page.getByText("Schedule 2 of 3", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next schedule", exact: true })).toBeFocused();
  await tabTo(page, guide(page).getByRole("button", { name: "Done" }));
  await page.keyboard.press("Enter");
  await expect(guide(page)).toBeHidden();
  await page.locator('[data-course-row="DEMO 1001"]').click();
  await expect(professor).toHaveText("Alex Rivera");
  await expect(page.getByRole("button", { name: "Unlock Lab B01", exact: true })).toBeVisible();
});

test("a lab-only course skips the professor step and keeps progress stable until navigation", async ({ page }) => {
  await data(page, coursePanelTerm("29"));
  await page.goto("/");
  await advance(page);
  await addCourse(page, "DEMO 2001");
  await expect(guide(page)).toContainText("Step 2 of 5");
  await advance(page);
  await expect(guide(page).getByRole("heading", { name: "Block busy times" })).toBeFocused();
  await expect(guide(page)).toContainText("Step 3 of 4");
  await expect(page.getByRole("combobox", { name: "Lecture professor" })).toHaveCount(0);
  await advance(page);
  await expect(guide(page)).toContainText("Step 4 of 4");
  await expect(guide(page).getByRole("button", { name: "Done" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(guide(page)).toBeHidden();
  await page.reload();
  await settled(page);
  await expect(guide(page)).toBeHidden();
});

const replay = (page: Page) => page.getByRole("button", { name: /^(Guide|How to use GoatPlan)$/ });
const guideStatus = (page: Page) => page.evaluate(() => localStorage.getItem("goatplan:tutorial:v1"));

test("Escape and the × close the guide for this visit only", async ({ page }) => {
  await data(page, coursePanelTerm("29"));
  await page.goto("/");
  await expect(next(page)).toHaveAttribute("aria-disabled", "false");
  await page.keyboard.press("Escape");
  await expect(guide(page)).toBeHidden();
  expect(await guideStatus(page)).toBe("started");
  await page.reload();
  await expect(guide(page)).toBeVisible();
  await guide(page).getByRole("button", { name: "Close guide" }).click();
  await expect(guide(page)).toBeHidden();
  expect(await guideStatus(page)).toBe("started");
  await expect(page.getByText("Guide closed · Replay it from How to use")).toHaveCount(0);
  await page.reload();
  await expect(guide(page)).toBeVisible();
});

test("a guide closed after adding a course stays closed around the app, and returns on the next visit", async ({ page }) => {
  await data(page, twoProfessorTerm());
  await page.goto("/");
  await advance(page);
  await addCourse(page, "AE 2320");
  await page.keyboard.press("Escape");
  await expect(guide(page)).toBeHidden();
  await page.getByRole("button", { name: "Saved plans" }).click();
  await page.getByRole("link", { name: "All saved plans" }).click();
  await expect(page).toHaveURL(/\/plans/);
  await page.goBack();
  await expect(page.getByRole("searchbox")).toBeVisible();
  // PlannerBootstrap's marker can be on the page twice right after Back.
  await expect(page.locator("[data-planner-solve-status]").first()).toHaveAttribute("data-planner-solve-status", "done");
  await expect(guide(page)).toBeHidden();
  expect(await guideStatus(page)).toBe("started");
  await page.reload();
  await expect(guide(page).getByRole("heading", { name: "Pick your term" })).toBeVisible();
  expect(await guideStatus(page)).toBe("started");
});

test("Escape in the type-a-time form on step 4 leaves the guide open", async ({ page }) => {
  await data(page, twoProfessorTerm());
  await page.goto("/");
  await advance(page);
  await addCourse(page, "AE 2320");
  for (let i = 0; i < 2; i++) await advance(page);
  await page.locator("[data-guide-target]").click();
  await page.getByRole("button", { name: "Type a time instead", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Block a time" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Block a time" })).toBeHidden();
  await expect(guide(page).getByRole("heading", { name: "Block busy times" })).toBeVisible();
});

test("Skip stores it as done and says where to replay it", async ({ page }) => {
  await data(page, coursePanelTerm("29"));
  await page.goto("/");
  await guide(page).getByRole("button", { name: "Skip" }).click();
  await expect(guide(page)).toBeHidden();
  await expect(page.getByRole("status").filter({ hasText: "Guide closed · Replay it from How to use" })).toBeVisible();
  expect(await guideStatus(page)).toBe("dismissed");
  await page.reload();
  await expect(page.getByRole("searchbox")).toBeEnabled();
  await expect(guide(page)).toBeHidden();
  await replay(page).click();
  await expect(guide(page).getByRole("heading", { name: "Pick your term" })).toBeFocused();
});

test("the replay button restarts a finished guide without changing the plan or the stored result", async ({ page }) => {
  await data(page, twoProfessorTerm());
  await page.goto("/");
  await advance(page);
  await addCourse(page, "AE 2320");
  for (let i = 0; i < 3; i++) await advance(page);
  await guide(page).getByRole("button", { name: "Done" }).click();
  await expect(guide(page)).toBeHidden();
  const draft = () => page.evaluate(() => localStorage.getItem("goatplan:draft:v1:2027-C"));
  const before = await draft();
  await replay(page).click();
  await expect(guide(page).getByRole("heading", { name: "Pick your term" })).toBeFocused();
  await expect(guide(page)).toContainText("Step 1 of 5");
  await advance(page);
  await expect(next(page)).toHaveAttribute("aria-disabled", "false");
  expect(await guideStatus(page)).toBe("completed");
  await page.keyboard.press("Escape");
  await expect(guide(page)).toBeHidden();
  expect(await guideStatus(page)).toBe("completed");
  expect(await draft()).toBe(before);
});

test("the replay button on Saved plans goes back to the planner and opens the guide", async ({ page }) => {
  await data(page, coursePanelTerm("29"));
  await page.addInitScript(() => localStorage.setItem("goatplan:tutorial:v1", "completed"));
  await page.goto("/plans");
  await replay(page).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(guide(page).getByRole("heading", { name: "Pick your term" })).toBeFocused();
});

test("step 4 stays off the calendar, and Escape there only leaves drawing mode", async ({ page }) => {
  await data(page, twoProfessorTerm());
  await page.goto("/");
  await advance(page);
  await addCourse(page, "AE 2320");
  for (let i = 0; i < 2; i++) await advance(page);
  const block = page.locator("[data-guide-target]");
  await expect(block).toHaveAccessibleName("Block a time");
  const box = await guide(page).boundingBox();
  const calendar = await page.getByRole("region", { name: "Weekly schedule" }).boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(calendar!.x + calendar!.width);
  await block.click();
  await expect(page.getByRole("group", { name: "Drawing mode" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("group", { name: "Drawing mode" })).toBeHidden();
  await expect(guide(page).getByRole("heading", { name: "Block busy times" })).toBeVisible();
});

for (const { width, height } of [{ width: 1440, height: 800 }, { width: 2560, height: 1300 }]) {
  test(`at ${width}px a replay never covers classes or the highlighted target`, async ({ page }) => {
    await data(page, coursePanelTerm("24"));
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await advance(page);
    await addCourse(page, "DEMO 1001");
    await expect(page.locator("[data-block]").first()).toBeVisible();
    await guide(page).getByRole("button", { name: "Close guide" }).click();
    await replay(page).click();
    for (;;) {
      await expect(page.locator("[data-guide-target]")).toBeVisible();
      const covered = await page.evaluate(() => {
        const box = document.querySelector(".guide-popover")!.getBoundingClientRect();
        const touches = (rect: DOMRect, margin = 0) => box.left < rect.right + margin && box.right > rect.left - margin && box.top < rect.bottom + margin && box.bottom > rect.top - margin;
        return {
          target: touches(document.querySelector("[data-guide-target]")!.getBoundingClientRect(), 6),
          blocks: Array.from(document.querySelectorAll("[data-block]")).filter((block) => touches(block.getBoundingClientRect())).length,
        };
      });
      expect(covered, await guide(page).getByRole("heading").innerText()).toEqual({ target: false, blocks: 0 });
      if (await guide(page).getByRole("button", { name: "Done" }).count()) break;
      await next(page).click();
    }
  });
}

async function shoot(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready);
  await guide(page).scrollIntoViewIfNeeded();
  const { width, height } = page.viewportSize()!;
  const box = (await guide(page).boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(8);
  expect(box.x + box.width).toBeLessThanOrEqual(width - 8);
  expect(box.y + box.height).toBeLessThanOrEqual(height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `e2e/screenshots/guide-${name}-${width}.png`, animations: "disabled" });
  await expect(page).toHaveScreenshot(`guide-${name}-${width}.png`, { animations: "disabled" });
}

for (const { width, height } of [{ width: 834, height: 1194 }, { width: 375, height: 812 }]) {
  test(`at ${width}px the guide shows its dots, the course hint and Done on the last step`, async ({ page }) => {
    await data(page, coursePanelTerm("07"));
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(next(page)).toHaveAttribute("aria-disabled", "false");
    await expect(guide(page).getByRole("button", { name: "Back" })).toHaveCount(0);
    await shoot(page, "first");
    await next(page).click();
    await expect(guide(page)).toContainText("Add a course to continue.");
    await shoot(page, "hint");
    await page.getByRole("searchbox").fill("AE 2320");
    await page.getByRole("searchbox").press("Enter");
    await settled(page);
    while (!(await guide(page).getByRole("button", { name: "Done" }).count())) await next(page).click();
    await expect(guide(page).getByRole("heading", { name: "Compare and save" })).toBeVisible();
    await expect(guide(page).getByRole("button", { name: "Skip" })).toHaveCount(0);
    await expect(guide(page).getByRole("button", { name: "Done" })).toBeFocused();
    await shoot(page, "last");
  });
}

test.describe("on a phone", () => {
  async function toAvailability(page: Page, term: TermFile) {
    await data(page, term);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(next(page)).toHaveAttribute("aria-disabled", "false");
    await next(page).click();
    await page.getByRole("searchbox").fill("AE 2320");
    await page.getByRole("searchbox").press("Enter");
    await settled(page);
    await next(page).click();
    if (await guide(page).getByRole("heading", { name: "Prefer a professor?" }).count()) await next(page).click();
    await expect(guide(page).getByRole("heading", { name: "Block busy times" })).toBeVisible();
  }

  test("step 4 teaches drawing beside the calendar, and step 5 says how to reach sections", async ({ page }) => {
    await toAvailability(page, coursePanelTerm("07"));
    await expect(guide(page)).toContainText("Tap Block time, then drag across your busy hours.");
    await expect(page.locator("[data-guide-target]")).toHaveAccessibleName("Block time");
    await page.locator("[data-guide-target]").click();
    await expect(page.getByRole("group", { name: "Drawing mode" })).toBeVisible();
    await next(page).click();
    await expect(page.getByRole("group", { name: "Drawing mode" })).toBeHidden();
    await expect(guide(page)).toContainText("Flip through schedules with the arrows. Save one to get section codes for Workday.");
    await expect(guide(page).getByRole("button", { name: "Done" })).toBeFocused();
    await expect(guide(page).getByRole("button", { name: "Done" })).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(guide(page)).toBeHidden();
  });

  test("the no-match step points at the diagnosis card", async ({ page }) => {
    await toAvailability(page, twoProfessorTerm());
    await page.getByRole("combobox", { name: "Starts after" }).selectOption("600");
    await settled(page);
    await next(page).click();
    await expect(guide(page)).toContainText("The panel shows why and suggests fixes.");
    await expect(page.locator("[data-guide-target]")).toContainText("Needs attention");
    await expect(guide(page).getByRole("button", { name: "Done" })).toBeFocused();
  });

  test("the footer button replays the guide from step 1, wherever the page was", async ({ page }) => {
    await toAvailability(page, coursePanelTerm("07"));
    await guide(page).getByRole("button", { name: "Close guide" }).click();
    await page.getByRole("button", { name: /^(Guide|How to use GoatPlan)$/ }).click();
    await expect(guide(page).getByRole("heading", { name: "Pick your term" })).toBeFocused();
    await expect(guide(page).getByRole("heading", { name: "Pick your term" })).toBeInViewport();
  });
});
