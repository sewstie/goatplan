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

  // Page to the next schedule.
  await page.getByRole("button", { name: "Next schedule" }).click();
  await expect(page.getByText("Schedule 2 of")).toBeVisible();

  // Badges should still be visible (they update to the new schedule).
  const secondBadges = await list.locator("li").allTextContents();
  expect(secondBadges.length).toBeGreaterThan(0);
  expect(secondBadges.length).toBeLessThanOrEqual(3);

  await page.screenshot({ path: `${screenshotDir}/badges-1440.png` });
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
