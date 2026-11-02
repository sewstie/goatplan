import { expect, test } from "./fixtures/test";
import type { Page } from "@playwright/test";
import { DEGREE_FLAG_KEY, fixtureHistory, openDegree, panel, stored } from "./fixtures/degree";

type Plan = { courses?: string[]; degree?: boolean };

async function openPlanner(page: Page, { courses = ["MA 1022", "PH 1110", "AE 2320"], degree = false }: Plan = {}) {
  await page.addInitScript(({ courses, degree, flag }) => {
    localStorage.setItem("goatplan:term:v1", "2027-C");
    localStorage.setItem("goatplan:tutorial:v1", "dismissed");
    if (degree) localStorage.setItem(flag, "on");
    localStorage.setItem("goatplan:draft:v1:2027-C", JSON.stringify({ version: 1, courses, preferences: { startsAfter: 540, blocked: [], onlyOpen: false }, locks: {}, professorByCourse: {}, sortPreset: "bestOverall", alternatives: {} }));
  }, { courses, degree, flag: DEGREE_FLAG_KEY });
  await page.goto("/");
  await expect(page.locator("[data-planner-term-status]")).toHaveAttribute("data-planner-term-status", "ready", { timeout: 30_000 });
  await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done", { timeout: 30_000 });
}

const calendar = (page: Page) => page.getByRole("region", { name: "Weekly schedule" });
const details = (page: Page) => page.getByRole("complementary", { name: "Course details" });
const pageScrolls = (page: Page) => page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight);
const sidewaysScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
const firstBlock = (page: Page) => page.locator("[data-block]").first();

function textUnder12(page: Page) {
  return page.evaluate(() => {
    const small: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const element = walker.currentNode.parentElement!;
      const text = walker.currentNode.textContent!.trim();
      const box = element.getBoundingClientRect();
      if (!text || ["SCRIPT", "STYLE"].includes(element.tagName) || !element.checkVisibility({ visibilityProperty: true }) || box.width <= 1 || box.height <= 1) continue;
      const size = parseFloat(getComputedStyle(element).fontSize);
      if (size < 12) small.push(`${size}px "${text.slice(0, 40)}"`);
    }
    return [...new Set(small)];
  });
}

const midHistory = () => {
  const mid = fixtureHistory("degree-history-mid.json");
  return { ...mid, courses: mid.courses.map((course, index) => ({ ...course, term: index % 3 === 0 ? "A Term 2026" : index % 3 === 1 ? "B Term 2026" : "Prior credit" })) };
};

test.describe("the planner fits the window", () => {
  for (const [width, height] of [[1440, 900], [1280, 800]] as const) {
    test(`at ${width}×${height} there is no page scroll, the calendar starts high and a 50-minute class shows its room`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openPlanner(page);
      expect(await pageScrolls(page)).toBe(false);
      expect((await calendar(page).boundingBox())!.y).toBeLessThanOrEqual(140);
      const block = page.getByRole("button", { name: /^MA 1022 CL01, .*Monday/ });
      await expect(block.getByText("CL01")).toBeVisible();
      await expect(block.getByText("3:00 PM–3:50 PM")).toBeVisible();
      await expect(block.getByText("Salisbury Labs 115")).toBeVisible();
      expect(await block.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(0);
    });
  }

  test("an hour is at least 64 px, and the calendar scrolls inside its panel below that", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 });
    await openPlanner(page);
    expect(await pageScrolls(page)).toBe(false);
    const grid = page.getByRole("group", { name: "Calendar time grid" });
    await expect.poll(() => grid.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeGreaterThan(0);
    const hour = await page.evaluate(() => {
      const lines = [...document.querySelectorAll('[role="group"][aria-label="Calendar time grid"] .border-t')].map((line) => line.getBoundingClientRect().top);
      return lines[1] - lines[0];
    });
    expect(hour).toBeGreaterThanOrEqual(64);
  });

  test("drawing mode shows 8 AM to 10 PM at 64 px an hour, scrolling inside its panel", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPlanner(page);
    await page.getByRole("button", { name: "Block a time" }).click();
    await expect(page.getByText(/Auto-fit · 8:00 AM–10:00 PM/)).toBeVisible();
    expect(await pageScrolls(page)).toBe(false);
    const grid = page.getByRole("group", { name: "Calendar time grid" });
    await expect.poll(() => grid.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeGreaterThan(0);
  });

  test("No set time is one row of chips, only as tall as its chips", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPlanner(page);
    const strip = calendar(page).getByRole("region", { name: "No set time" });
    await expect(strip.getByRole("listitem")).toContainText("PH 1110");
    expect((await strip.boundingBox())!.height).toBeLessThanOrEqual(40);
  });
});

test.describe("warnings stay in the toolbar", () => {
  test("a failed seat refresh turns the seat status into a chip and doesn't move the calendar", async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPlanner(page);
    const before = await calendar(page).boundingBox();
    await context.route("**/api/seats?*", (route) => route.abort());
    await page.getByRole("button", { name: "Refresh seats" }).click();
    await expect(page.getByRole("status", { name: "Seat freshness" })).toContainText("Seats from");
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
    expect(await calendar(page).boundingBox()).toEqual(before);
    await context.unroute("**/api/seats?*");
    await context.route("**/api/seats?*", (route) => route.fulfill({ json: { termId: "2027-C", fetchedAt: "2026-11-12T12:00:00Z", sections: [] } }));
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByRole("status", { name: "Seat freshness" })).toContainText(/^Seats/);
    await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
  });

  test('"Showing the best N" is a small note beside the count, and doesn\'t move the calendar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPlanner(page, { courses: ["CS 2223", "CS 3013", "MA 1022", "PH 1110", "AE 2320", "WR 1011"] });
    const note = page.getByRole("button", { name: "About these schedules" });
    if ((await note.count()) === 0) test.skip(true, "This plan isn't over the shown limit in the frozen data.");
    expect((await calendar(page).boundingBox())!.y).toBeLessThanOrEqual(140);
    await note.click();
    await expect(page.getByText(/^Showing the best|too many combinations/i).first()).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("a course that fits nothing opens the fix panel without taking focus, and it can be reopened", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem("goatplan:term:v1", "2027-C");
      localStorage.setItem("goatplan:tutorial:v1", "dismissed");
      localStorage.setItem("goatplan:draft:v1:2027-C", JSON.stringify({ version: 1, courses: ["AE 2320"], preferences: { startsAfter: 600, blocked: [], onlyOpen: false }, locks: {}, professorByCourse: {}, sortPreset: "bestOverall", alternatives: {} }));
    });
    await page.goto("/");
    await expect(details(page).getByText("Ways to fix it")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("body")).toBeFocused();
    expect((await calendar(page).boundingBox())!.y).toBeLessThanOrEqual(140);
    await page.getByRole("button", { name: "Close course details" }).click();
    await expect(details(page)).toHaveCount(0);
    await page.getByRole("button", { name: "See how to fix it" }).click();
    await expect(details(page).getByText("Ways to fix it")).toBeVisible();
  });
});

test.describe("the details drawer", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("day columns are at least 190 px wide with it closed", async ({ page }) => {
    await openPlanner(page);
    await expect(details(page)).toHaveCount(0);
    expect((await page.getByRole("group", { name: "Monday", exact: true }).boundingBox())!.width).toBeGreaterThanOrEqual(190);
    expect((await page.getByRole("complementary", { name: "Term and courses" }).boundingBox())!.width).toBe(224);
  });

  test("a class block opens it, and Escape closes it with focus back on the block", async ({ page }) => {
    await openPlanner(page);
    await firstBlock(page).focus();
    await page.keyboard.press("Enter");
    await expect(details(page)).toBeVisible();
    const box = (await details(page).locator("xpath=ancestor::dialog").boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(320);
    await expect(page.getByRole("button", { name: "Close course details" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(details(page)).toHaveCount(0);
    await expect(firstBlock(page)).toBeFocused();
  });

  test("a course in Your courses opens it, and × closes it with focus back on the course", async ({ page }) => {
    await openPlanner(page);
    const row = page.locator('[data-course-row="PH 1110"]');
    await row.focus();
    await page.keyboard.press("Enter");
    await expect(details(page).getByRole("heading", { name: "PH 1110" })).toBeVisible();
    await page.getByRole("button", { name: "Close course details" }).click();
    await expect(details(page)).toHaveCount(0);
    await expect(row).toBeFocused();
  });

  test("another block can be picked while it's open, and focus comes back to that one", async ({ page }) => {
    await openPlanner(page);
    await page.locator('[data-course-row="PH 1110"]').click();
    await expect(details(page).getByRole("heading", { name: "PH 1110" })).toBeVisible();
    const block = page.getByRole("button", { name: /^MA 1022 CL01, .*Monday/ });
    await block.click();
    await expect(details(page).getByRole("heading", { name: "MA 1022" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(block).toBeFocused();
  });

  test("it stays docked open from 1600 px, with no close button", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 900 });
    await openPlanner(page);
    await expect(details(page)).toBeVisible();
    await expect(page.getByRole("button", { name: "Close course details" })).toHaveCount(0);
    expect((await details(page).boundingBox())!.width).toBeGreaterThanOrEqual(320);
    expect(await pageScrolls(page)).toBe(false);
  });
});

test.describe("the top bar", () => {
  test("with My degree hidden it shows the logo and no lone tab", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPlanner(page);
    const bar = page.getByRole("banner").first();
    await expect(bar.getByRole("link", { name: "GoatPlan" })).toBeVisible();
    await expect(bar.getByRole("link", { name: "Planner" })).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: "Schedule planner" })).toBeAttached();
    expect((await bar.boundingBox())!.height).toBe(56);
  });

  test("with My degree on it shows both tabs", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPlanner(page, { degree: true });
    const bar = page.getByRole("banner").first();
    await expect(bar.getByRole("link", { name: "Planner" })).toHaveAttribute("aria-current", "page");
    await expect(bar.getByRole("link", { name: "My degree" })).toBeVisible();
  });

  test("below 1100 px, Share, Export and Saved plans sit in a menu that works with the keyboard", async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 1112 });
    await openPlanner(page, { degree: true });
    expect(await sidewaysScroll(page)).toBe(false);
    await expect(page.getByRole("button", { name: "Share", exact: true })).toBeHidden();
    await expect(page.getByRole("button", { name: "Save schedule" })).toBeVisible();
    const more = page.getByRole("button", { name: "More actions" });
    await more.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Share", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Export", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Saved plans/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Share", exact: true })).toBeHidden();
    await expect(more).toBeFocused();
  });

  for (const width of [768, 1100, 1280]) {
    test(`nothing overflows at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openPlanner(page, { degree: true });
      expect(await sidewaysScroll(page)).toBe(false);
      const bar = page.getByRole("banner").first();
      expect(await bar.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(0);
    });
  }
});

test.describe("My degree", () => {
  test("at 1440×900 the ring, Pace and Take in C Term show without scrolling, and the page is compact", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDegree(page, midHistory());
    for (const heading of ["Pace & what-if", "Take in C Term"]) {
      const box = (await page.getByRole("heading", { name: heading }).boundingBox())!;
      expect(box.y + box.height).toBeLessThanOrEqual(900);
    }
    const ring = (await page.getByRole("region", { name: "Your progress" }).boundingBox())!;
    expect(ring.y + ring.height).toBeLessThanOrEqual(900);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(1300);
    expect(await sidewaysScroll(page)).toBe(false);
  });

  test("below 1280 the cards are a row that scrolls sideways above the sheet", async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await openDegree(page, midHistory());
    const row = page.getByRole("group", { name: "Your progress and what to do next" });
    expect((await row.boundingBox())!.y).toBeLessThan((await page.getByRole("region", { name: "Your sheet" }).boundingBox())!.y);
    expect(await row.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
    expect(await sidewaysScroll(page)).toBe(false);
  });

  for (const width of [1440, 834, 375]) {
    test(`no text under 12 px at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openDegree(page, midHistory());
      expect(await textUnder12(page)).toEqual([]);
    });
  }

  test("code, line number and section name sizes", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDegree(page, midHistory());
    const size = (locator: ReturnType<Page["locator"]>) => locator.evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
    const tile = page.getByRole("button", { name: /^CS 1102, line 16/ });
    expect(await size(tile.getByText("CS 1102", { exact: true }))).toBe(14);
    expect(await size(tile.getByText("16", { exact: true }))).toBe(12);
    expect(await size(page.getByRole("heading", { name: "Mathematics" }).last())).toBe(16);
  });

  test("a done tile says its term only when it has one, and never No term", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const mid = fixtureHistory("degree-history-mid.json");
    await openDegree(page, { ...mid, courses: mid.courses.map(({ term: _term, ...course }) => course) });
    await expect(page.getByRole("region", { name: "Your sheet" }).getByText("No term")).toHaveCount(0);
  });

  test("a finished section folds to one line and opens by keyboard", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDegree(page, midHistory());
    const row = page.getByRole("button", { name: /^Social science/ });
    await expect(row).toHaveAttribute("aria-expanded", "false");
    await expect(row).toContainText("PSY 1400 · GOV 1100");
    await row.focus();
    await page.keyboard.press("Enter");
    await expect(row).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("button", { name: /^PSY 1400, line/ })).toBeVisible();
  });

  test("identical empty lines stack, open by keyboard, and still take a dragged course", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDegree(page, midHistory());
    const stack = page.getByRole("button", { name: /^CS 4000\+, 5 lines left/ });
    await expect(stack).toContainText("CS 4000+ · 5 left");
    await expect(stack).toHaveAttribute("aria-expanded", "false");
    await stack.focus();
    await page.keyboard.press("Enter");
    await expect(stack).toHaveAttribute("aria-expanded", "true");
    await expect(stack).toBeFocused();
    for (const line of [26, 27, 28, 29, 30]) await expect(page.getByRole("button", { name: new RegExp(`^CS 4000\\+, line ${line}, empty`) })).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(stack).toHaveAttribute("aria-expanded", "false");

    const electives = page.getByRole("button", { name: /^Free elective, 3 lines left/ });
    await page.getByRole("button", { name: /^CS 3013, line/ }).dragTo(electives);
    await expect.poll(async () => (await stored(page)).pins).toEqual([{ code: "CS 3013", line: 13 }]);
  });

  test("MQP has its own row between Computer science and Mathematics, with its official lines", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDegree(page, midHistory());
    const names = await page.getByRole("region", { name: "Your sheet" }).locator("h3:visible").allTextContents();
    const cs = names.indexOf("Computer science");
    expect(names[cs + 1]).toBe("MQP");
    expect(names[cs + 2]).toBe("Mathematics");
    for (const line of [31, 32, 33]) await expect(page.getByRole("checkbox", { name: `MQP, line ${line}` })).toBeVisible();
  });

  test("the to-check counter filters the sheet, and clicking again clears it", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDegree(page, midHistory());
    const counter = page.getByRole("button", { name: /to check\. Show only these/i });
    await counter.focus();
    await page.keyboard.press("Enter");
    await expect(counter).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(/Showing only lines to check/)).toBeVisible();
    await expect(page.getByRole("button", { name: /, line \d+, check this yourself/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /^CS 1102, line 16/ })).toHaveCount(0);
    await page.keyboard.press("Enter");
    await expect(counter).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("button", { name: /^CS 1102, line 16/ })).toBeVisible();
  });

  test("pasted courses can get a term in review, and Units per term and Pace fill in afterwards", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDegree(page, { courses: [{ code: "WR 1011", title: "", credits: 3, apIb: false, source: "found", inProgress: false }] });
    await page.getByRole("button", { name: "Add courses" }).click();
    await page.getByRole("tab", { name: /several/i }).click();
    await page.getByRole("textbox", { name: "Workday course text" }).fill("CS 1101\nMA 1021\nCS 2102");
    await page.getByRole("button", { name: "Review 3 courses" }).click();
    const review = panel(page, "Review detected courses");
    await review.getByRole("combobox", { name: "Term for selected" }).selectOption("A Term 2026");
    await expect(review.getByRole("listitem").first()).toContainText("A Term 2026");
    await review.getByRole("button", { name: "Add 3 courses" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "Units per term" })).toBeVisible();
    await expect(page.getByRole("figure", { name: "Units per term chart" })).toBeVisible();
    await expect(page.getByText("Add terms to see your pace")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Pace & what-if" })).toBeVisible();
    expect(((await stored(page)).courses as { code: string; term?: string }[]).find((course) => course.code === "CS 1101")?.term).toBe("A Term 2026");
  });

  test("term headings in the pasted text fill in each course's term", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDegree(page, { courses: [{ code: "WR 1011", title: "", credits: 3, apIb: false, source: "found", inProgress: false }] });
    await page.getByRole("button", { name: "Add courses" }).click();
    await page.getByRole("tab", { name: /several/i }).click();
    await page.getByRole("textbox", { name: "Workday course text" }).fill("A Term 2026\nCS 1101\nB Term 2026\nMA 1021");
    await page.getByRole("button", { name: "Review 2 courses" }).click();
    const review = panel(page, "Review detected courses");
    await expect(review.getByRole("listitem").filter({ hasText: "CS 1101" })).toContainText("A Term 2026");
    await expect(review.getByRole("listitem").filter({ hasText: "MA 1021" })).toContainText("B Term 2026");
  });
});

test.describe("the phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("has a bottom tab bar and no sideways scroll, on both pages", async ({ page }) => {
    await openPlanner(page, { degree: true });
    const tabs = page.getByRole("navigation", { name: "Main" });
    const box = (await tabs.boundingBox())!;
    expect(box.y + box.height).toBeGreaterThan(812 - 60);
    expect(await sidewaysScroll(page)).toBe(false);
    await tabs.getByRole("link", { name: "My degree" }).click();
    await expect(page).toHaveURL(/\/degree/);
    await expect(page.getByRole("heading", { level: 1, name: "My degree" })).toBeVisible();
    expect(await sidewaysScroll(page)).toBe(false);
  });

  test("the top bar keeps the logo and the term picker only", async ({ page }) => {
    await openPlanner(page, { degree: true });
    const main = page.getByRole("navigation", { name: "Main" });
    expect((await main.boundingBox())!.y).toBeGreaterThan(200);
    await expect(page.getByRole("link", { name: "GoatPlan" })).toBeVisible();
  });

  test("with My degree hidden there is no tab bar", async ({ page }) => {
    await openPlanner(page);
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
  });

  test("no text under 12 px on the planner", async ({ page }) => {
    await openPlanner(page, { degree: true });
    expect(await textUnder12(page)).toEqual([]);
  });
});
