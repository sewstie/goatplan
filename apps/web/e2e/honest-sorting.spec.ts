import { expect, test } from "./fixtures/test";
import type { Page } from "@playwright/test";
import type { TermFile } from "../src/lib/data/types";
import type { Draft, SortPresetId } from "../src/lib/store/types";
import { pickSort, SORT_LABELS, SORT_MENU_COURSES, sortControl, sortMenuTerm } from "./fixtures/sortMenu";

// Honest sorting: each order puts the best schedule on its own
// measure first, and only ties fall back to Best overall. Checked on the brief's courses with the
// published C Term data, and on the 48-schedule DEMO term from the sort-menu spec.

const DRAFT_KEY = "goatplan:draft:v1:2027-C";

type CourseSet = { name: string; courses: string[]; data?: () => TermFile };
const COURSE_SETS: CourseSet[] = [
  { name: "the brief's MA 1024, CS 2022 and PH 1110", courses: ["MA 1024", "CS 2022", "PH 1110"] },
  { name: "the DEMO term", courses: SORT_MENU_COURSES, data: sortMenuTerm },
];

/** Every order but Best overall, then Best overall again, so each one is picked by name while another is on. */
const PICKS: SortPresetId[] = ["fewestEarly", "latestStart", "earliestFinish", "fewestDays", "fewestGaps", "bestOverall"];

const START = /^Starts \d{1,2}(:\d{2})? (AM|PM)$/;
const FINISH = /^Done by \d{1,2}(:\d{2})? (AM|PM)$/;
const DAYS_OFF = /^(?:(?:Mon|Tue|Wed|Thu|Fri)(, (?:Mon|Tue|Wed|Thu|Fri))? off|([3-5]) days off)$/;
// The gap badge's wording is the schedule track's; either form leads Most compact.
const GAPS = /^(No gaps|\d+ gaps?)$|between classes$/;

/** The badge each order leads with. Unchanged by honest sorting; Best overall has none. */
const LEAD: Record<SortPresetId, RegExp | null> = {
  bestOverall: null,
  fewestEarly: START,
  latestStart: START,
  earliestFinish: FINISH,
  fewestDays: DAYS_OFF,
  fewestGaps: GAPS,
};

async function openPlanner(page: Page, set: CourseSet, sortPreset: SortPresetId) {
  if (set.data) {
    const data = set.data();
    await page.route("**/data/2027-C.json", (route) => route.fulfill({ json: data }));
  }
  const draft: Draft = {
    courses: set.courses,
    preferences: { startsAfter: 0, blocked: [], onlyOpen: true },
    locks: {},
    professorByCourse: {},
    sortPreset,
    alternatives: {},
  };
  await page.addInitScript(
    ({ key, draft }) => {
      if (sessionStorage.getItem("honest-sorting-seeded")) return;
      sessionStorage.setItem("honest-sorting-seeded", "1");
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
const position = (page: Page) => page.getByText(/^Schedule [\d,]+ of [\d,]+$/);

type Shown = { sections: string; badges: string[]; days: number };

/** The shown schedule as the student sees it: its sections, its badges, and its days on campus in the calendar. */
async function shownSchedule(page: Page): Promise<Shown> {
  const rows = await page.getByRole("region", { name: "Your courses" }).locator("[data-course-row]").allInnerTexts();
  const badges = await page.getByRole("list", { name: "This schedule" }).getByRole("listitem").allInnerTexts();
  const days = await page.getByRole("group", { name: "Calendar time grid" }).evaluate((grid) =>
    [...grid.querySelectorAll('[role="group"]')].filter((day) => day.querySelector("[data-block]:not([data-preview])")).length,
  );
  return { sections: rows.join(" / "), badges, days };
}

/** Walks schedules 1 to `count` (all of them when left out) with the Next arrow and returns each one. */
async function walkSchedules(page: Page, count?: number): Promise<Shown[]> {
  const pill = (await position(page).innerText()).match(/^Schedule 1 of ([\d,]+)$/);
  expect(pill, "the top schedule is shown").not.toBeNull();
  const total = Number(pill![1].replace(/,/g, ""));
  const seen: Shown[] = [];
  for (let at = 1; at <= Math.min(count ?? total, total); at++) {
    if (at > 1) await page.getByRole("button", { name: "Next schedule" }).click();
    await expect(page.getByText(`Schedule ${at} of ${total.toLocaleString("en-US")}`, { exact: true })).toBeVisible();
    seen.push(await shownSchedule(page));
  }
  return seen;
}

/** "Starts 11 AM" → 660, "Done by 4:50 PM" → 1010. */
function clock(badge: string): number {
  const match = badge.match(/(\d{1,2})(?::(\d{2}))? (AM|PM)$/);
  expect(match, `a time in “${badge}”`).not.toBeNull();
  return ((Number(match![1]) % 12) + (match![3] === "PM" ? 12 : 0)) * 60 + Number(match![2] ?? 0);
}

/** Weekdays off from the leading badge: "Fri off" → 1, "Tue, Fri off" → 2, "4 days off" → 4, no badge → 0. */
function daysOff(badges: readonly string[]): number {
  const match = badges[0]?.match(DAYS_OFF);
  if (!match) return 0;
  return match[2] ? Number(match[2]) : match[1] ? 2 : 1;
}

/** The order's badge leads #1 and #2, and on #1 it's at least as good as on #2. */
function expectLeadBadge(preset: SortPresetId, top: Shown, second: Shown) {
  const lead = LEAD[preset];
  for (const schedule of [top, second]) {
    expect(schedule.badges.length).toBeGreaterThan(0);
    expect(schedule.badges.length).toBeLessThanOrEqual(3);
    // A schedule with class every weekday has no days-off badge, so Start leads instead.
    if (lead && !(preset === "fewestDays" && schedule.days >= 5)) expect(schedule.badges[0]).toMatch(lead);
  }
  if (preset === "latestStart") expect(clock(top.badges[0])).toBeGreaterThanOrEqual(clock(second.badges[0]));
  if (preset === "earliestFinish") expect(clock(top.badges[0])).toBeLessThanOrEqual(clock(second.badges[0]));
  if (preset === "fewestDays") {
    expect(daysOff(top.badges)).toBeGreaterThanOrEqual(daysOff(second.badges));
    expect(top.days).toBeLessThanOrEqual(second.days);
  }
}

for (const set of COURSE_SETS) {
  test(`on ${set.name}, each order picked by name leads with its best schedule, and the tops differ`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPlanner(page, set, "bestOverall");
    const [bestOverall] = await walkSchedules(page, 1);

    const tops = new Map<SortPresetId, Shown>();
    for (const preset of PICKS) {
      await pickSort(page, SORT_LABELS[preset]);
      await settled(page);
      await expect(sortControl(page)).toHaveText(`Sort${SORT_LABELS[preset]}`);
      const [top, second] = await walkSchedules(page, 2);
      expect(second, "at least two schedules to compare").toBeDefined();
      expectLeadBadge(preset, top, second);
      tops.set(preset, top);
    }

    // Switching orders changes the top where a better one exists: the six orders don't share one #1.
    expect(new Set([...tops.values()].map((top) => top.sections)).size).toBeGreaterThanOrEqual(2);
    // Picking Best overall again brings its top back.
    expect(tops.get("bestOverall")).toEqual(bestOverall);
    // Most days off never puts more days on campus first than Best overall does.
    expect(tops.get("fewestDays")!.days).toBeLessThanOrEqual(bestOverall.days);
  });

  test(`on ${set.name}, Most days off never shows a schedule with more days on campus above one with fewer`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPlanner(page, set, "bestOverall");

    await pickSort(page, "Most days off");
    await settled(page);
    await expect(sortControl(page)).toHaveText("SortMost days off");

    const shown = await walkSchedules(page);
    expect(shown.length).toBeGreaterThan(1);
    const days = shown.map((schedule) => schedule.days);
    for (const [index, count] of days.entries()) {
      expect(count, `schedule ${index + 1} has class on some day`).toBeGreaterThan(0);
      expect(days[0], `#1 against schedule ${index + 1}`).toBeLessThanOrEqual(count);
      if (index > 0) expect(days[index - 1], `schedule ${index} against ${index + 1}`).toBeLessThanOrEqual(count);
    }
  });
}
