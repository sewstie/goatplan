import { expect, test, type Page } from "@playwright/test";

const screenshotDir = "e2e/screenshots";
const TERM = "2027-C";

type Plan = {
  courses: string[];
  startsAfter?: number;
  blocked?: { day: string; start: number; end: number }[];
  locks?: Record<string, string[]>;
};

// The courses of the design frames (div.app-19.md): AE 2320 with lab CX02 locked, Work blocked Tue and Fri 2–4 PM.
const designPlan: Plan = {
  courses: ["AE 2320", "AE 2410", "AE 2210"],
  blocked: [
    { day: "Tue", start: 840, end: 960 },
    { day: "Fri", start: 840, end: 960 },
  ],
  locks: { "AE 2320": ["AE 2320-CX02"] },
};

/** Opens the planner on C Term with a saved draft, the way a returning student would. */
async function openPlan(page: Page, plan: Plan | null) {
  await page.addInitScript(
    ({ term, draft }) => {
      localStorage.setItem("goatplan:term:v1", term);
      if (draft) localStorage.setItem(`goatplan:draft:v1:${term}`, JSON.stringify(draft));
    },
    {
      term: TERM,
      draft: plan && {
        version: 1,
        courses: plan.courses,
        preferences: { startsAfter: plan.startsAfter ?? 540, blocked: plan.blocked ?? [], onlyOpen: true },
        locks: plan.locks ?? {},
        sortPreset: "fewestEarly",
        alternatives: {},
      },
    },
  );
  await page.goto("/");
  await expect(page.locator("[data-planner-term-status]")).toHaveAttribute("data-planner-term-status", "ready", {
    timeout: 30_000,
  });
  if (plan) await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");
}

const calendar = (page: Page) => page.getByRole("region", { name: "Weekly schedule" });

test("first visit shows the empty week and the first-course message", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPlan(page, null);
  await expect(calendar(page).getByRole("heading", { name: "Add your first course" })).toBeVisible();
  await expect(calendar(page).getByText("No timed courses yet")).toBeVisible();
  await expect(page.getByText("Add courses to start planning your term.")).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/schedule-empty-1440.png` });
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 834, height: 1194 },
]) {
  test(`the design's plan at ${viewport.width}px fits the calendar to its classes`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openPlan(page, designPlan);

    await expect(page.getByText("Schedule 1 of 1")).toBeVisible();
    await expect(page.getByRole("button", { name: "Next schedule" })).toHaveCount(0);
    await expect(page.getByText("3 courses · 1 schedule fits")).toBeVisible();
    await expect(page.getByRole("list", { name: "This schedule" })).toContainText("5 days on campus");

    const week = calendar(page);
    await expect(week.getByText("Auto-fit · 8:30 AM–4:30 PM")).toBeVisible();
    await expect(week.getByText("No classes before 9:00 AM")).toBeVisible();
    await expect(week.getByRole("group", { name: "Monday" }).getByRole("button")).toHaveCount(3);
    await expect(
      week.getByRole("button", { name: "AE 2320 CX02, Introduction to Orbital Mechanics, Thursday, 3:00 PM–3:50 PM, Higgins Labs 230 Geom Modeling Computer Lab, Ye Lu, locked" }),
    ).toBeVisible();
    await expect(week.getByRole("group", { name: "Tuesday" }).getByText("Blocked time")).toBeVisible();

    // Nothing in the calendar spills past the card.
    const card = (await week.boundingBox())!;
    for (const block of await week.locator("[data-block]").all()) {
      const box = (await block.boundingBox())!;
      expect(box.x + box.width).toBeLessThanOrEqual(card.x + card.width);
      expect(box.y + box.height).toBeLessThanOrEqual(card.y + card.height);
    }

    await week.getByRole("button", { name: /^AE 2410 C01, .*Tuesday/ }).hover();
    await expect(page.locator("[data-calendar-tooltip]")).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/schedule-${viewport.width}.png`, fullPage: true });
  });
}

test("block tooltips render outside the calendar card, so a late block's tooltip isn't cut off", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPlan(page, designPlan);
  const lab = calendar(page).getByRole("button", { name: /^AE 2320 CX02/ });

  await lab.focus();
  const tooltip = page.locator("[data-calendar-tooltip]");
  await expect(tooltip).toContainText("AE 2320 · CX02");
  await expect(tooltip).toContainText("Thu · 3:00–3:50 PM");
  await expect(calendar(page).locator("[data-calendar-tooltip]")).toHaveCount(0);
  await expect(page.locator("body > [data-calendar-tooltip]")).toHaveCount(1);

  const box = (await tooltip.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(900);
  expect(box.x + box.width).toBeLessThanOrEqual(1440);

  await page.keyboard.press("Escape");
  await expect(tooltip).toHaveCount(0);

  await lab.click();
  await expect(lab).toHaveAttribute("aria-pressed", "true");
});

test("the switcher pages through schedules with its arrows and the arrow keys, and notes the cap", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPlan(page, { courses: ["MA 1023", "PH 1110"] });

  const pill = page.getByText(/^Schedule \d+ of 200$/);
  await expect(pill).toHaveText("Schedule 1 of 200");
  await expect(page.getByRole("status").filter({ hasText: "Showing the best 200 of" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Previous schedule" })).toHaveAttribute("aria-disabled", "true");

  await page.getByRole("button", { name: "Next schedule" }).click();
  await expect(pill).toHaveText("Schedule 2 of 200");
  await page.keyboard.press("ArrowRight");
  await expect(pill).toHaveText("Schedule 3 of 200");

  // With nothing focused, the arrow keys still work.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("ArrowLeft");
  await expect(pill).toHaveText("Schedule 2 of 200");
  await page.screenshot({ path: `${screenshotDir}/schedule-many-1440.png` });
});

test("sections with no set time are listed under the grid", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPlan(page, { ...designPlan, courses: [...designPlan.courses, "AE 5131"] });
  await expect(page.getByText("4 courses · 1 schedule fits · 1 course has no set time")).toBeVisible();
  const strip = calendar(page).getByRole("region", { name: "No set time" });
  await expect(strip.getByText("AE 5131 · C01")).toBeVisible();
  await expect(strip.getByText("Incompressible Fluid Dynamics · Online, asynchronous")).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/schedule-no-set-time-1440.png` });
});

test("while the term loads the calendar shows placeholders, and a failed load offers Retry", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const data = { fail: false, release: null as (() => void) | null };
  await page.route(`**/data/${TERM}.json`, async (route) => {
    if (data.fail) return route.abort();
    await new Promise<void>((resolve) => (data.release = resolve));
    await route.continue();
  });
  await page.addInitScript((term) => localStorage.setItem("goatplan:term:v1", term), TERM);
  await page.goto("/");

  await expect(page.getByText("Loading C Term sections…")).toBeVisible();
  await expect(calendar(page).getByText("Awaiting term data")).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/schedule-loading-1440.png` });
  await expect.poll(() => data.release !== null).toBe(true);
  data.release?.();
  await expect(calendar(page).getByRole("heading", { name: "Add your first course" })).toBeVisible();

  data.fail = true;
  await page.reload();
  await expect(calendar(page).getByRole("heading", { name: "Couldn’t load C Term sections." })).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/schedule-error-1440.png` });

  await page.unroute(`**/data/${TERM}.json`);
  await calendar(page).getByRole("button", { name: "Retry" }).click();
  await expect(calendar(page).getByRole("heading", { name: "Add your first course" })).toBeVisible();
});
