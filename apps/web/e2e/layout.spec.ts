import { expect, test } from "./fixtures/test";
import type { Page } from "@playwright/test";
import { DEGREE_FLAG_KEY, fixtureHistory, openDegree, stored } from "./fixtures/degree";

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
    test(`at ${width}×${height} there is no page scroll, the calendar starts high and a 50-minute class shows its code`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openPlanner(page);
      expect(await pageScrolls(page)).toBe(false);
      // 150 px, or 190 when the summary's chips wrap, as they can where text renders wider (Linux).
      expect((await calendar(page).boundingBox())!.y).toBeLessThanOrEqual(190);
      const block = page.getByRole("button", { name: /^MA 1022 CL01, .*Monday/ });
      await expect(block.getByText("MA 1022")).toBeVisible();
      expect(await block.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(0);
    });
  }

  test("an hour is at least 36 px, and the calendar scrolls inside its panel below that", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 });
    await openPlanner(page);
    expect(await pageScrolls(page)).toBe(false);
    const grid = page.getByRole("group", { name: "Calendar time grid" });
    await expect.poll(() => grid.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeGreaterThan(0);
    const hour = await page.evaluate(() => {
      const lines = [...document.querySelectorAll('[role="group"][aria-label="Calendar time grid"] .border-t')].map((line) => line.getBoundingClientRect().top);
      return lines[1] - lines[0];
    });
    expect(hour).toBeGreaterThanOrEqual(35.9);
  });

  test("drawing mode moves the calendar down by one Preferences row at most and doesn't scroll the page", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPlanner(page);
    const top = (await calendar(page).boundingBox())!.y;
    await page.getByRole("button", { name: "Block a time" }).click();
    await expect(page.getByRole("group", { name: "Drawing mode" })).toBeVisible();
    expect((await calendar(page).boundingBox())!.y - top).toBeLessThanOrEqual(44);
    expect(await pageScrolls(page)).toBe(false);
  });

  test("No set time lists its course under the week", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPlanner(page);
    const strip = calendar(page).getByRole("region", { name: "No set time" });
    await expect(strip.getByRole("listitem")).toContainText("PH 1110");
    const grid = (await calendar(page).getByRole("group", { name: "Calendar time grid" }).boundingBox())!;
    expect((await strip.boundingBox())!.y).toBeGreaterThanOrEqual(grid.y + grid.height - 1);
    expect(await pageScrolls(page)).toBe(false);
  });
});

test.describe("warnings stay in the calendar header", () => {
  test('"Showing the best N" is a note above the calendar, and browsing doesn\'t move the calendar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPlanner(page, { courses: ["MA 1023", "PH 1110"] });
    await expect(page.getByText(/^Schedule 1 of 200$/)).toBeVisible();
    await expect(page.getByText(/^Showing the best 200 of [\d,]+ schedules\./)).toBeVisible();
    const before = await calendar(page).boundingBox();
    await page.getByRole("button", { name: "Next schedule" }).click();
    await expect(page.getByText(/^Schedule 2 of 200$/)).toBeVisible();
    expect(await calendar(page).boundingBox()).toEqual(before);
  });

  test("a course that fits nothing shows the ways to fix it without taking focus", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem("goatplan:term:v1", "2027-C");
      localStorage.setItem("goatplan:tutorial:v1", "dismissed");
      localStorage.setItem("goatplan:draft:v1:2027-C", JSON.stringify({ version: 1, courses: ["AE 2320"], preferences: { startsAfter: 600, blocked: [], onlyOpen: false }, locks: {}, professorByCourse: {}, sortPreset: "bestOverall", alternatives: {} }));
    });
    await page.goto("/");
    await expect(details(page).getByText("Ways to fix it")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("body")).toBeFocused();
    expect(await pageScrolls(page)).toBe(false);
  });
});

async function allFiveDays(page: Page) {
  const window = page.viewportSize()!.width;
  const panel = (await details(page).boundingBox())!;
  const week = (await calendar(page).boundingBox())!;
  expect(week.x + week.width <= panel.x || week.y + week.height <= panel.y, "the calendar is clear of the details").toBe(true);
  for (const day of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]) {
    const box = (await page.getByRole("group", { name: day, exact: true }).boundingBox())!;
    expect(box.x + box.width, day).toBeLessThanOrEqual(window);
    expect(box.x + box.width, day).toBeLessThanOrEqual(week.x + week.width);
    expect(box.width, day).toBeGreaterThanOrEqual(80);
  }
}

test.describe("the details sidebar", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const [width, height] of [[1100, 800], [1280, 800], [1440, 900], [1680, 900]] as const) {
    test(`at ${width} it stays open beside all five days, before and after a click`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openPlanner(page);
      const box = (await details(page).boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(268);
      if (width === 1440) expect(box.width).toBe(268);
      expect(box.x).toBeGreaterThan((await calendar(page).boundingBox())!.x);
      await allFiveDays(page);
      const before = await calendar(page).boundingBox();
      await firstBlock(page).click();
      expect(await calendar(page).boundingBox()).toEqual(before);
      await expect(details(page)).toBeVisible();
      await allFiveDays(page);
      expect(await pageScrolls(page)).toBe(false);
    });
  }

  for (const [width, height] of [[768, 1024], [834, 1112], [1024, 768]] as const) {
    test(`at ${width} it stays open under all five days`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openPlanner(page);
      await firstBlock(page).click();
      await expect(details(page)).toBeVisible();
      expect((await details(page).boundingBox())!.y).toBeGreaterThan((await calendar(page).boundingBox())!.y);
      await allFiveDays(page);
      expect(await pageScrolls(page)).toBe(false);
      expect(await sidewaysScroll(page)).toBe(false);
    });
  }

  test("the left sidebar is 264 px", async ({ page }) => {
    await openPlanner(page);
    expect((await page.getByRole("complementary", { name: "Term and courses" }).boundingBox())!.width).toBe(264);
  });

  test("the keyboard goes from a class block into the details, and Escape comes back with the details still open", async ({ page }) => {
    await openPlanner(page);
    const block = page.getByRole("button", { name: /^MA 1022 CL01, .*Monday/ });
    await block.focus();
    await page.keyboard.press("Enter");
    await expect(details(page).getByRole("heading", { name: "MA 1022" })).toBeVisible();
    await expect(details(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(block).toBeFocused();
    await expect(details(page).getByRole("heading", { name: "MA 1022" })).toBeVisible();
  });

  test("the keyboard goes from Your courses into the details and back", async ({ page }) => {
    await openPlanner(page);
    const row = page.locator('[data-course-row="PH 1110"]');
    await row.focus();
    await page.keyboard.press("Enter");
    await expect(details(page).getByRole("heading", { name: "PH 1110" })).toBeVisible();
    await expect(details(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(row).toBeFocused();
  });

  test("a mouse click leaves focus on the block, and says what's showing", async ({ page }) => {
    await openPlanner(page);
    const status = page.getByRole("status", { name: "Selected course" });
    await expect(status).toHaveText("");
    const block = page.getByRole("button", { name: /^MA 1022 CL01, .*Monday/ });
    await block.click();
    await expect(block).toBeFocused();
    await expect(status).toHaveText("Showing MA 1022 CL01 in Course details");
    await page.locator('[data-course-row="PH 1110"]').click();
    await expect(status).toHaveText("Showing PH 1110 in Course details");
  });

  test("locking a section from low in the panel keeps it in view", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await openPlanner(page, { courses: ["AE 2320"] });
    const panel = details(page);
    await page.getByRole("button", { name: /^AE 2320 CX\d+, .*Thursday/ }).click();
    await panel.getByRole("button", { name: /^Lock/ }).last().click();
    await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");
    await expect(panel.getByRole("button", { name: /^Unlock/ }).last()).toBeInViewport();
  });

  test("locking with the keyboard from low in the panel keeps focus in view", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await openPlanner(page, { courses: ["PH 1110"] });
    const panel = details(page);
    const lock = panel.getByRole("button", { name: /^Lock/ }).last();
    await lock.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");
    await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");
    await expect(page.locator(":focus")).toBeInViewport();
    const focus = (await page.locator(":focus").boundingBox())!;
    const area = (await panel.boundingBox())!;
    expect(focus.y).toBeGreaterThanOrEqual(area.y);
    expect(focus.y).toBeLessThan(area.y + area.height);
  });

  test("there's no way to close it", async ({ page }) => {
    await openPlanner(page);
    await expect(page.getByRole("button", { name: "Close course details" })).toHaveCount(0);
    await expect(page.locator("dialog[open]")).toHaveCount(0);
  });

  test("drawing keeps it open and the calendar where it was", async ({ page }) => {
    await openPlanner(page);
    const before = await calendar(page).boundingBox();
    await page.getByRole("button", { name: "Block a time" }).click();
    await expect(page.getByRole("group", { name: "Drawing mode" })).toBeVisible();
    await expect(details(page)).toBeVisible();
    const after = (await calendar(page).boundingBox())!;
    expect([after.x, after.width]).toEqual([before!.x, before!.width]);
  });

  for (const [width, height] of [[834, 1112], [1024, 768]] as const) {
    test(`drawing at ${width} hides the details, then they come back`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openPlanner(page);
      const before = (await calendar(page).boundingBox())!;
      await page.getByRole("button", { name: "Block a time" }).click();
      await expect(page.getByRole("group", { name: "Drawing mode" })).toBeVisible();
      await expect(details(page)).toBeHidden();
      const drawing = (await calendar(page).boundingBox())!;
      expect(drawing.y - before.y).toBeLessThanOrEqual(44);
      await page.keyboard.press("Escape");
      await expect(details(page)).toBeVisible();
    });
  }

});

test.describe("Escape belongs to whatever is open inside the page", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the lab disclosure closes, and the details stay", async ({ page }) => {
    await openPlanner(page, { courses: ["AE 2320"] });
    await page.locator('[data-course-row="AE 2320"]').click();
    const disclosure = page.getByRole("button", { name: /other lab choices/ });
    await disclosure.click();
    await expect(disclosure).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(disclosure).toHaveAttribute("aria-expanded", "false");
    await expect(disclosure).toBeFocused();
    await expect(details(page)).toBeVisible();
  });

  test("the Saved plans list closes, and opens above the details", async ({ page }) => {
    await openPlanner(page);
    const saved = page.getByRole("button", { name: /Saved plans/ });
    await saved.click();
    await expect(saved).toHaveAttribute("aria-expanded", "true");
    const item = page.getByRole("link", { name: /saved plans/i }).first();
    const box = (await item.boundingBox())!;
    expect(await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest("a") !== null, [box.x + box.width / 2, box.y + box.height / 2])).toBe(true);
    await page.keyboard.press("Escape");
    await expect(saved).toHaveAttribute("aria-expanded", "false");
    await expect(details(page)).toBeVisible();
  });

});

test.describe("every width keeps the toolbar and calendar steady", () => {
  for (const width of [768, 834, 1024, 1194]) {
    test(`at ${width}, browsing doesn't move the calendar`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await openPlanner(page, { courses: ["MA 1023", "PH 1110"] });
      const top = (await calendar(page).boundingBox())!.y;
      await page.getByRole("button", { name: "Next schedule" }).click();
      await expect(page.getByText(/^Schedule 2 of 200$/)).toBeVisible();
      expect((await calendar(page).boundingBox())!.y).toBe(top);
      await page.getByRole("button", { name: "Block a time" }).click();
      await expect(page.getByRole("group", { name: "Drawing mode" })).toBeVisible();
      expect((await calendar(page).boundingBox())!.y - top).toBeLessThanOrEqual(44);
    });
  }

  for (const width of [768, 780]) {
    test(`drawing mode with a blocked time doesn't scroll sideways at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.addInitScript(() => {
        localStorage.setItem("goatplan:term:v1", "2027-C");
        localStorage.setItem("goatplan:tutorial:v1", "dismissed");
        localStorage.setItem("goatplan:draft:v1:2027-C", JSON.stringify({ version: 1, courses: ["MA 1023"], preferences: { startsAfter: 540, blocked: [{ day: "Mon", start: 720, end: 780 }], onlyOpen: false }, locks: {}, professorByCourse: {}, sortPreset: "bestOverall", alternatives: {} }));
      });
      await page.goto("/");
      await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done", { timeout: 30_000 });
      await page.getByRole("button", { name: "Block a time" }).click();
      await expect(page.getByRole("group", { name: "Drawing mode" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Drawing busy times" })).toBeVisible();
      expect(await sidewaysScroll(page)).toBe(false);
    });
  }

  test("preference controls fit the calendar header at 768 with a blocked time", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1000 });
    await page.addInitScript(() => {
      localStorage.setItem("goatplan:term:v1", "2027-C");
      localStorage.setItem("goatplan:tutorial:v1", "dismissed");
      localStorage.setItem("goatplan:draft:v1:2027-C", JSON.stringify({ version: 1, courses: ["MA 1023"], preferences: { startsAfter: 540, blocked: [{ day: "Mon", start: 720, end: 780 }], onlyOpen: false }, locks: {}, professorByCourse: {}, sortPreset: "bestOverall", alternatives: {} }));
    });
    await page.goto("/");
    const group = page.getByRole("group", { name: "Preferences" });
    await expect(group.getByRole("button", { name: "Block a time" })).toBeVisible();
    expect(await group.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(0);
    expect((await group.getByRole("combobox", { name: "Starts after" }).boundingBox())!.height).toBeLessThanOrEqual(36);
  });

  test("badges that don't fit fold into details, and it opens", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1000 });
    await page.addInitScript(() => {
      localStorage.setItem("goatplan:term:v1", "2027-C");
      localStorage.setItem("goatplan:tutorial:v1", "dismissed");
      localStorage.setItem("goatplan:draft:v1:2027-C", JSON.stringify({ version: 1, courses: ["MA 1022", "PH 1110", "AE 2320"], preferences: { startsAfter: 540, blocked: [], onlyOpen: false }, locks: {}, professorByCourse: {}, sortPreset: "earliestFinish", alternatives: {} }));
    });
    await page.goto("/");
    await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done", { timeout: 30_000 });
    const top = (await page.locator("main").boundingBox())!.y;
    const days = (await calendar(page).getByRole("group", { name: "Calendar time grid" }).boundingBox())!.y;
    expect(days - top).toBeLessThanOrEqual(230);
    const details = page.getByRole("button", { name: "details" });
    if (await details.isVisible()) {
      await details.click();
      await expect(details).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press("Escape");
      await expect(details).toHaveAttribute("aria-expanded", "false");
    }
  });
});

test("shared plan actions stay on one row inside the bar at tablet widths", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPlanner(page);
  await page.getByRole("button", { name: "Share", exact: true }).click();
  const link = await page.getByRole("dialog", { name: "Share this schedule" }).getByRole("textbox").inputValue();
  await page.goto(link);
  await expect(page.getByRole("button", { name: "Save a copy" })).toBeVisible({ timeout: 30_000 });
  for (const width of [768, 834, 900, 976, 1099]) {
    await page.setViewportSize({ width, height: 1000 });
    const bar = (await page.getByRole("banner").first().boundingBox())!;
    for (const name of ["Close preview", "Save a copy", "Open for editing"]) {
      const box = (await page.getByRole("button", { name }).boundingBox())!;
      expect(box.y, `${name} at ${width}`).toBeGreaterThanOrEqual(bar.y);
      expect(box.y + box.height, `${name} at ${width}`).toBeLessThanOrEqual(bar.y + bar.height);
    }
    expect(await sidewaysScroll(page)).toBe(false);
  }
});

for (const width of [1440]) {
  test(`a room of 21 characters keeps its number on its block at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1280 ? 800 : 900 });
    await openPlanner(page, { courses: ["BB 402X"] });
    const block = page.locator("[data-block]").filter({ hasText: "BB 402X" }).first();
    await expect(block.getByText("Innovation Studio 203")).toBeVisible();
    const number = block.getByText("203", { exact: true });
    await expect(number).toBeVisible();
    const box = (await block.boundingBox())!;
    const shown = (await number.boundingBox())!;
    expect(shown.x + shown.width).toBeLessThanOrEqual(box.x + box.width);
  });
}

test.describe("the top bar", () => {
  for (const width of [768, 834, 1099, 1100, 1120, 1150, 1194, 1240, 1280]) {
    test(`nothing in it overlaps at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openPlanner(page, { courses: ["MA 1023", "PH 1110"], degree: true });
      const bar = page.getByRole("banner").first();
      const hits = await bar.evaluate((element) => [...element.querySelectorAll<HTMLElement>("a, button, select")].filter((control) => control.checkVisibility()).map((control) => {
        const box = control.getBoundingClientRect();
        const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return top === control || control.contains(top) ? null : control.getAttribute("aria-label") ?? control.textContent;
      }).filter(Boolean));
      expect(hits).toEqual([]);
      await expect(bar.getByRole("link", { name: "GoatPlan" })).toBeVisible();
      expect(await sidewaysScroll(page)).toBe(false);
    });
  }

  test("with My degree on it shows both tabs", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPlanner(page, { degree: true });
    const bar = page.getByRole("banner").first();
    await expect(bar.getByRole("link", { name: "Planner" })).toHaveAttribute("aria-current", "page");
    await expect(bar.getByRole("link", { name: "My degree" })).toBeVisible();
  });

  for (const width of [768, 834, 1280, 1440]) {
    test(`at ${width} it holds the logo, the tabs, the schedule switcher and the plan actions`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openPlanner(page, { degree: true });
      const bar = page.getByRole("banner").first();
      await expect(bar.getByRole("combobox")).toHaveCount(0);
      await expect(bar.getByRole("group", { name: "Schedules" })).toBeVisible();
      const names = await bar.locator("a:visible, button:visible").evaluateAll((items) => items.map((item) => item.getAttribute("aria-label") ?? item.textContent?.trim()));
      expect(names).toEqual(["GoatPlan", "Planner", "My degree", "Previous schedule", "Next schedule", "Saved plans", "Share", "Export", "Add to degree", "Save schedule", "Switch to dark theme"]);
      expect(await sidewaysScroll(page)).toBe(false);
    });
  }

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

test.describe("the left sidebar", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("runs Term, search, Your courses, then the three footer lines", async ({ page }) => {
    await openPlanner(page);
    const sidebar = page.getByRole("complementary", { name: "Term and courses" });
    const top = async (locator: ReturnType<Page["locator"]>) => (await locator.boundingBox())!.y;
    const term = sidebar.getByRole("combobox", { name: "Term" });
    const search = sidebar.getByRole("searchbox");
    const courses = sidebar.getByRole("heading", { name: "Your courses" });
    const positions = [await top(term), await top(search), await top(courses)];
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    await expect(sidebar.getByRole("group", { name: "Preferences" })).toHaveCount(0);
    await expect(sidebar.getByText("Saved on this device")).toHaveCount(0);
    await expect(sidebar.getByText(/^Data [A-Z][a-z]{2} \d+, \d+:\d{2}\s[AP]M$/)).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Source" })).toBeVisible();
    await expect(sidebar.getByRole("button", { name: "Guide", exact: true })).toBeVisible();
    await expect(sidebar.getByText("Seat counts can change")).toHaveCount(0);
    expect(await sidebar.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(0);
  });

  test("Preferences sit on one row above the calendar, beside Sort", async ({ page }) => {
    await openPlanner(page);
    const group = page.getByRole("group", { name: "Preferences" });
    await expect(group.getByRole("combobox", { name: "Starts after" })).toBeVisible();
    await expect(group.getByRole("button", { name: "Block a time" })).toBeVisible();
    await expect(group.getByRole("switch", { name: "Only open sections" })).toHaveText("Only open sections");
    const row = (await group.boundingBox())!;
    expect(row.height).toBeLessThanOrEqual(44);
    expect(row.y + row.height).toBeLessThanOrEqual((await calendar(page).boundingBox())!.y);
    const sort = (await page.getByRole("combobox", { name: "Sort" }).boundingBox())!;
    expect(Math.abs(sort.y + sort.height / 2 - (row.y + row.height / 2))).toBeLessThanOrEqual(4);
  });

  test("Term is the same list as Sort and works with the keyboard", async ({ page }) => {
    await openPlanner(page);
    const term = page.getByRole("complementary", { name: "Term and courses" }).getByRole("combobox", { name: "Term" });
    await term.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("listbox", { name: "Term" }).getByRole("option", { name: /^C Term/ })).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Escape");
    await expect(term).toBeFocused();
    await expect(page.getByRole("listbox", { name: "Term" })).toHaveCount(0);
  });

  test("the details are 268 px and the day columns at least 150 px at 1440", async ({ page }) => {
    await openPlanner(page);
    expect((await details(page).boundingBox())!.width).toBe(268);
    for (const day of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]) {
      expect((await page.getByRole("group", { name: day, exact: true }).boundingBox())!.width, day).toBeGreaterThanOrEqual(150);
    }
  });
});

test.describe("the summary line", () => {
  async function middles(page: Page) {
    const middle = async (locator: ReturnType<Page["locator"]>) => { const box = (await locator.boundingBox())!; return box.y + box.height / 2; };
    const count = await middle(page.getByText(/^3 courses · \d+ schedules fit$/));
    const chips = await middle(page.getByRole("list", { name: "This schedule" }).getByRole("listitem").first());
    return { count, chips };
  }

  for (const [width, height] of [[1280, 800], [1440, 900], [1680, 900]] as const) {
    test(`at ${width} the count and the chips share one line`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openPlanner(page);
      const { count, chips } = await middles(page);
      expect(Math.abs(count - chips)).toBeLessThanOrEqual(4);
    });
  }

  for (const width of [768, 834]) {
    test(`at ${width} the chips wrap to their own line under the count`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await openPlanner(page);
      const { count, chips } = await middles(page);
      expect(chips).toBeGreaterThan(count + 10);
      expect(await sidewaysScroll(page)).toBe(false);
    });
  }
});

test("no seat note on the planner or the Sections to register page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPlanner(page);
  await expect(page.getByText("Seat counts can change")).toHaveCount(0);
  await page.getByRole("button", { name: "Save schedule" }).click();
  await page.getByRole("dialog", { name: "Save schedule" }).getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("button", { name: "Schedule saved" })).toBeVisible();
  await page.getByRole("button", { name: /Saved plans/ }).click();
  await page.getByRole("link", { name: "All saved plans" }).click();
  await page.getByRole("link", { name: /section/i }).first().click();
  await expect(page.getByRole("heading", { name: "Ready for Workday" })).toBeVisible();
  await expect(page.getByText("Seat counts can change")).toHaveCount(0);
});

test.describe("My degree", () => {
  test("sheet tiles fill the row, and the stale MQP note is gone", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDegree(page, midHistory());
    await expect(page.getByText("MQP is included below")).toHaveCount(0);
    const tile = (await page.getByRole("button", { name: /^CS 1102, line 16/ }).boundingBox())!;
    expect(tile.width).toBeGreaterThanOrEqual(160);
    await expect(page.getByRole("combobox", { name: "Term" })).toHaveCount(0);
  });

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
    await openDegree(page, { ...mid, courses: mid.courses.map((course) => ({ ...course, term: undefined })) });
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
    await expect(stack).toContainText("5 left · Show lines");
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
    await page.getByRole("button", { name: "Keep pin" }).click();
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
    await expect(page.getByText(/^To check · \d+ lines?$/)).toBeVisible();
    await expect(page.getByRole("button", { name: /, line \d+, check this yourself/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /^CS 1102, line 16/ })).toHaveCount(0);
    await page.keyboard.press("Enter");
    await expect(counter).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("button", { name: /^CS 1102, line 16/ })).toBeVisible();
  });

});

test.describe("the phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("the guide has a place on the search screen with My degree on", async ({ page }) => {
    await page.addInitScript((flag) => {
      localStorage.setItem("goatplan:term:v1", "2027-C");
      localStorage.setItem(flag, "on");
    }, DEGREE_FLAG_KEY);
    await page.goto("/");
    const guide = page.locator(".guide-popover");
    await guide.getByRole("button", { name: "Next" }).click({ timeout: 30_000 });
    await expect(guide.getByRole("heading", { name: "Add your courses" })).toBeVisible();
    await expect(guide.getByRole("button", { name: "Skip" })).toBeVisible();
  });

  test("both pages share the top bar links and the footer, with no sideways scroll", async ({ page }) => {
    await openPlanner(page, { degree: true });
    for (const where of ["planner", "degree"]) {
      const bar = page.locator("[data-phone-topbar]");
      const tabs = bar.getByRole("navigation", { name: "Main" });
      await expect(tabs.getByRole("link", { name: where === "planner" ? "Planner" : "My degree" })).toHaveAttribute("aria-current", "page");
      await expect(bar.getByRole("link", { name: "GoatPlan" })).toBeVisible();
      const footer = page.locator("footer");
      await expect(footer.getByRole("link", { name: /Data source/ })).toBeVisible();
      await expect(footer.getByRole("button", { name: "How to use GoatPlan" })).toBeVisible();
      await expect(footer.getByRole("link", { name: /Send feedback/ })).toBeVisible();
      await expect(page.locator("[data-phone-tabs]")).toHaveCount(0);
      expect(await sidewaysScroll(page)).toBe(false);
      if (where === "planner") {
        await tabs.getByRole("link", { name: "My degree" }).click();
        await expect(page).toHaveURL(/\/degree/);
        await expect(page.getByRole("heading", { name: "Choose your major" })).toBeVisible();
      }
    }
  });

  test("the planner top bar fits the goat, both page links and the term picker", async ({ page }) => {
    await openPlanner(page, { degree: true });
    const bar = (await page.locator("[data-phone-topbar]").boundingBox())!;
    for (const item of [page.getByRole("link", { name: "GoatPlan" }), page.getByRole("navigation", { name: "Main" }), page.locator("#tutorial-term")]) {
      const box = (await item.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(bar.y);
      expect(box.y + box.height).toBeLessThanOrEqual(bar.y + bar.height);
      expect(box.x + box.width).toBeLessThanOrEqual(375);
    }
  });

  test("the calendar starts within 420 px, with Save beside the switcher and Share and Export in the menu", async ({ page }) => {
    await openPlanner(page, { courses: ["MA 1022", "PH 1110", "AE 2320", "CS 2102", "MA 1023"], degree: true });
    expect((await calendar(page).boundingBox())!.y).toBeLessThanOrEqual(440);
    const switcher = (await page.getByRole("group", { name: "Schedules" }).boundingBox())!;
    const save = (await page.getByRole("button", { name: "Save", exact: true }).boundingBox())!;
    expect(Math.abs(switcher.y - save.y)).toBeLessThanOrEqual(2);
    await expect(page.getByRole("button", { name: "Share", exact: true })).toBeHidden();
    const more = page.getByRole("button", { name: "More actions" });
    await more.click();
    await expect(page.getByRole("button", { name: "Share", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Export", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(more).toBeFocused();
    const chips = page.getByRole("list", { name: "This schedule" }).getByRole("listitem");
    const tops = await chips.evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(1);
    expect(await sidewaysScroll(page)).toBe(false);
  });

  for (const width of [375, 320]) {
    test(`at ${width} the switcher's numbers stay whole in every save state`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
      await openPlanner(page, { courses: ["MA 1023", "PH 1110"] });
      const text = page.getByRole("group", { name: "Schedules" }).locator("p > span");
      const whole = () => text.evaluate((element) => element.scrollWidth <= element.clientWidth);
      await expect(page.getByText(/^Schedule 1 of 200$/)).toBeAttached();
      expect(await whole()).toBe(true);
      for (let step = 0; step < 9; step++) await page.getByRole("button", { name: "Next schedule" }).click();
      await expect(page.getByText(/^Schedule 10 of 200$/)).toBeAttached();
      expect(await whole()).toBe(true);
      for (let step = 0; step < 90; step++) await page.getByRole("button", { name: "Next schedule" }).click();
      await expect(page.getByText(/^Schedule 100 of 200$/)).toBeAttached();
      expect(await whole()).toBe(true);
      const size = (await page.getByRole("button", { name: "Save", exact: true }).boundingBox())!;
      await page.getByRole("button", { name: "Save", exact: true }).click();
      await page.getByRole("dialog", { name: "Save schedule" }).getByRole("button", { name: "Save" }).click();
      await expect(page.getByRole("button", { name: "Schedule saved" })).toBeVisible();
      expect(await whole()).toBe(true);
      const top = (await calendar(page).boundingBox())!.y;
      await page.getByRole("switch", { name: "Only open sections" }).click();
      await expect(page.getByText("Unsaved changes", { exact: true })).toBeVisible();
      await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");
      expect(await whole()).toBe(true);
      expect((await page.getByRole("button", { name: "Save", exact: true }).boundingBox())!.height).toBe(size.height);
      expect((await calendar(page).boundingBox())!.y).toBe(top);
    });
  }

  test("the ⋯ menu closes when focus leaves it, and after its dialog closes", async ({ page }) => {
    await openPlanner(page);
    const more = page.getByRole("button", { name: "More actions" });
    const share = page.getByRole("button", { name: "Share", exact: true });
    const exportButton = page.getByRole("button", { name: "Export", exact: true });
    await more.focus();
    await page.keyboard.press("Enter");
    await exportButton.focus();
    for (let step = 0; step < 4 && (await exportButton.isVisible()); step++) await page.keyboard.press("Tab");
    await expect(exportButton).toBeHidden();
    await more.click();
    await exportButton.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(share).toBeHidden();
    await expect(more).toBeFocused();
  });

  test("a saved plan says Saved on the button and nowhere else", async ({ page }) => {
    await openPlanner(page);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page.getByRole("dialog", { name: "Save schedule" }).getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("button", { name: "Schedule saved" })).toHaveText("Saved");
    await expect(page.getByText("Schedule saved", { exact: true })).toHaveCount(0);
    expect((await calendar(page).boundingBox())!.y).toBeLessThanOrEqual(420);
  });

  test("no text under 12 px on the planner", async ({ page }) => {
    await openPlanner(page, { degree: true });
    expect(await textUnder12(page)).toEqual([]);
  });
});

test("a click on the calendar then Space shows no focus ring, but Tab does, all the way round", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPlanner(page);
  const grid = page.getByRole("group", { name: "Calendar time grid" });
  const ring = () => grid.evaluate((node) => getComputedStyle(node).outlineStyle);
  const box = (await grid.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height - 20);
  await expect(grid).toBeFocused();
  await page.keyboard.press("Space");
  expect(await ring()).toBe("none");
  await grid.evaluate((node) => (node as HTMLElement).blur());
  await page.getByRole("combobox", { name: "Sort" }).focus();
  for (let i = 0; i < 40 && !(await grid.evaluate((node) => node === document.activeElement)); i++) await page.keyboard.press("Tab");
  await expect(grid).toBeFocused();
  expect(await ring()).toBe("solid");
  expect(await grid.evaluate((node) => getComputedStyle(node).outlineOffset)).toBe("-2px");
});

for (const [width, height] of [[1440, 900], [1536, 864]] as const) {
  test(`a shared link's preview fits an 8 to 5 week without scrolling at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    // BUS 1020 meets at 8 AM, so with the rest the week runs 8 AM to 5 PM.
    await page.addInitScript(() => {
      localStorage.setItem("goatplan:term:v1", "2027-C");
      localStorage.setItem("goatplan:tutorial:v1", "dismissed");
      localStorage.setItem("goatplan:draft:v1:2027-C", JSON.stringify({ version: 1, courses: ["BUS 1020", "MA 1022", "PH 1110"], preferences: { startsAfter: 0, blocked: [], onlyOpen: false }, locks: {}, professorByCourse: {}, sortPreset: "bestOverall", alternatives: {} }));
    });
    await page.goto("/");
    await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done", { timeout: 30_000 });
    await page.getByRole("button", { name: "Share", exact: true }).click();
    const link = await page.getByRole("dialog", { name: "Share this schedule" }).getByRole("textbox").inputValue();
    await page.goto(link);
    await expect(page.getByRole("region", { name: "Shared plan", exact: true })).toBeVisible({ timeout: 30_000 });
    const grid = page.getByRole("group", { name: "Calendar time grid" });
    await expect(page.getByText("Shared plan · 8:00 AM–5:00 PM")).toBeVisible();
    await expect.poll(() => grid.evaluate((node) => node.scrollHeight - node.clientHeight)).toBeLessThanOrEqual(1);
    expect(await pageScrolls(page)).toBe(false);
  });
}
