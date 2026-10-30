import { expect, test } from "./fixtures/test";
import type { CDPSession, Page } from "@playwright/test";

async function openPlan(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("goatplan:term:v1", "2027-C");
    localStorage.setItem("goatplan:tutorial:v1", "dismissed");
    localStorage.setItem(
      "goatplan:draft:v1:2027-C",
      JSON.stringify({
        version: 1,
        courses: ["CS 1101"],
        preferences: { startsAfter: 0, blocked: [], onlyOpen: true },
        locks: {},
        professorByCourse: {},
        sortPreset: "bestOverall",
        alternatives: {},
      }),
    );
  });
  await page.goto("/");
  await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done", { timeout: 30_000 });
}

/** Scrolls Monday's 12 PM into view and gives the point at a time in that column (8 AM to 5 PM). */
async function mondayAt(page: Page, minute: number) {
  const monday = page.getByRole("group", { name: "Monday", exact: true });
  await monday.evaluate((element) => {
    const box = element.getBoundingClientRect();
    window.scrollBy(0, box.top + box.height * 0.45 - window.innerHeight / 2);
  });
  const box = (await monday.boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + ((minute - 480) / 540) * box.height };
}

async function touch(cdp: CDPSession, type: "touchStart" | "touchMove" | "touchEnd", point?: { x: number; y: number }) {
  await cdp.send("Input.dispatchTouchEvent", { type, touchPoints: point ? [{ x: point.x, y: point.y }] : [] });
}

const blockedInDraft = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("goatplan:draft:v1:2027-C") ?? "{}").preferences?.blocked);

test("press and hold, then drag down a day, blocks that time", async ({ page }) => {
  await openPlan(page);
  const cdp = await page.context().newCDPSession(page);
  const from = await mondayAt(page, 725);
  const to = await mondayAt(page, 775);

  await touch(cdp, "touchStart", from);
  await page.waitForTimeout(550);
  for (let step = 1; step <= 8; step += 1) {
    await touch(cdp, "touchMove", { x: from.x, y: from.y + ((to.y - from.y) * step) / 8 });
  }
  await expect(page.getByText("Mon 12:00–1:00 PM", { exact: true })).toBeVisible();
  await touch(cdp, "touchEnd");

  await expect(page.getByRole("status").filter({ hasText: "Blocked Mon 12–1 PM" })).toBeVisible();
  expect(await blockedInDraft(page)).toEqual([{ day: "Mon", start: 720, end: 780 }]);
  await page.screenshot({ path: "e2e/screenshots/drag-block-375.png" });
});

test("a quick swipe scrolls the page and blocks nothing", async ({ page }) => {
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
