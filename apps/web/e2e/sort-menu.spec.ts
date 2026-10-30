import { expect, test } from "./fixtures/test";
import type { Locator, Page } from "@playwright/test";
import type { TermFile } from "../src/lib/data/types";
import type { Draft, SortPresetId } from "../src/lib/store/types";
import { coursePanelTerm } from "./fixtures/coursePanel";
import { pickSort, SORT_LABELS as LABELS, SORT_MENU_COURSES, sortControl, sortList, sortMenuTerm, sortMenuTops, sortOption } from "./fixtures/sortMenu";

const screenshotDir = "e2e/screenshots";
const DRAFT_KEY = "goatplan:draft:v1:2027-C";

const designDraft: Draft = {
  courses: ["AE 2320", "AE 2410", "AE 2210"],
  preferences: {
    startsAfter: 540,
    blocked: [
      { day: "Tue", start: 840, end: 960, label: "Work" },
      { day: "Fri", start: 840, end: 960, label: "Work" },
    ],
    onlyOpen: true,
  },
  locks: {},
  professorByCourse: {},
  sortPreset: "fewestEarly",
  alternatives: {},
};

const sortDraft = (sortPreset: SortPresetId): Draft => ({
  courses: SORT_MENU_COURSES,
  preferences: { startsAfter: 0, blocked: [], onlyOpen: true },
  locks: {},
  professorByCourse: {},
  sortPreset,
  alternatives: {},
});

/** Opens the planner on C Term with this term data and draft. Reloads keep what the page saved since. */
async function openPlanner(page: Page, data: TermFile, draft: Draft) {
  await page.route("**/data/2027-C.json", (route) => route.fulfill({ json: data }));
  await page.addInitScript(
    ({ key, draft }) => {
      if (sessionStorage.getItem("sort-menu-seeded")) return;
      sessionStorage.setItem("sort-menu-seeded", "1");
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
const preferencesRow = (page: Page) => page.getByRole("group", { name: "Preferences", exact: true });
const firstBadge = (page: Page) => page.getByRole("list", { name: "This schedule" }).getByRole("listitem").first();
const storedDraft = (page: Page): Promise<Draft> => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), DRAFT_KEY);
const header = (page: Page) => page.locator("header");

/** The lecture each DEMO course takes in the shown schedule, read from "Your courses". */
async function shownSections(page: Page): Promise<string[]> {
  const rows = page.getByRole("region", { name: "Your courses" }).locator("[data-course-row]");
  return (await rows.allInnerTexts()).map((text) => text.match(/\bL0\d\b/)?.[0] ?? "");
}

/** The order is on, its top schedule is shown as schedule 1, and its badge leads. */
async function expectTopOf(page: Page, preset: SortPresetId) {
  await expect(sortControl(page)).toHaveText(`Sort${LABELS[preset]}`);
  await expect(page.getByText("Schedule 1 of 48", { exact: true })).toBeVisible();
  await expect.poll(() => shownSections(page)).toEqual(sortMenuTops[preset].sections);
  await expect(firstBadge(page)).toHaveText(sortMenuTops[preset].firstBadge);
}

async function noSidewaysScroll(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
}

async function box(locator: Locator) {
  const found = await locator.boundingBox();
  expect(found).not.toBeNull();
  return found!;
}

test("picking each order re-ranks the schedules in the engine and goes back to schedule 1", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPlanner(page, sortMenuTerm(), sortDraft("bestOverall"));
  await expectTopOf(page, "bestOverall");

  await sortControl(page).click();
  const options = sortList(page).getByRole("option");
  await expect(options).toHaveCount(Object.values(LABELS).length);
  for (const [index, label] of Object.values(LABELS).entries()) {
    await expect(options.nth(index)).toHaveAccessibleName(label);
    await expect(sortOption(page, label)).toHaveCount(1);
  }
  await expect(sortList(page).getByRole("option", { selected: true })).toHaveAccessibleName("Best overall");
  await page.keyboard.press("Escape");

  // Ends on Best overall again, so every order is picked once while another one is on. The order of
  // picks makes each one move the top: Fewest early classes keeps Best overall's top (see sortMenuTerm).
  expect(sortMenuTops.fewestEarly.sections).toEqual(sortMenuTops.bestOverall.sections);
  let previous: SortPresetId = "bestOverall";
  for (const preset of ["latestStart", "fewestEarly", "earliestFinish", "fewestDays", "fewestGaps", "bestOverall"] as const) {
    await page.getByRole("button", { name: "Next schedule" }).click();
    await expect(page.getByText("Schedule 2 of 48", { exact: true })).toBeVisible();

    await pickSort(page, LABELS[preset]);
    await expect(sortControl(page)).toBeFocused();

    await expectTopOf(page, preset);
    expect(sortMenuTops[preset].sections).not.toEqual(sortMenuTops[previous].sections);
    expect((await storedDraft(page)).sortPreset).toBe(preset);
    previous = preset;
  }
});

test("keyboard only: Tab to Sort, open with Enter, type L for Latest start, pick with Enter", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPlanner(page, sortMenuTerm(), sortDraft("bestOverall"));

  const sort = sortControl(page);
  for (let index = 0; index < 60 && !(await sort.evaluate((element) => element === document.activeElement)); index++) {
    await page.keyboard.press("Tab");
  }
  await expect(sort).toBeFocused();
  await expect(sort).toHaveAttribute("aria-expanded", "false");

  await page.keyboard.press("Enter");
  const list = sortList(page);
  await expect(list).toBeVisible();
  await expect(sort).toHaveAttribute("aria-expanded", "true");
  const active = () => sort.getAttribute("aria-activedescendant").then((id) => page.locator(`[id="${id}"] span`).first().innerText());
  await expect.poll(active).toBe("Best overall");

  await page.keyboard.press("L");
  await expect.poll(active).toBe("Latest start");
  await page.keyboard.press("Enter");

  await expect(list).toBeHidden();
  await expect(sort).toBeFocused();
  await expect(sort).toHaveAttribute("aria-expanded", "false");
  await settled(page);
  await expectTopOf(page, "latestStart");
  await expect(sort).toBeFocused();

  // Escape closes without changing anything.
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("End");
  await expect.poll(active).toBe("Most compact");
  await page.keyboard.press("Escape");
  await expect(list).toBeHidden();
  await expect(sort).toHaveText("SortLatest start");
  await expect(sort).toBeFocused();

  // Sort is the last stop in the Preferences row: Tab moves out of the row without opening it.
  await page.keyboard.press("Tab");
  await expect(list).toBeHidden();
  expect(await preferencesRow(page).evaluate((row) => row.contains(document.activeElement))).toBe(false);
});

test("the order survives a reload and a save-and-open, and a saved plan shows its label", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPlanner(page, sortMenuTerm(), sortDraft("bestOverall"));

  await pickSort(page, "Most days off");
  await settled(page);
  await expectTopOf(page, "fewestDays");

  await page.reload();
  await settled(page);
  await expectTopOf(page, "fewestDays");
  expect((await storedDraft(page)).sortPreset).toBe("fewestDays");

  await header(page).getByRole("button", { name: "Save schedule" }).click();
  await page.getByRole("dialog", { name: "Save schedule" }).getByRole("textbox", { name: "Plan name" }).fill("Days off");
  await page.keyboard.press("Enter");
  await expect(header(page).getByRole("button", { name: "Schedule saved", exact: true })).toBeVisible();
  const saved = await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((key) => key.startsWith("goatplan:plans:v1:plan:"))
      .map((key) => JSON.parse(localStorage.getItem(key)!) as { id: string; sortPreset: string }),
  );
  expect(saved).toHaveLength(1);
  expect(saved[0].sortPreset).toBe("fewestDays");

  // A new plan starts on Best overall; opening the saved plan brings its order back.
  await header(page).getByRole("button", { name: "Saved plans" }).click();
  await page.getByRole("list", { name: "Plan actions" }).getByRole("button", { name: "Start a new plan" }).click();
  await expect(page.getByRole("region", { name: "Your courses" }).locator("[data-course-row]")).toHaveCount(0);
  await expect.poll(async () => (await storedDraft(page)).sortPreset).toBe("bestOverall");

  await header(page).getByRole("button", { name: "Saved plans" }).click();
  await page.getByRole("list", { name: /^Saved plans for/ }).getByRole("button", { name: /Days off/ }).click();
  await settled(page);
  await expectTopOf(page, "fewestDays");
  expect((await storedDraft(page)).sortPreset).toBe("fewestDays");

  // The read-only view of the saved plan names its order with the current label.
  await page.goto(`/?view=saved&plan=${saved[0].id}`);
  await settled(page);
  const readOnly = preferencesRow(page);
  await expect(readOnly).toContainText("SortMost days off");
  await expect(readOnly.getByRole("combobox")).toHaveCount(0);
});

for (const [width, height] of [
  [1440, 900],
  [834, 1194],
] as const) {
  test(`the Sort control and its list at ${width} px, with screenshots`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openPlanner(page, coursePanelTerm("07"), designDraft);
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);

    const row = preferencesRow(page);
    const sort = sortControl(page);
    await expect(sort).toHaveText("SortFewest early classes");
    const rowBox = await box(row);
    const sortBox = await box(sort);
    const items = await row.evaluate((element) =>
      [...element.children].filter((child) => child.getBoundingClientRect().width > 0).map((child) => {
        const rect = child.getBoundingClientRect();
        return { middle: rect.top + rect.height / 2, right: rect.right, isSort: child.getAttribute("role") === "combobox" };
      }),
    );

    // Sort is the last item, at the right end of the row, and never squeezed below 146.
    expect(items.at(-1)?.isSort).toBe(true);
    expect(sortBox.width).toBeGreaterThanOrEqual(146);
    const rowPaddingRight = await row.evaluate((element) => parseFloat(getComputedStyle(element).paddingRight));
    expect(Math.abs(rowBox.x + rowBox.width - rowPaddingRight - (sortBox.x + sortBox.width))).toBeLessThanOrEqual(1);
    if (width === 1440) {
      // One line, as in div.app-6.
      for (const item of items) expect(Math.abs(item.middle - items[0].middle)).toBeLessThanOrEqual(1);
    } else {
      // The row wraps, and Sort stays on its last line.
      expect(new Set(items.map((item) => Math.round(item.middle))).size).toBeGreaterThan(1);
      const sortMiddle = sortBox.y + sortBox.height / 2;
      for (const item of items) expect(sortMiddle).toBeGreaterThanOrEqual(item.middle - 1);
    }

    // The closed control looks like the professor field: surface fill, line border, row radius, 7 / 9 padding, gap 6,
    // "Sort" in muted ink and the order in ink at 10 px, an 11 px caret.
    const look = await sort.evaluate((element) => {
      const probe = (property: string, value: string) => {
        const div = document.createElement("div");
        div.style.setProperty(property, value);
        document.body.append(div);
        const computed = getComputedStyle(div).getPropertyValue(property);
        div.remove();
        return computed;
      };
      const style = getComputedStyle(element);
      const [label, value] = [...element.querySelectorAll("span")].map((span) => getComputedStyle(span));
      const caret = element.querySelector("svg")!.getBoundingClientRect();
      return {
        background: style.backgroundColor === probe("background-color", "var(--color-surface)"),
        border: style.borderTopColor === probe("color", "var(--color-line)") && style.borderTopWidth === "1px",
        radius: style.borderTopLeftRadius === probe("border-top-left-radius", "var(--radius-row)"),
        padding: style.padding,
        gap: style.columnGap,
        minWidth: style.minWidth,
        labelColor: label.color === probe("color", "var(--color-ink-muted)"),
        valueColor: value.color === probe("color", "var(--color-ink)"),
        fontSizes: [label.fontSize, value.fontSize],
        fontFamily: style.fontFamily.includes(getComputedStyle(document.documentElement).getPropertyValue("--font-dm-sans").split(",")[0].trim()),
        cursor: style.cursor,
        caret: [caret.width, caret.height],
      };
    });
    expect(look).toEqual({
      background: true,
      border: true,
      radius: true,
      padding: "7px 9px",
      gap: "6px",
      minWidth: "146px",
      labelColor: true,
      valueColor: true,
      fontSizes: ["10px", "10px"],
      fontFamily: true,
      cursor: "pointer",
      caret: [11, 11],
    });
    // The tap area reaches 44 px without changing the layout.
    const hitArea = await sort.evaluate((element) => element.querySelector("span[aria-hidden]:last-child")!.getBoundingClientRect().height);
    expect(hitArea).toBeGreaterThanOrEqual(44);

    await noSidewaysScroll(page);
    await expect(sort).toHaveScreenshot(`sort-closed-${width}.png`);
    await sort.screenshot({ path: `${screenshotDir}/sort-closed-control-${width}.png` });
    await page.screenshot({ path: `${screenshotDir}/sort-closed-${width}.png`, animations: "disabled" });

    await sort.click();
    const list = sortList(page);
    await expect(list).toBeVisible();
    const listBox = await box(list);
    // Below the control, lined up with its right edge and at least 8 px inside the window.
    expect(Math.abs(listBox.y - (sortBox.y + sortBox.height))).toBeLessThanOrEqual(1);
    expect(Math.abs(listBox.x + listBox.width - (sortBox.x + sortBox.width))).toBeLessThanOrEqual(1);
    expect(listBox.width).toBeGreaterThanOrEqual(sortBox.width);
    expect(listBox.x).toBeGreaterThanOrEqual(8);
    expect(listBox.x + listBox.width).toBeLessThanOrEqual(width - 8);
    expect(listBox.y + listBox.height).toBeLessThanOrEqual(height - 8);
    for (const option of await list.getByRole("option").all()) {
      const optionBox = await box(option);
      expect(optionBox.height).toBeGreaterThanOrEqual(49);
      // No label is cut off.
      expect(await option.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    await noSidewaysScroll(page);
    await page.mouse.move(0, 0);
    await page.screenshot({ path: `${screenshotDir}/sort-open-${width}.png`, animations: "disabled" });
    await list.screenshot({ path: `${screenshotDir}/sort-open-list-${width}.png` });

    await page.keyboard.press("Escape");
    await expect(list).toBeHidden();
  });
}
