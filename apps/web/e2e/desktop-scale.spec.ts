import { expect, frozenTerm, test } from "./fixtures/test";
import { roomName } from "../src/lib/data/rooms";
import type { Page } from "@playwright/test";

const planned = {
  courses: ["AE 2320", "AE 2410"],
  blocked: [
    { day: "Tue", start: 840, end: 960, label: "Work" },
    { day: "Wed", start: 720, end: 750, label: "Lunch" },
  ],
};

type Plan = { courses?: string[]; blocked?: { day: string; start: number; end: number; label?: string }[]; locks?: Record<string, string[]>; onlyOpen?: boolean; startsAfter?: number; term?: string; tutorial?: boolean };

async function openPlanner(page: Page, { courses = planned.courses, blocked = planned.blocked, locks = {}, onlyOpen = true, startsAfter = 540, term = "2027-C", tutorial = false }: Plan = {}) {
  await page.addInitScript(
    ({ courses, blocked, locks, onlyOpen, startsAfter, term, tutorial }) => {
      localStorage.setItem("goatplan:term:v1", term);
      if (!tutorial) localStorage.setItem("goatplan:tutorial:v1", "dismissed");
      localStorage.setItem(
        `goatplan:draft:v1:${term}`,
        JSON.stringify({ version: 1, courses, preferences: { startsAfter, blocked, onlyOpen }, locks, professorByCourse: {}, sortPreset: "fewestEarly", alternatives: {} }),
      );
    },
    { courses, blocked, locks, onlyOpen, startsAfter, term, tutorial },
  );
  await page.goto("/");
  await expect(page.locator("[data-planner-term-status]")).toHaveAttribute("data-planner-term-status", "ready", { timeout: 30_000 });
  if (courses.length > 0) await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done", { timeout: 30_000 });
}

/** Every piece of text a person can see that is smaller than `floor`, form fields included. */
function textUnder(page: Page, floor: number) {
  return page.evaluate((floor) => {
    const shown = (element: Element) => {
      const box = element.getBoundingClientRect();
      return element.checkVisibility({ visibilityProperty: true }) && box.width > 1 && box.height > 1;
    };
    const small: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const element = walker.currentNode.parentElement!;
      const text = walker.currentNode.textContent!.trim();
      if (!text || ["SCRIPT", "STYLE"].includes(element.tagName) || !shown(element)) continue;
      const size = parseFloat(getComputedStyle(element).fontSize);
      if (size < floor) small.push(`${size}px "${text.slice(0, 40)}" in <${element.tagName.toLowerCase()}>`);
    }
    for (const field of document.querySelectorAll("input, select, textarea")) {
      const size = parseFloat(getComputedStyle(field).fontSize);
      if (shown(field) && size < floor) small.push(`${size}px <${field.tagName.toLowerCase()}> ${field.getAttribute("aria-label") ?? field.id}`);
    }
    return [...new Set(small)];
  }, floor);
}

for (const [width, height] of [[1440, 900], [2560, 1440]] as const) {
  test.describe(`text size at ${width}`, () => {
    test.use({ viewport: { width, height } });

    test("no visible text is under 12 px on the planner", async ({ page }) => {
      await openPlanner(page);
      expect(await textUnder(page, 12)).toEqual([]);

      const search = page.getByRole("searchbox", { name: "Search courses" });
      await search.fill("ae 2");
      await page.getByRole("region", { name: "Search results" }).getByRole("button", { name: /Sections/ }).first().click();
      expect(await textUnder(page, 12)).toEqual([]);

      await search.fill("AE 23200");
      await expect(page.getByRole("heading", { name: /No course matches/ })).toBeVisible();
      expect(await textUnder(page, 12)).toEqual([]);
      await search.fill("");

      await page.getByRole("group", { name: "Monday", exact: true }).getByRole("button").first().click();
      expect(await textUnder(page, 12)).toEqual([]);
    });

    test("no visible text is under 12 px in the empty planner, the guide and saved plans", async ({ page }) => {
      await openPlanner(page, { courses: [], tutorial: true });
      await expect(page.locator(".guide-popover")).toBeVisible();
      expect(await textUnder(page, 12)).toEqual([]);

      await page.goto("/plans");
      await expect(page.getByRole("heading", { level: 1, name: "All saved plans" })).toBeVisible();
      expect(await textUnder(page, 12)).toEqual([]);
    });
  });
}

const sidebar = (page: Page) => page.getByRole("complementary", { name: "Term and courses" });
const details = (page: Page) => page.getByRole("complementary", { name: "Course details" });

async function widthOf(page: Page, region: ReturnType<typeof sidebar>) {
  return (await region.boundingBox())!.width;
}

test.describe("fluid scaling", () => {
  for (const { width, root, sidebarWidth, detailsWidth, button } of [
    { width: 1194, root: 16, sidebarWidth: 240, detailsWidth: 268, button: 36 },
    { width: 1440, root: 16, sidebarWidth: 240, detailsWidth: 268, button: 36 },
    { width: 2000, root: 18, sidebarWidth: 270, detailsWidth: 301.5, button: 40.5 },
    { width: 2560, root: 20, sidebarWidth: 300, detailsWidth: 335, button: 45 },
    { width: 3440, root: 20, sidebarWidth: 300, detailsWidth: 335, button: 45 },
  ]) {
    test(`at ${width} px the root font is ${root} px and the panels and controls grow with it`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await openPlanner(page);
      const rootSize = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
      expect(rootSize).toBeCloseTo(root, 1);
      expect(await widthOf(page, sidebar(page))).toBeCloseTo(sidebarWidth, 0);
      expect(await widthOf(page, details(page))).toBeCloseTo(detailsWidth, 0);
      expect((await page.getByRole("button", { name: "Save schedule" }).boundingBox())!.height).toBeCloseTo(button, 0);
    });
  }

  test("the app stops at 2200 px and centers on an ultra-wide screen", async ({ page }) => {
    await page.setViewportSize({ width: 3440, height: 1440 });
    await openPlanner(page);
    const left = (await sidebar(page).boundingBox())!.x;
    const panel = (await details(page).boundingBox())!;
    const padding = 25;
    expect(left).toBeCloseTo((3440 - 2200) / 2 + padding, 0);
    expect(panel.x + panel.width).toBeCloseTo((3440 + 2200) / 2 - padding, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(3440);
  });

  test("the app fills a screen narrower than the cap", async ({ page }) => {
    await page.setViewportSize({ width: 2100, height: 1000 });
    await openPlanner(page);
    const panel = (await details(page).boundingBox())!;
    const root = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
    expect(panel.x + panel.width).toBeCloseTo(2100 - 1.25 * root, 0);
  });
});

/** Text that is cut off: taller or wider than a box that hides overflow, or shortened with an ellipsis. */
function clippedText(page: Page) {
  return page.evaluate(() => {
    const found: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const element = walker.currentNode.parentElement!;
      const text = walker.currentNode.textContent!.trim();
      if (!text || ["SCRIPT", "STYLE", "OPTION"].includes(element.tagName) || !element.checkVisibility({ visibilityProperty: true })) continue;
      const range = document.createRange();
      range.selectNodeContents(walker.currentNode);
      const box = range.getBoundingClientRect();
      if (box.width <= 1 || box.height <= 1 || element.closest(".sr-only")) continue;
      // Text below the fold of a scrolling box can be scrolled to, so it isn't cut off vertically.
      let inScroller = false;
      for (let parent: Element | null = element; parent && parent !== document.body; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (style.position === "fixed" || style.clip !== "auto") break;
        if (style.overflowX === "visible" && style.overflowY === "visible") continue;
        const edge = parent.getBoundingClientRect();
        inScroller ||= style.overflowY === "auto" || style.overflowY === "scroll";
        const cutSide = box.right > edge.right + 1 || box.left < edge.left - 1;
        const cutEnd = !inScroller && (box.bottom > edge.bottom + 1 || box.top < edge.top - 1);
        if (cutSide || cutEnd) {
          found.push(`"${text.slice(0, 40)}" (${Math.round(box.width)}×${Math.round(box.height)}) in ${Math.round(edge.width)}×${Math.round(edge.height)} ${parent.tagName.toLowerCase()}${style.textOverflow === "ellipsis" ? " with …" : ""}`);
          break;
        }
      }
    }
    return [...new Set(found)];
  });
}

test("a class shows its section and full time where the block has room, and a short time where it doesn't", async ({ page }) => {
  const block = page.locator("[data-block]").first();
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPlanner(page);
  await expect(block.getByText("CL01")).toBeVisible();
  await expect(block.getByText("9:00 AM–9:50 AM")).toBeVisible();

  await page.setViewportSize({ width: 834, height: 1194 });
  await expect(block.getByText("9–9:50")).toBeVisible();
  await expect(block.getByText("9:00 AM–9:50 AM")).toBeHidden();
  await expect(block.getByText("CL01")).toBeHidden();
});

test("at 834 the calendar has room for a whole day and the No set time strip, without scrolling inside", async ({ page }) => {
  await page.setViewportSize({ width: 834, height: 1194 });
  await openPlanner(page, { courses: ["AE 2320", "AE 5131"], blocked: [{ day: "Mon", start: 1140, end: 1200 }] });
  await expect(page.getByRole("heading", { name: "No set time" })).toBeVisible();
  const grid = page.getByRole("group", { name: "Calendar time grid" });
  await expect.poll(() => grid.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(0);
});

test("the early band's label stays under a blocked time in that band", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPlanner(page, { courses: [], blocked: [{ day: "Wed", start: 480, end: 540, label: "Gym" }] });
  const name = page.locator('[data-blocked-time="Wed-480-540"]').getByText("Gym");
  await expect(name).toBeVisible();
  // The label has no pointer events to test with, so this reads what decides the painting order.
  const label = page.getByText("No classes before 9:00 AM");
  await expect(label).toHaveCSS("z-index", "auto");
});

test("at the tablet minimum the day names are whole", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await openPlanner(page);
  const names = page.locator('[style*="grid-template-columns"] > span:not(:empty)').first().locator("..");
  await expect(names).toContainText("Wed");
  const cut = await names.evaluate((row) => [...row.children].filter((cell) => cell.scrollWidth > cell.clientWidth + 1).map((cell) => cell.textContent));
  expect(cut).toEqual([]);
});

test.describe("a block shows its code wherever the code fits", () => {
  const clash = ["AE 2320", "AE 2410", "AE 2210", "AB 1533"];
  const codeShows = (page: Page, label: RegExp, code: string) => expect(page.getByRole("button", { name: label }).first().getByText(code, { exact: true })).toBeVisible();

  test("two classes side by side at 834", async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 1194 });
    await openPlanner(page, { courses: clash });
    await codeShows(page, /^Preview, AE 2320 CL01,/, "AE 2320");
    await codeShows(page, /^Preview, AB 1533 C01,/, "AB 1533");
  });

  test("one-line blocks side by side at 1440", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPlanner(page, { courses: ["AE 2320", "AB 1533", "BME 552"], startsAfter: 0 });
    await expect(page.getByRole("button", { name: /^Preview, AE 2320 CL01,/ }).first().locator("b")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Preview, AB 1533 C01,/ }).first().locator("b")).toBeVisible();
  });

  for (const [width, height] of [[1100, 800], [768, 1024]] as const) {
    test(`a block in drawing mode at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openPlanner(page, { courses: ["AE 2320"], blocked: [] });
      await page.getByRole("button", { name: "Block a time" }).click();
      await codeShows(page, /^AE 2320 CL01,/, "AE 2320");
    });
  }

  test("the widest code stays whole on one line at 834", async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 1194 });
    await openPlanner(page, { term: "2027-D", courses: ["ECON 2800"], blocked: [] });
    const code = page.locator("[data-block]").first().getByText("ECON 2800", { exact: true });
    await expect(code).toBeVisible();
    expect(await code.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect((await code.boundingBox())!.height).toBeLessThan(20);
  });

  test("a locked one-line block keeps its code where the code and lock fit", async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 1194 });
    await openPlanner(page, { courses: ["AE 2320", "BME 552"], blocked: [], locks: { "AE 2320": ["AE 2320-CX02"] }, startsAfter: 0 });
    const block = page.getByRole("button", { name: /^AE 2320 CX02,/ });
    await expect(block.locator("svg:visible")).toHaveCount(1);
    await expect(block.locator("b")).toBeVisible();
  });

  test("an eight-character code on a one-line block at 834", async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 1194 });
    await openPlanner(page, { courses: ["IMGD 2000", "ECE 2010", "RBE 2001", "MA 1023"], blocked: [], startsAfter: 0 });
    await expect(page.getByRole("button", { name: /^ECE 2010 CL01,/ }).first().locator("b")).toBeVisible();
    await expect(page.getByRole("button", { name: /^RBE 2001 CL01,/ }).first().locator("b")).toBeVisible();
  });

  for (const [width, height] of [[834, 1194], [1194, 834], [1440, 900]] as const) {
    test(`a lock in the corner of a narrow block stays clear of the code at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openPlanner(page, { courses: ["AE 2320", "IMGD 2200"], blocked: [], locks: { "IMGD 2200": ["IMGD 2200-C01"] }, onlyOpen: false, startsAfter: 0 });
      const block = page.getByRole("button", { name: /^Preview, IMGD 2200 C01,/ }).first();
      const overlap = await block.evaluate((element) => {
        const lock = [...element.querySelectorAll("svg")].find((svg) => svg.checkVisibility())!.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents([...element.querySelectorAll("span")].find((span) => span.textContent === "IMGD 2200")!);
        return [...range.getClientRects()].some((text) => text.left < lock.right && lock.left < text.right && text.top < lock.bottom && lock.top < text.bottom);
      });
      expect(overlap).toBe(false);
    });
  }

  test("a locked long code stays clear of its lock at 834", async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 1194 });
    await openPlanner(page, { courses: ["IMGD 1000"], blocked: [], locks: { "IMGD 1000": ["IMGD 1000-C01"] } });
    const block = page.getByRole("button", { name: /^IMGD 1000 C01,/ }).first();
    const code = (await block.getByText("IMGD 1000", { exact: true }).boundingBox())!;
    const lock = (await block.locator("svg:visible").boundingBox())!;
    expect(lock.y).toBeGreaterThanOrEqual(code.y + code.height - 1);
  });

  test("every short code fits the width that shows it, and every code fits the widest", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const codes = [...new Set(["2026-B", "2027-C", "2027-D"].flatMap((term) => frozenTerm(term).courses.map((course) => course.code)))];
    const tooWide = await page.evaluate(async (codes) => {
      await document.fonts.ready;
      const probe = document.createElement("b");
      probe.style.cssText = "position:absolute;white-space:nowrap;font-weight:700";
      document.body.append(probe);
      const width = (code: string, size: string) => {
        probe.textContent = code;
        probe.style.fontSize = size;
        return probe.getBoundingClientRect().width;
      };
      const lock = 11;
      return codes.filter((code) => {
        const line = width(code, "0.75rem");
        const short = code.length <= 7;
        return line > (short ? 56 : 74) || line + lock > (short ? 68 : 80) || width(code, "0.8125rem") > 74;
      });
    }, codes);
    expect(tooWide).toEqual([]);
  });
});

test("every room label short enough to show on a class block fits the block's room for it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const labels = [
    ...new Set(
      ["2026-B", "2027-C", "2027-D"].flatMap((term) =>
        frozenTerm(term).courses.flatMap((course) => course.sections.flatMap((section) => section.meetings.flatMap((meeting) => (meeting.location ? [roomName(meeting.location)] : [])))),
      ),
    ),
  ].filter((label) => label.length <= 20);
  expect(labels.length).toBeGreaterThan(50);
  const tooWide = await page.evaluate(async (labels) => {
    await document.fonts.ready;
    const probe = document.createElement("span");
    probe.style.cssText = "position:absolute;white-space:nowrap;font-size:0.75rem";
    document.body.append(probe);
    return labels.filter((label) => {
      probe.textContent = label;
      return probe.getBoundingClientRect().width > 124;
    });
  }, labels);
  expect(tooWide).toEqual([]);
});

test.describe("everything fits", () => {
  for (const [width, height] of [[834, 1194], [1194, 834], [1440, 900]] as const) {
    test.describe(`at ${width}`, () => {
      test.use({ viewport: { width, height } });

      async function expectFits(page: Page) {
        // Polled, because blocks animate to their height after the grid is measured.
        await expect.poll(() => clippedText(page)).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      }

      test("the planner", async ({ page }) => {
        await openPlanner(page);
        await expectFits(page);

        const search = page.getByRole("searchbox", { name: "Search courses" });
        await search.fill("ae 2");
        await page.getByRole("region", { name: "Search results" }).getByRole("button", { name: /Sections/ }).first().click();
        await expectFits(page);
        await search.fill("");

        await page.getByRole("group", { name: "Monday", exact: true }).getByRole("button").first().click();
        await expectFits(page);
      });

      test("two classes at the same time, side by side", async ({ page }) => {
        await openPlanner(page, { courses: ["AE 2320", "AE 2410", "CS 1101"] });
        await expect(page.locator("[data-block]").filter({ hasText: "CS" }).first()).toBeVisible();
        await expectFits(page);
      });

      for (const [name, plan] of [
        ["two wide codes at the same time", { courses: ["AE 2320", "AB 1533"] }],
        ["a locked long code", { courses: ["IMGD 1000"], locks: { "IMGD 1000": ["IMGD 1000-C01"] } }],
        ["three-letter subjects", { courses: ["ECE 2010", "RBE 2001"] }],
        ["rooms with long names", { courses: ["MA 1023", "PH 1110"] }],
        ["two classes at once in a long day, on one line", { courses: ["AE 2320", "AB 1533", "BME 552"] }],
        ["three classes at once", { courses: ["AE 2320", "IMGD 2200", "BME 2210"], onlyOpen: false }],
        ["four classes at once", { courses: ["AE 2320", "IMGD 2200", "BME 2210", "MA 1120"], onlyOpen: false }],
        ["a room with a long name and no number", { courses: ["CS 2303"], locks: { "CS 2303": ["CS 2303-CL01"] }, onlyOpen: false }],
        ["another long room", { courses: ["BB 2920"], locks: { "BB 2920": ["BB 2920-CL01"] }, onlyOpen: false }],
        ["a room in two places", { courses: ["TH 3400"], locks: { "TH 3400": ["TH 3400-C01"] }, onlyOpen: false }],
        ["two long rooms", { courses: ["IMGD 5600"], locks: { "IMGD 5600": ["IMGD 5600-S01"] }, onlyOpen: false }],
        ["a long section code", { courses: ["PH 1110"], locks: { "PH 1110": ["PH 1110-CS02-Multipurpose"] }, onlyOpen: false }],
        ["a locked section with an evening time", { courses: ["WPE 1099"], locks: { "WPE 1099": ["WPE 1099-C01"] }, onlyOpen: false }],
        ["blocked times with minutes", { courses: [], blocked: [{ day: "Mon", start: 630, end: 750, label: "Work" }, { day: "Wed", start: 630, end: 750 }, { day: "Thu", start: 765, end: 840 }, { day: "Fri", start: 690, end: 750 }] }],
      ] as [string, Plan][]) {
        test(name, async ({ page }) => {
          await openPlanner(page, plan);
          await expectFits(page);
        });
      }

      test("drawing mode", async ({ page }) => {
        await openPlanner(page);
        await page.getByRole("button", { name: "Block a time" }).click();
        await expect(page.getByRole("group", { name: "Drawing mode" })).toBeVisible();
        await expectFits(page);
      });

      test("a clash in drawing mode", async ({ page }) => {
        await openPlanner(page, { courses: ["AE 2320", "AE 2410", "AE 2210", "AB 1533"] });
        await page.getByRole("button", { name: "Block a time" }).click();
        await expect(page.getByRole("group", { name: "Drawing mode" })).toBeVisible();
        await expectFits(page);
      });

      test("a lab preview keeps its time", async ({ page }) => {
        await page.setViewportSize({ width: page.viewportSize()!.width, height: 1100 });
        await openPlanner(page, { courses: ["AE 2320"], locks: { "AE 2320": ["AE 2320-CX02"] } });
        await page.getByRole("button", { name: "View other lab choices" }).click();
        await page.getByRole("button", { name: "Choose Lab CX03" }).hover();
        const ghost = page.getByRole("button", { name: /^Preview, AE 2320 CX03,/ });
        await expect(ghost.getByText("4–4:50")).toBeVisible();
        await expectFits(page);
      });

      test("a locked class beside another still shows its lock", async ({ page }) => {
        await openPlanner(page, { courses: ["AE 2320", "IMGD 2200"], locks: { "AE 2320": ["AE 2320-CL01"] }, onlyOpen: false });
        const block = page.getByRole("button", { name: /^Preview, AE 2320 CL01, .*Monday/ });
        await expect(block.locator("svg:visible")).toHaveCount(1);
      });

      test("the empty planner and saved plans", async ({ page }) => {
        await openPlanner(page, { courses: [] });
        await expectFits(page);
        await page.goto("/plans");
        await expect(page.getByRole("heading", { level: 1, name: "All saved plans" })).toBeVisible();
        await expectFits(page);
      });

      test("class blocks stay inside the calendar, with their text inside them", async ({ page }) => {
        await openPlanner(page);
        const calendar = (await page.getByRole("group", { name: "Calendar time grid" }).boundingBox())!;
        const blocks = page.locator("[data-block]");
        expect(await blocks.count()).toBeGreaterThan(0);
        for (const block of await blocks.all()) {
          const box = (await block.boundingBox())!;
          expect(box.x).toBeGreaterThanOrEqual(calendar.x);
          expect(box.x + box.width).toBeLessThanOrEqual(calendar.x + calendar.width);
          const overflow = await block.evaluate((element) => element.scrollHeight - element.clientHeight);
          expect(overflow).toBeLessThanOrEqual(0);
        }
      });
    });
  }
});
