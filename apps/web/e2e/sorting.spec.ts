import { expect, test } from "./fixtures/test";
import type { Locator, Page } from "@playwright/test";
import type { TermFile } from "../src/lib/data/types";
import type { Draft, SortPresetId } from "../src/lib/store/types";
import { coursePanelTerm } from "./fixtures/coursePanel";
import { pickSort, SORT_MENU_COURSES, sortControl, sortList, sortMenuTerm, sortMenuTops, sortOption } from "./fixtures/sortMenu";

// Sorting and badges together: the order picked in the Sort menu re-ranks the schedules in the
// engine, and the badge for that order leads every schedule it ranks.

const screenshotDir = "e2e/screenshots";
const DRAFT_KEY = "goatplan:draft:v1:2027-C";
const DONE_BY = /^Done by \d{1,2}(:\d{2})? (AM|PM)$/;
const DAYS_OFF = /^((Mon|Tue|Wed|Thu|Fri)(, (Mon|Tue|Wed|Thu|Fri))? off|[3-5] days off)$/;

const sortDraft = (sortPreset: SortPresetId): Draft => ({
  courses: SORT_MENU_COURSES,
  preferences: { startsAfter: 0, blocked: [], onlyOpen: true },
  locks: {},
  professorByCourse: {},
  sortPreset,
  alternatives: {},
});

// The div.app-6 planner: AE 2320, AE 2410 and AE 2210, 9:00 AM start, Work on Tue and Fri.
const designDraft: Draft = {
  courses: ["AE 2320", "AE 2410", "AE 2210"],
  preferences: {
    startsAfter: 540,
    blocked: [
      { day: "Tue", start: 840, end: 960, label: "Work" },
      { day: "Fri", start: 840, end: 960, label: "Work" },
    ],
    onlyOpen: true,
  },
  locks: {},
  professorByCourse: {},
  sortPreset: "fewestEarly",
  alternatives: {},
};

/** Opens the planner on C Term with this term data and draft. Reloads keep what the page saved since. */
async function openPlanner(page: Page, data: TermFile, draft: Draft) {
  await page.route("**/data/2027-C.json", (route) => route.fulfill({ json: data }));
  await page.addInitScript(
    ({ key, draft }) => {
      if (sessionStorage.getItem("sorting-seeded")) return;
      sessionStorage.setItem("sorting-seeded", "1");
      localStorage.setItem("goatplan:tutorial:v1", "completed");
      localStorage.setItem("goatplan:term:v1", "2027-C");
      localStorage.setItem(key, JSON.stringify({ version: 1, ...draft }));
    },
    { key: DRAFT_KEY, draft },
  );
  await page.goto("/");
  await settled(page);
}

const settled = (page: Page) =>
  expect(page.locator("[data-planner-solve-status]").last()).toHaveAttribute("data-planner-solve-status", "done", { timeout: 30_000 });
const preferencesRow = (page: Page) => page.getByRole("group", { name: "Preferences", exact: true });
const badgeList = (page: Page) => page.getByRole("list", { name: "This schedule" });
const badges = (page: Page) => badgeList(page).getByRole("listitem");
const header = (page: Page) => page.locator("header");
const position = (page: Page, at: number) => page.getByText(`Schedule ${at} of 48`, { exact: true });

/** The lecture each DEMO course takes in the shown schedule, read from "Your courses". */
async function shownSections(page: Page): Promise<string[]> {
  const rows = page.getByRole("region", { name: "Your courses" }).locator("[data-course-row]");
  return (await rows.allInnerTexts()).map((text) => text.match(/\bL0\d\b/)?.[0] ?? "");
}

/** The shown schedule as the student sees it: its lectures and its badges, in order. */
async function shownSchedule(page: Page) {
  return { sections: await shownSections(page), badges: await badges(page).allInnerTexts() };
}

/** Picks an order with the mouse and waits for the engine's new ranking. */
async function pickWithMouse(page: Page, label: string) {
  await pickSort(page, label);
  await settled(page);
}

/** Walks schedules 1 to `count` with the Next arrow and returns each one. Ends on schedule `count`. */
async function firstSchedules(page: Page, count: number) {
  const seen: Awaited<ReturnType<typeof shownSchedule>>[] = [];
  for (let at = 1; at <= count; at++) {
    if (at > 1) await page.getByRole("button", { name: "Next schedule" }).click();
    await expect(position(page, at)).toBeVisible();
    seen.push(await shownSchedule(page));
  }
  return seen;
}

async function box(locator: Locator) {
  const found = await locator.boundingBox();
  expect(found).not.toBeNull();
  return found!;
}

const overlaps = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

const fill = (locator: Locator) => locator.evaluate((element) => getComputedStyle(element).backgroundColor);

/** A theme color as the browser computes it, e.g. "--color-accent-soft" → "rgb(…)". */
const token = (page: Page, name: string) =>
  page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = `var(${name})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  }, name);

test("picking Earliest finish re-ranks the schedules and puts “Done by …” first", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPlanner(page, sortMenuTerm(), sortDraft("bestOverall"));
  await expect(sortControl(page)).toHaveText("SortBest overall");
  await expect(badges(page).first()).toHaveText(sortMenuTops.bestOverall.firstBadge);
  await expect(badges(page).first()).not.toHaveText(DONE_BY);

  // Start away from schedule 1, so the jump back to the top is seen.
  await page.getByRole("button", { name: "Next schedule" }).click();
  await expect(position(page, 2)).toBeVisible();

  await pickWithMouse(page, "Earliest finish");
  await expect(sortControl(page)).toHaveText("SortEarliest finish");
  await expect(position(page, 1)).toBeVisible();
  await expect.poll(() => shownSections(page)).toEqual(sortMenuTops.earliestFinish.sections);
  await expect(badges(page).first()).toHaveText(sortMenuTops.earliestFinish.firstBadge);

  // The badge leads every schedule in this order, not just the top one.
  for (const schedule of await firstSchedules(page, 4)) {
    expect(schedule.badges.length).toBeGreaterThan(0);
    expect(schedule.badges.length).toBeLessThanOrEqual(3);
    expect(schedule.badges[0]).toMatch(DONE_BY);
  }
});

test("picking Most days off with the keyboard puts the days-off badge first", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPlanner(page, sortMenuTerm(), sortDraft("earliestFinish"));
  await expect(badges(page).first()).toHaveText(sortMenuTops.earliestFinish.firstBadge);

  const sort = sortControl(page);
  await sort.focus();
  await page.keyboard.press("Enter");
  await expect(sortList(page)).toBeVisible();
  await page.keyboard.press("M");
  await page.keyboard.press("Enter");
  await expect(sortList(page)).toBeHidden();
  await expect(sort).toBeFocused();
  await settled(page);

  await expect(sort).toHaveText("SortMost days off");
  await expect(position(page, 1)).toBeVisible();
  await expect.poll(() => shownSections(page)).toEqual(sortMenuTops.fewestDays.sections);
  await expect(badges(page).first()).toHaveText(sortMenuTops.fewestDays.firstBadge);

  for (const schedule of await firstSchedules(page, 4)) {
    expect(schedule.badges.length).toBeLessThanOrEqual(3);
    expect(schedule.badges[0]).toMatch(DAYS_OFF);
  }
});

test("after save-and-open, the plan shows the same order with the same badges", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPlanner(page, sortMenuTerm(), sortDraft("bestOverall"));
  await pickWithMouse(page, "Most days off");
  const ranked = await firstSchedules(page, 5);
  expect(ranked[0].badges[0]).toBe(sortMenuTops.fewestDays.firstBadge);
  expect(new Set(ranked.map((schedule) => schedule.sections.join())).size).toBe(5);

  // Save while schedule 3 is shown.
  await page.getByRole("button", { name: "Previous schedule" }).click();
  await page.getByRole("button", { name: "Previous schedule" }).click();
  await expect(position(page, 3)).toBeVisible();
  await header(page).getByRole("button", { name: "Save schedule" }).click();
  await page.getByRole("dialog", { name: "Save schedule" }).getByRole("textbox", { name: "Plan name" }).fill("Fewer days");
  await page.keyboard.press("Enter");
  await expect(header(page).getByRole("button", { name: "Schedule saved", exact: true })).toBeVisible();
  const saved = await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((key) => key.startsWith("goatplan:plans:v1:plan:"))
      .map((key) => JSON.parse(localStorage.getItem(key)!) as { id: string; sortPreset: string }),
  );
  expect(saved).toHaveLength(1);
  expect(saved[0].sortPreset).toBe("fewestDays");

  // A new plan starts on Best overall, so opening the saved plan has to bring its order back.
  await header(page).getByRole("button", { name: "Saved plans" }).click();
  await page.getByRole("list", { name: "Plan actions" }).getByRole("button", { name: "Start a new plan" }).click();
  await expect(page.getByRole("region", { name: "Your courses" }).locator("[data-course-row]")).toHaveCount(0);

  await header(page).getByRole("button", { name: "Saved plans" }).click();
  await page.getByRole("list", { name: /^Saved plans for/ }).getByRole("button", { name: /Fewer days/ }).click();
  await settled(page);
  await expect(sortControl(page)).toHaveText("SortMost days off");

  // The saved schedule is still third, and the five before and around it come in the same order.
  await expect(position(page, 3)).toBeVisible();
  expect(await shownSchedule(page)).toEqual(ranked[2]);
  await page.getByRole("button", { name: "Previous schedule" }).click();
  await page.getByRole("button", { name: "Previous schedule" }).click();
  expect(await firstSchedules(page, 5)).toEqual(ranked);

  // The read-only view names the order and, like the old score chips, shows no badges.
  await page.goto(`/?view=saved&plan=${saved[0].id}`);
  await settled(page);
  await expect(preferencesRow(page)).toContainText("SortMost days off");
  await expect(preferencesRow(page).getByRole("combobox")).toHaveCount(0);
  await expect(badgeList(page)).toHaveCount(0);
});

for (const [width, height] of [
  [1440, 900],
  [834, 1194],
] as const) {
  test(`the planner with badges and the Sort list open at ${width} px, with screenshots`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openPlanner(page, coursePanelTerm("07"), designDraft);
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);
    const sort = sortControl(page);

    // Fewest early classes leads with the start; there is class every weekday, so no days-off badge.
    await expect(sort).toHaveText("SortFewest early classes");
    await expect(badges(page)).toHaveText(["Starts 9 AM", "2 h free between classes", "Done by 2:50 PM"]);

    // The closed control has the Preferences row's height.
    const sortBox = await box(sort);
    expect(sortBox.width).toBeGreaterThanOrEqual(146);
    expect(sortBox.height).toBeCloseTo(32, 0);

    // Whole pills, inside the window, clear of the switcher, the plan actions and Sort.
    const listBox = await box(badgeList(page));
    for (const pill of await badges(page).all()) {
      const pillBox = await box(pill);
      expect(pillBox.x + pillBox.width).toBeLessThanOrEqual(width);
      expect(await pill.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    for (const other of [
      page.getByRole("group", { name: "Schedules" }),
      header(page).getByRole("button", { name: "Saved plans" }),
      header(page).getByRole("button", { name: "Save schedule" }),
      sort,
    ]) {
      expect(overlaps(listBox, await box(other))).toBe(false);
    }
    const sideways = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(sideways).toBeLessThanOrEqual(0);

    // The title area and Preferences row: badges under the title, the closed Sort control at the end.
    const main = await box(page.locator("main"));
    const top = await box(header(page));
    const row = await box(preferencesRow(page));
    const clip = { x: main.x, y: top.y, width: main.width, height: row.y + row.height - top.y };
    await page.screenshot({ path: `${screenshotDir}/sorting-badges-${width}.png`, fullPage: width === 834, animations: "disabled" });
    await expect(page).toHaveScreenshot(`sorting-badges-${width}.png`, { clip, animations: "disabled" });

    // The list open over the planner, with the badges still in view.
    await sort.click();
    const list = sortList(page);
    await expect(list).toBeVisible();
    await expect(list.getByRole("option", { selected: true })).toHaveAccessibleName("Fewest early classes");
    await expect(badgeList(page)).toBeVisible();
    expect(overlaps(await box(list), listBox)).toBe(false);
    // The picked order keeps its soft accent fill while highlighted; the pointer moves the one highlight.
    const picked = list.getByRole("option", { selected: true });
    await expect(sort).toHaveAttribute("aria-activedescendant", (await picked.getAttribute("id"))!);
    expect(await fill(picked)).toBe(await token(page, "--color-accent-soft"));
    const hovered = sortOption(page, "Most compact");
    await hovered.hover();
    expect(await fill(hovered)).toBe(await token(page, "--color-surface-selected"));
    expect(await fill(picked)).toBe(await token(page, "--color-accent-soft"));
    await picked.hover();
    expect(await fill(hovered)).toBe("rgba(0, 0, 0, 0)");
    await page.mouse.move(0, 0);
    await page.screenshot({ path: `${screenshotDir}/sorting-open-${width}.png`, fullPage: width === 834, animations: "disabled" });
    await expect(list).toHaveScreenshot(`sorting-list-${width}.png`, { animations: "disabled" });

    // Picking Earliest finish ranks the 2:50 PM finish first, and its badge leads.
    await sortOption(page, "Earliest finish").click();
    await expect(list).toBeHidden();
    await expect(sort).toBeFocused();
    await settled(page);
    await expect(sort).toHaveText("SortEarliest finish");
    await expect(page.getByText("Schedule 1 of 2", { exact: true })).toBeVisible();
    await expect(badges(page)).toHaveText(["Done by 2:50 PM", "Starts 9 AM", "2 h free between classes"]);
    await page.mouse.move(0, 0);
    await page.screenshot({ path: `${screenshotDir}/sorting-earliest-finish-${width}.png`, fullPage: width === 834, animations: "disabled" });
  });
}
