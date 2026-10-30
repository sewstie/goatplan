import { expect, test } from "./fixtures/test";
import type { CDPSession, Page } from "@playwright/test";

async function openPlan(page: Page, blocked: { day: string; start: number; end: number }[] = [], courses = ["CS 1101"]) {
  await page.addInitScript(({ blocked, courses }) => {
    localStorage.setItem("goatplan:term:v1", "2027-C");
    localStorage.setItem("goatplan:tutorial:v1", "dismissed");
    localStorage.setItem(
      "goatplan:draft:v1:2027-C",
      JSON.stringify({
        version: 1,
        courses,
        preferences: { startsAfter: 0, blocked, onlyOpen: true },
        locks: {},
        professorByCourse: {},
        sortPreset: "bestOverall",
        alternatives: {},
      }),
    );
  }, { blocked, courses });
  await page.goto("/");
  await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done", { timeout: 30_000 });
}

/** Scrolls Monday's 12 PM into view and gives the point at a time in that column (8 AM to 10 PM while drawing). */
async function mondayAt(page: Page, minute: number) {
  const monday = page.getByRole("group", { name: "Monday", exact: true });
  await monday.evaluate((element) => {
    const box = element.getBoundingClientRect();
    window.scrollBy(0, box.top + box.height * 0.3 - window.innerHeight / 2);
  });
  const box = (await monday.boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + ((minute - 480) / 840) * box.height };
}

async function touch(cdp: CDPSession, type: "touchStart" | "touchMove" | "touchEnd", point?: { x: number; y: number }) {
  await cdp.send("Input.dispatchTouchEvent", { type, touchPoints: point ? [{ x: point.x, y: point.y }] : [] });
}

async function startDrawing(page: Page) {
  await page.getByRole("button", { name: "Block time", exact: true }).click();
  await expect(page.getByRole("button", { name: "Drawing busy times" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("group", { name: "Drawing mode" })).toBeVisible();
}

async function drawMonday(page: Page, cdp: CDPSession, from: number, to: number) {
  const start = await mondayAt(page, from);
  const end = await mondayAt(page, to);
  await touch(cdp, "touchStart", start);
  for (let step = 1; step <= 8; step += 1) {
    await touch(cdp, "touchMove", { x: start.x, y: start.y + ((end.y - start.y) * step) / 8 });
  }
  await touch(cdp, "touchEnd");
}

/** The grid's top in page coordinates, so scrolling doesn't count as moving. */
const gridTop = (page: Page) =>
  page.getByRole("group", { name: "Calendar time grid" }).evaluate((element) => Math.round(element.getBoundingClientRect().top + window.scrollY));

async function expectGridAt(page: Page, top: number) {
  expect(Math.abs((await gridTop(page)) - top)).toBeLessThanOrEqual(1);
}

const blockedInDraft = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("goatplan:draft:v1:2027-C") ?? "{}").preferences?.blocked);

test("in drawing mode a drag down a day blocks that time, with no press and hold", async ({ page }) => {
  await openPlan(page);
  await startDrawing(page);
  const cdp = await page.context().newCDPSession(page);
  const from = await mondayAt(page, 725);
  const to = await mondayAt(page, 775);
  const before = await page.evaluate(() => window.scrollY);

  await touch(cdp, "touchStart", from);
  for (let step = 1; step <= 8; step += 1) {
    await touch(cdp, "touchMove", { x: from.x, y: from.y + ((to.y - from.y) * step) / 8 });
  }
  await expect(page.getByText("Mon 12:00–1:00 PM", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(before);
  await touch(cdp, "touchEnd");

  await expect(page.getByRole("status").filter({ hasText: "Blocked Mon 12–1 PM" })).toBeVisible();
  expect(await blockedInDraft(page)).toEqual([{ day: "Mon", start: 720, end: 780 }]);
  await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");
  await page.getByRole("group", { name: "Drawing mode" }).evaluate((element) => element.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: "e2e/screenshots/drag-block-375.png" });
});

test("in drawing mode the day button still shows the other days", async ({ page }) => {
  await openPlan(page);
  await startDrawing(page);
  const scroller = page.getByRole("group", { name: "Calendar time grid" });
  await page.getByRole("button", { name: "Swipe for more days" }).click();
  await expect.poll(() => scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await expect(page.getByRole("group", { name: "Drawing mode" })).toBeVisible();
});

test("out of drawing mode a swipe scrolls the page and blocks nothing", async ({ page }) => {
  await openPlan(page);
  const cdp = await page.context().newCDPSession(page);
  const from = await mondayAt(page, 725);
  const before = await page.evaluate(() => window.scrollY);

  await touch(cdp, "touchStart", from);
  for (let step = 1; step <= 8; step += 1) await touch(cdp, "touchMove", { x: from.x, y: from.y - step * 25 });
  await touch(cdp, "touchEnd");

  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
  await page.waitForTimeout(600);
  expect(await blockedInDraft(page)).toEqual([]);
  await expect(page.getByRole("status").filter({ hasText: "Blocked" })).toHaveCount(0);
});

test("in drawing mode the week stays in view when nothing fits, so the time can be erased", async ({ page }) => {
  await openPlan(page);
  await startDrawing(page);
  const cdp = await page.context().newCDPSession(page);
  const top = await gridTop(page);

  await drawMonday(page, cdp, 605, 655);
  await expect(page.getByRole("status").filter({ hasText: "Blocked Mon 10–11 AM" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Needs attention" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Weekly schedule" })).toBeVisible();
  await expect(page.getByLabel("Monday 10:00 to 11:00 AM, blocked", { exact: true })).toBeVisible();
  await page.getByRole("region", { name: "Weekly schedule" }).evaluate((element) => element.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: "e2e/screenshots/drawing-nothing-fits-375.png" });
  await expectGridAt(page, top);

  await drawMonday(page, cdp, 605, 655);
  await expect(page.getByRole("status").filter({ hasText: "Unblocked Mon 10–11 AM" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Needs attention" })).toHaveCount(0);
  expect(await blockedInDraft(page)).toEqual([]);
  await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");
  await expectGridAt(page, top);
});

test("drawing mode turns on when nothing fits on load, and the grid stays put as the count goes to 0 and back", async ({ page }) => {
  await openPlan(page, [{ day: "Mon", start: 600, end: 660 }]);
  await expect(page.getByRole("region", { name: "Needs attention" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Weekly schedule" })).toBeHidden();

  await startDrawing(page);
  const grid = page.getByRole("region", { name: "Weekly schedule" });
  await expect(grid).toBeVisible();
  await expect(page.getByLabel("Monday 10:00 to 11:00 AM, blocked", { exact: true })).toBeVisible();
  // CS 1101's 10:00–10:50 preview lies on top, so the blocked time's text hides there.
  await expect(page.locator('[data-blocked-time="Mon-600-660"] [data-blocked-text]')).toHaveCSS("mask-image", /rgba\(0, 0, 0, 0\) 0%, rgba\(0, 0, 0, 0\) 83.33%/);
  const gridBox = (await grid.boundingBox())!;
  const cardBox = (await page.getByRole("region", { name: "Needs attention" }).boundingBox())!;
  expect(gridBox.y + gridBox.height).toBeLessThanOrEqual(cardBox.y);

  const cdp = await page.context().newCDPSession(page);
  const top = await gridTop(page);
  await drawMonday(page, cdp, 605, 655);
  await expect(page.getByRole("status").filter({ hasText: "Unblocked Mon 10–11 AM" })).toBeVisible();
  await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");
  await expect(page.getByRole("region", { name: "Needs attention" })).toHaveCount(0);
  await expectGridAt(page, top);

  await drawMonday(page, cdp, 605, 655);
  await expect(page.getByRole("region", { name: "Needs attention" })).toBeVisible();
  await expectGridAt(page, top);
});

test("in drawing mode the grid stays put between 22 schedules and none", async ({ page }) => {
  await openPlan(page, [], ["PH 1110", "ES 2501", "AE 2320"]);
  await startDrawing(page);
  await expect(page.getByText("3 courses · 22 schedules fit", { exact: true })).toBeVisible();
  const cdp = await page.context().newCDPSession(page);
  const top = await gridTop(page);

  await drawMonday(page, cdp, 485, 1100);
  await expect(page.getByRole("region", { name: "Needs attention" })).toBeVisible();
  await expect(page.getByText("0 schedules fit", { exact: true })).toBeVisible();
  await expectGridAt(page, top);

  await drawMonday(page, cdp, 485, 1100);
  await expect(page.getByText("3 courses · 22 schedules fit", { exact: true })).toBeVisible();
  await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");
  await expectGridAt(page, top);
});
