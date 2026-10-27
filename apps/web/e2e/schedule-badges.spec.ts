import { expect, test, type Page } from "@playwright/test";

const screenshotDir = "e2e/screenshots";
const TERM = "2027-C";

type Plan = {
  courses: string[];
  startsAfter?: number;
  blocked?: { day: string; start: number; end: number; label?: string }[];
  locks?: Record<string, string[]>;
  sortPreset?: string;
};

/** Opens the planner on C Term with a saved draft. */
async function openPlan(page: Page, plan: Plan) {
  await page.addInitScript(
    ({ term, draft }) => {
      localStorage.setItem("goatplan:term:v1", term);
      localStorage.setItem("goatplan:tutorial:v1", "done");
      localStorage.setItem(`goatplan:draft:v1:${term}`, JSON.stringify(draft));
    },
    {
      term: TERM,
      draft: {
        version: 1,
        courses: plan.courses,
        preferences: { startsAfter: plan.startsAfter ?? 540, blocked: plan.blocked ?? [], onlyOpen: true },
        locks: plan.locks ?? {},
        sortPreset: plan.sortPreset ?? "bestOverall",
        alternatives: {},
        professorByCourse: {},
      },
    },
  );
  await page.goto("/");
  await expect(page.locator("[data-planner-term-status]")).toHaveAttribute("data-planner-term-status", "ready", {
    timeout: 30_000,
  });
  await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");
}

const badgeList = (page: Page) => page.getByRole("list", { name: "This schedule" });

/** The free-time badge's wording: minutes under an hour, then hours to the nearest half hour. */
const FREE_TIME = /^(No gaps between classes|\d+ min free between classes|\d+(\.5)? h free between classes)$/;
/** The old badge counted breaks of 30 minutes or more. */
const GAP_COUNT = /^(No gaps|\d+ gaps?)$/;

/** The free time a badge says, in minutes: "No gaps between classes" → 0, "2.5 h free between classes" → 150. */
function freeMinutes(text: string): number {
  expect(text).toMatch(FREE_TIME);
  const hours = text.match(/^([\d.]+) h /);
  if (hours) return Number(hours[1]) * 60;
  return Number(text.match(/^(\d+) min /)?.[1] ?? 0);
}

test("flipping to the next schedule updates the badges", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // MA 1023 and PH 1110 give many schedules to page through.
  await openPlan(page, { courses: ["MA 1023", "PH 1110"], sortPreset: "bestOverall" });

  const list = badgeList(page);
  await expect(list).toBeVisible();
  const firstBadges = await list.locator("li").allTextContents();
  expect(firstBadges.length).toBeGreaterThan(0);
  expect(firstBadges.length).toBeLessThanOrEqual(3);

  // Every badge should be non-empty and contain text.
  for (const badge of firstBadges) {
    expect(badge.trim().length).toBeGreaterThan(0);
  }
  // Best overall always has room for the free time between classes, and the old gap count is gone.
  expect(firstBadges.filter((badge) => FREE_TIME.test(badge))).toHaveLength(1);
  expect(firstBadges.some((badge) => GAP_COUNT.test(badge))).toBe(false);

  // Page to the next schedule.
  await page.getByRole("button", { name: "Next schedule" }).click();
  await expect(page.getByText("Schedule 2 of")).toBeVisible();

  // Badges should still be visible (they update to the new schedule).
  const secondBadges = await list.locator("li").allTextContents();
  expect(secondBadges.length).toBeGreaterThan(0);
  expect(secondBadges.length).toBeLessThanOrEqual(3);
  expect(secondBadges.filter((badge) => FREE_TIME.test(badge))).toHaveLength(1);

  await page.screenshot({ path: `${screenshotDir}/badges-1440.png` });
});

test("under Most compact the free time leads, and #1 never shows more of it than #2", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // MA 1024 and PH 1110 have schedules with and without breaks longer than the 10-minute walk.
  await openPlan(page, { courses: ["MA 1024", "PH 1110"], sortPreset: "fewestGaps" });

  const lead = badgeList(page).getByRole("listitem").first();
  const shown: number[] = [];
  for (let position = 1; position <= 5; position++) {
    if (position > 1) await page.getByRole("button", { name: "Next schedule" }).click();
    await expect(page.getByText(`Schedule ${position} of`)).toBeVisible();
    await expect(lead).toHaveText(FREE_TIME);
    shown.push(freeMinutes(await lead.innerText()));
  }

  expect(shown[0]).toBeLessThanOrEqual(shown[1]);
  // The same rule as the ranking, so the free time never goes down while paging on.
  expect(shown).toEqual([...shown].sort((a, b) => a - b));

  await page.getByRole("button", { name: "Previous schedule" }).click();
  await page.screenshot({ path: `${screenshotDir}/badges-most-compact-1440.png` });
});

test("badges wrap without overflow at 834 px", async ({ page }) => {
  await page.setViewportSize({ width: 834, height: 1194 });
  // Use a plan that produces badges.
  await openPlan(page, {
    courses: ["AE 2320", "AE 2410"],
    blocked: [
      { day: "Tue", start: 840, end: 960, label: "Work" },
      { day: "Fri", start: 840, end: 960, label: "Work" },
    ],
    locks: { "AE 2320": ["AE 2320-CX02"] },
  });

  const list = badgeList(page);
  await expect(list).toBeVisible();

  // Get the bounding box of the badge list and the parent wrapper.
  const summaryLine = list.locator("..");
  const parentBox = await summaryLine.boundingBox();
  expect(parentBox).not.toBeNull();

  // Every badge pill should be fully visible (not clipped).
  for (const pill of await list.locator("li").all()) {
    const box = await pill.boundingBox();
    expect(box).not.toBeNull();
    // Badge right edge should not exceed the viewport width.
    expect(box!.x + box!.width).toBeLessThanOrEqual(834 + 1);
  }

  await page.screenshot({ path: `${screenshotDir}/badges-834.png`, fullPage: true });
});
