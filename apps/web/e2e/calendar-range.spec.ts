import { expect, frozenTerm, test } from "./fixtures/test";
import type { Page } from "@playwright/test";
import type { TermFile } from "../src/lib/data/types";

const source: TermFile = frozenTerm("2027-C");
const calendar = (page: Page) => page.getByRole("region", { name: "Weekly schedule" });

async function openCalendar(page: Page, times: number[], blocked: { day: string; start: number; end: number }[] = [], withOtherCourses = false) {
  const data = structuredClone(source);
  const course = data.courses.find((item) => item.code === "AE 2410")!;
  const section = structuredClone(course.sections[0]);
  course.sections = times.map((start, index) => ({
    ...section,
    id: `AE 2410-C0${index + 1}`,
    code: `C0${index + 1}`,
    meetings: [{ days: ["Mon"], start, end: start + 50, location: "Higgins Labs 116" }],
  }));
  course.options = course.sections.map((item) => [item.id]);
  await page.route("**/data/2027-C.json", (route) => route.fulfill({ json: data }));
  await page.addInitScript(({ blocks, withOtherCourses }) => {
    localStorage.setItem("goatplan:term:v1", "2027-C");
    localStorage.setItem("goatplan:draft:v1:2027-C", JSON.stringify({
      version: 1,
      courses: withOtherCourses ? ["AE 2320", "AE 2410", "AE 2210"] : ["AE 2410"],
      preferences: { startsAfter: 0, blocked: blocks, onlyOpen: true },
      locks: withOtherCourses ? { "AE 2320": ["AE 2320-CX02"] } : {},
      sortPreset: "fewestEarly",
      alternatives: {},
    }));
  }, { blocks: blocked, withOtherCourses });
  await page.goto("/");
  await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done", { timeout: 30_000 });
}

for (const scenario of [
  { name: "normal", start: 600, caption: "Auto-fit · 8:00 AM–5:00 PM" },
  { name: "evening", start: 1080, caption: "Auto-fit · 8:00 AM–7:00 PM" },
  { name: "early", start: 450, caption: "Auto-fit · 7:00 AM–5:00 PM" },
]) {
  test(`${scenario.name} class fits at desktop and tablet widths`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openCalendar(page, [scenario.start], [{ day: "Tue", start: 840, end: 960 }], true);
    for (const width of [1440, 834]) {
      await page.setViewportSize({ width, height: width === 834 ? 1194 : 900 });
      const week = calendar(page);
      await expect(week.getByText(scenario.caption)).toBeVisible();
      const grid = week.getByRole("group", { name: "Calendar time grid" });
      await expect.poll(() => grid.evaluate((node) => node.scrollHeight <= node.clientHeight + 1)).toBe(true);
      const card = (await week.boundingBox())!;
      const block = (await week.locator("[data-block]").filter({ hasText: "AE 2410" }).boundingBox())!;
      expect(block.y).toBeGreaterThan(card.y);
      expect(block.y + block.height).toBeLessThan(card.y + card.height);
      await page.mouse.move(0, 0);
      await page.screenshot({ path: `e2e/screenshots/calendar-range-${scenario.name}-${width}.png`, fullPage: true, animations: "disabled" });
    }
  });
}

test("paging keeps the range and calendar height from the whole answer", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openCalendar(page, [660, 1080]);
  const caption = calendar(page).getByText("Auto-fit · 8:00 AM–7:00 PM");
  await expect(caption).toBeVisible();
  await expect(page.getByText("Schedule 1 of 2")).toBeVisible();
  await expect(calendar(page).locator("[data-block]")).toHaveAccessibleName(/11:00 AM/);
  const before = await calendar(page).boundingBox();
  await page.getByRole("button", { name: "Next schedule" }).click();
  await expect(page.getByText("Schedule 2 of 2")).toBeVisible();
  await expect(calendar(page).locator("[data-block]")).toHaveAccessibleName(/6:00 PM/);
  await expect(caption).toBeVisible();
  expect(await calendar(page).boundingBox()).toEqual(before);
});

test("long ranges scroll with their hour labels and remain keyboard accessible", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 720 });
  await openCalendar(page, [660], [{ day: "Sun", start: 0, end: 1440 }]);
  const week = calendar(page);
  await expect(week.getByText("7 days")).toBeVisible();
  const grid = week.getByRole("group", { name: "Calendar time grid" });
  await expect.poll(() => grid.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
  const hourHeight = await grid.locator('[aria-hidden="true"]').first().evaluate((node) => node.clientHeight / 24);
  expect(hourHeight).toBeGreaterThanOrEqual(36);
  await grid.focus();
  await page.keyboard.press("End");
  await expect.poll(() => grid.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  await expect(grid.getByText("11 PM", { exact: true })).toBeInViewport();
  await page.screenshot({ path: "e2e/screenshots/calendar-range-scroll-1440.png" });
});

test("range changes animate briefly and respect reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openCalendar(page, [660]);
  const block = calendar(page).locator("[data-block]");
  expect(await block.evaluate((node) => getComputedStyle(node).transitionProperty)).toContain("top");
  await page.getByRole("button", { name: "Block a time" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Sunday", { exact: true }).check();
  await dialog.getByLabel("From", { exact: true }).selectOption("1080");
  await dialog.getByLabel("To", { exact: true }).selectOption("1200");
  await dialog.getByRole("button", { name: "Block time", exact: true }).click();
  await expect(calendar(page).getByText("Auto-fit · 8:00 AM–8:00 PM")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await block.evaluate((node) => getComputedStyle(node).transitionDuration)).toBe("0s");
  const grid = calendar(page).getByRole("group", { name: "Calendar time grid" });
  expect(await grid.locator(":scope > div").evaluate((node) => getComputedStyle(node).transitionDuration)).toBe("0s");
});
