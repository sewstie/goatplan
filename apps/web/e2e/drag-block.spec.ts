import { expect, test } from "./fixtures/test";
import type { Page } from "@playwright/test";

type Blocked = { day: string; start: number; end: number; label?: string };

async function openPlan(page: Page, blocked: Blocked[] = []) {
  await page.addInitScript((seeded) => {
    localStorage.setItem("goatplan:term:v1", "2027-C");
    localStorage.setItem("goatplan:tutorial:v1", "dismissed");
    localStorage.setItem(
      "goatplan:draft:v1:2027-C",
      JSON.stringify({
        version: 1,
        courses: ["CS 1101"],
        preferences: { startsAfter: 0, blocked: seeded, onlyOpen: true },
        locks: {},
        professorByCourse: {},
        sortPreset: "bestOverall",
        alternatives: {},
      }),
    );
  }, blocked);
  await page.goto("/");
  await settled(page);
  await expect(page.getByText("Auto-fit · 8:00 AM–5:00 PM")).toBeVisible();
}

const settled = (page: Page) =>
  expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done", { timeout: 30_000 });

/** The middle of a day's column at a time, with the drawing-mode grid showing 8 AM to 10 PM. */
async function pointAt(page: Page, day: string, minute: number) {
  const box = (await page.getByRole("group", { name: day, exact: true }).boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + ((minute - 480) / 840) * box.height };
}

const gridTop = async (page: Page) => (await page.getByRole("group", { name: "Calendar time grid" }).boundingBox())!.y;

/** Turns drawing mode on with the Block a time toggle, and waits for the grid to make room for the bar. */
async function startDrawing(page: Page) {
  await page.getByRole("button", { name: "Block a time" }).click();
  await expect(page.getByRole("button", { name: "Drawing busy times" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("group", { name: "Drawing mode" })).toBeVisible();
  const monday = page.getByRole("group", { name: "Monday", exact: true });
  let last = -1;
  await expect.poll(async () => {
    const height = (await monday.boundingBox())!.height;
    const still = height === last;
    last = height;
    return still;
  }).toBe(true);
}

async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }, during?: () => Promise<void>) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await during?.();
  await page.mouse.up();
}

test("out of drawing mode a drag on the calendar does nothing", async ({ page }) => {
  await openPlan(page);
  await expect(page.getByRole("button", { name: "Block a time" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("group", { name: "Drawing mode" })).toHaveCount(0);

  await drag(page, await pointAt(page, "Monday", 725), await pointAt(page, "Wednesday", 775), async () => {
    await expect(page.locator("[data-drag-selection]")).toHaveCount(0);
  });
  await expect(page.getByRole("status").filter({ hasText: /^Blocked / })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Remove blocked time/ })).toHaveCount(0);
});

test("dragging across Mon–Wed blocks 12–1 PM on each day and solves once, on release", async ({ page }) => {
  await openPlan(page);
  await expect(page.getByText("Schedule 1 of 4", { exact: true })).toBeVisible();
  await startDrawing(page);

  const empty = await pointAt(page, "Tuesday", 750);
  await page.mouse.click(empty.x, empty.y);
  await expect(page.getByRole("status").filter({ hasText: /^Blocked / })).toHaveCount(0);

  await drag(page, await pointAt(page, "Monday", 725), await pointAt(page, "Wednesday", 775), async () => {
    await expect(page.getByText("Mon–Wed 12:00–1:00 PM", { exact: true })).toBeVisible();
    await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");
  });

  await expect(page.getByRole("status").filter({ hasText: "Blocked Mon–Wed 12–1 PM" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Name it" })).toBeVisible();
  await settled(page);
  await expect(page.getByText("Schedule 1 of 3", { exact: true })).toBeVisible();
  for (const day of ["Monday", "Tuesday", "Wednesday"]) {
    await expect(page.getByLabel(`${day} 12:00 to 1:00 PM, blocked`, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "1 blocked time" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Drawing busy times" })).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({ path: "e2e/screenshots/drag-block-1440.png" });
});

test("Undo puts the blocked times back the way they were", async ({ page }) => {
  await openPlan(page);
  await startDrawing(page);
  await drag(page, await pointAt(page, "Monday", 725), await pointAt(page, "Wednesday", 775));
  await settled(page);
  await expect(page.getByText("Schedule 1 of 3", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("button", { name: "Drawing busy times" })).toBeFocused();
  await settled(page);
  await expect(page.getByText("Schedule 1 of 4", { exact: true })).toBeVisible();
  await expect(page.getByLabel(/, blocked$/)).toHaveCount(0);
});

test("Name it opens the Block time form filled in, saves the name and leaves drawing mode", async ({ page }) => {
  await openPlan(page);
  await startDrawing(page);
  await drag(page, await pointAt(page, "Monday", 725), await pointAt(page, "Wednesday", 775));
  await page.getByRole("button", { name: "Name it" }).click();

  const dialog = page.getByRole("dialog", { name: "Block a time" });
  await expect(dialog.getByRole("checkbox", { name: "Monday" })).toBeChecked();
  await expect(dialog.getByRole("checkbox", { name: "Wednesday" })).toBeChecked();
  await expect(dialog.getByRole("checkbox", { name: "Thursday" })).not.toBeChecked();
  await expect(dialog.getByRole("combobox", { name: "From" })).toHaveValue("720");
  await expect(dialog.getByRole("combobox", { name: "To" })).toHaveValue("780");
  await dialog.getByRole("textbox", { name: "Name (optional)" }).fill("Lunch");
  await page.getByRole("button", { name: "Block time" }).click();

  await expect(page.getByRole("button", { name: "Remove blocked time Lunch, Mon–Wed 12 PM–1 PM" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Remove blocked time/ })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Block a time" })).toBeFocused();
  await expect(page.getByRole("group", { name: "Drawing mode" })).toHaveCount(0);
});

test("the toast only names the days that changed", async ({ page }) => {
  await openPlan(page, [{ day: "Thu", start: 720, end: 840, label: "Work" }]);
  await startDrawing(page);
  await drag(page, await pointAt(page, "Wednesday", 725), await pointAt(page, "Friday", 775));
  await expect(page.getByRole("status").filter({ hasText: "Blocked Wed, Fri 12–1 PM" })).toBeVisible();
});

test("a drag that starts on a blocked time removes that part, splitting the block", async ({ page }) => {
  await openPlan(page, [{ day: "Mon", start: 720, end: 840, label: "Work" }]);
  await startDrawing(page);

  await drag(page, await pointAt(page, "Monday", 755), await pointAt(page, "Monday", 800), async () => {
    await expect(page.getByText("Remove Mon 12:30–1:30 PM", { exact: true })).toBeVisible();
  });

  await expect(page.getByRole("status").filter({ hasText: "Unblocked Mon 12:30–1:30 PM" })).toBeVisible();
  await expect(page.getByLabel("Work, Monday 12:00 to 12:30 PM, blocked", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Work, Monday 1:30 to 2:00 PM, blocked", { exact: true })).toBeVisible();
});

test("Escape cancels a drag, and then leaves drawing mode", async ({ page }) => {
  await openPlan(page);
  await startDrawing(page);
  const from = await pointAt(page, "Monday", 725);
  const to = await pointAt(page, "Tuesday", 775);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await expect(page.getByText("Mon, Tue 12:00–1:00 PM", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("Mon, Tue 12:00–1:00 PM", { exact: true })).toHaveCount(0);
  await page.mouse.up();
  await expect(page.getByLabel(/, blocked$/)).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Drawing mode" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("group", { name: "Drawing mode" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Block a time" })).toHaveAttribute("aria-pressed", "false");
});

test("Done leaves drawing mode, and Type a time instead opens the form", async ({ page }) => {
  await openPlan(page);
  await startDrawing(page);
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("button", { name: "Block a time" })).toBeFocused();
  await expect(page.getByRole("group", { name: "Drawing mode" })).toHaveCount(0);

  await startDrawing(page);
  await page.getByRole("button", { name: "Type a time instead" }).click();
  await expect(page.getByRole("dialog", { name: "Block a time" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Drawing mode" })).toHaveCount(0);
});

test("a class block opens its details out of drawing mode, and not while drawing", async ({ page }) => {
  await openPlan(page);
  const block = page.getByRole("button", { name: /^CS 1101 CL01/ }).first();
  await block.click();
  await expect(page.getByRole("status").filter({ hasText: /^Blocked / })).toHaveCount(0);
  await expect(block).toHaveAttribute("aria-pressed", "true");
  await block.click();
  await expect(block).toHaveAttribute("aria-pressed", "false");

  await startDrawing(page);
  await block.click();
  await expect(block).toHaveAttribute("aria-pressed", "false");
});

test("a 30-minute blocked time shows one line, with the whole text in its label and tooltip", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPlan(page, [{ day: "Mon", start: 720, end: 750, label: "Work" }]);
  const block = page.getByRole("button", { name: "Work, Monday 12:00 to 12:30 PM, blocked", exact: true });
  await expect(block).toHaveText("Work · 12–12:30");
  await block.hover();
  await expect(page.locator("[role=tooltip]")).toHaveText("WorkMonday 12:00–12:30 PMblocked");
  await page.screenshot({ path: "e2e/screenshots/blocked-short-1440.png" });
});

test("a blocked time's popover removes it, and Undo brings it back", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPlan(page, [{ day: "Mon", start: 720, end: 750, label: "Work" }]);
  const block = page.getByRole("button", { name: "Work, Monday 12:00 to 12:30 PM, blocked", exact: true });
  await block.focus();
  await page.keyboard.press("Enter");

  const popover = page.getByRole("dialog", { name: "Work" });
  await expect(popover).toContainText("Monday 12:00–12:30 PM");
  await expect(popover.getByRole("button", { name: "Rename" })).toBeFocused();
  await expect(block).toHaveAttribute("aria-expanded", "true");
  await page.screenshot({ path: "e2e/screenshots/blocked-popover-1440.png" });

  await popover.getByRole("button", { name: "Remove" }).click();
  await expect(popover).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "Unblocked Mon 12–12:30 PM" })).toBeVisible();
  await expect(block).toHaveCount(0);
  await settled(page);

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(block).toBeVisible();
  await expect(page.getByRole("button", { name: "Block a time" })).toBeFocused();
});

test("Rename opens the form filled in and changes the name", async ({ page }) => {
  await openPlan(page, [{ day: "Mon", start: 720, end: 750, label: "Work" }]);
  await page.getByRole("button", { name: "Work, Monday 12:00 to 12:30 PM, blocked", exact: true }).click();
  await page.getByRole("dialog", { name: "Work" }).getByRole("button", { name: "Rename" }).click();

  const form = page.getByRole("dialog", { name: "Block a time" });
  const name = form.getByRole("textbox", { name: "Name (optional)" });
  await expect(name).toHaveValue("Work");
  await expect(form.getByRole("checkbox", { name: "Monday" })).toBeChecked();
  await expect(form.getByRole("combobox", { name: "From" })).toHaveValue("720");
  await expect(form.getByRole("combobox", { name: "To" })).toHaveValue("750");
  await name.fill("Gym");
  await form.getByRole("button", { name: "Block time" }).click();

  await expect(page.getByRole("button", { name: "Gym, Monday 12:00 to 12:30 PM, blocked", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Work, / })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Block a time" })).toBeFocused();
});

test("drawing mode at 834 px shows the bar above the calendar", async ({ page }) => {
  await page.setViewportSize({ width: 834, height: 1112 });
  await openPlan(page, [{ day: "Mon", start: 720, end: 750, label: "Work" }]);
  await startDrawing(page);
  await page.screenshot({ path: "e2e/screenshots/drawing-mode-834.png" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(834);
});

test("with no courses yet, drawing mode swaps the first-course message for a grid to draw on", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("goatplan:term:v1", "2027-C");
    localStorage.setItem("goatplan:tutorial:v1", "dismissed");
  });
  await page.goto("/");
  await expect(page.locator("[data-planner-term-status]")).toHaveAttribute("data-planner-term-status", "ready");
  await expect(page.getByRole("heading", { name: "Add your first course" })).toBeVisible();

  await startDrawing(page);
  await expect(page.getByRole("heading", { name: "Add your first course" })).toHaveCount(0);
  await drag(page, await pointAt(page, "Monday", 725), await pointAt(page, "Tuesday", 775));

  await expect(page.getByRole("status").filter({ hasText: "Blocked Mon, Tue 12–1 PM" })).toBeVisible();
  await expect(page.getByLabel("Tuesday 12:00 to 1:00 PM, blocked", { exact: true })).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/drawing-empty-plan-1440.png" });

  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("button", { name: "Monday 12:00 to 1:00 PM, blocked", exact: true })).toBeVisible();
});

test("drawing mode shows 8 AM to 10 PM, and the auto range comes back after Done", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPlan(page);
  await startDrawing(page);
  await expect(page.getByText("Auto-fit · 8:00 AM–10:00 PM")).toBeVisible();
  await page.getByRole("group", { name: "Calendar time grid" }).evaluate((element) => element.scrollTo({ top: element.scrollHeight }));
  await drag(page, await pointAt(page, "Thursday", 1145), await pointAt(page, "Thursday", 1195));
  await expect(page.getByRole("status").filter({ hasText: "Blocked Thu 7–8 PM" })).toBeVisible();

  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByText("Auto-fit · 8:00 AM–8:00 PM")).toBeVisible();
  await page.getByRole("button", { name: "Thursday 7:00 to 8:00 PM, blocked", exact: true }).click();
  await page.getByRole("dialog", { name: "Blocked time" }).getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("Auto-fit · 8:00 AM–5:00 PM")).toBeVisible();
});

test("the calendar doesn't move between drags, even when nothing fits", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPlan(page);
  await startDrawing(page);
  const top = await gridTop(page);

  await drag(page, await pointAt(page, "Monday", 605), await pointAt(page, "Friday", 655));
  await expect(page.getByRole("status").filter({ hasText: "Blocked Mon–Fri 10–11 AM" })).toBeVisible();
  await settled(page);
  await expect(page.getByText("0 schedules fit", { exact: true })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "No schedule fits" })).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/drawing-nothing-fits-1440.png" });
  expect(await gridTop(page)).toBe(top);

  await drag(page, await pointAt(page, "Monday", 605), await pointAt(page, "Friday", 655));
  await expect(page.getByRole("status").filter({ hasText: "Unblocked Mon–Fri 10–11 AM" })).toBeVisible();
  await settled(page);
  await expect(page.getByText("Schedule 1 of 4", { exact: true })).toBeVisible();
  expect(await gridTop(page)).toBe(top);

  await drag(page, await pointAt(page, "Tuesday", 905), await pointAt(page, "Tuesday", 955));
  await settled(page);
  expect(await gridTop(page)).toBe(top);
});

test("while drawing, the blocked times are one pill with a list to remove each", async ({ page }) => {
  await openPlan(page, [
    { day: "Mon", start: 720, end: 780, label: "Lunch" },
    { day: "Wed", start: 720, end: 780, label: "Lunch" },
    { day: "Thu", start: 900, end: 960 },
  ]);
  await expect(page.getByRole("button", { name: /^Remove blocked time/ })).toHaveCount(2);
  await startDrawing(page);

  const pill = page.getByRole("button", { name: "2 blocked times" });
  await expect(page.getByRole("button", { name: /^Remove blocked time/ })).toHaveCount(0);
  await pill.click();
  await expect(pill).toHaveAttribute("aria-expanded", "true");
  const list = page.getByRole("list", { name: "Blocked times" });
  await expect(list).toContainText("Lunch · Mon, Wed 12 PM–1 PM");
  await page.screenshot({ path: "e2e/screenshots/drawing-blocked-list-1440.png" });

  await list.getByRole("button", { name: "Remove blocked time Thu 3 PM–4 PM" }).click();
  await expect(page.getByRole("button", { name: "1 blocked time" })).toBeVisible();
  await expect(list.getByRole("button", { name: "Remove blocked time Lunch, Mon, Wed 12 PM–1 PM" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "1 blocked time" })).toBeFocused();
  await expect(page.getByRole("group", { name: "Drawing mode" })).toBeVisible();
});

test("a 30-minute blocked time in drawing mode still shows its time", async ({ page }) => {
  await openPlan(page, [{ day: "Wed", start: 900, end: 930 }]);
  await startDrawing(page);
  await expect(page.getByLabel("Wednesday 3:00 to 3:30 PM, blocked", { exact: true })).toHaveText("3–3:30 PM");
});

test("⌘-click or Ctrl-click picks several blocked times, and Delete removes them with one Undo", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPlan(page, [
    { day: "Mon", start: 720, end: 780, label: "Lunch" },
    { day: "Wed", start: 840, end: 900 },
    { day: "Fri", start: 900, end: 960, label: "Work" },
  ]);
  const lunch = page.getByRole("button", { name: /^Lunch, Monday 12:00 to 1:00 PM, blocked/ });
  const wednesday = page.getByRole("button", { name: /^Wednesday 2:00 to 3:00 PM, blocked/ });
  await lunch.click({ modifiers: ["ControlOrMeta"] });
  await wednesday.click({ modifiers: ["ControlOrMeta"] });
  await expect(page.getByRole("dialog", { name: "Lunch" })).toHaveCount(0);
  await expect(lunch).toHaveAccessibleName("Lunch, Monday 12:00 to 1:00 PM, blocked, selected");
  const bar = page.getByRole("group", { name: "Selected blocked times" });
  await expect(bar).toContainText("2 selected");
  await page.screenshot({ path: "e2e/screenshots/blocked-selected-1440.png" });

  await page.keyboard.press("Delete");
  await expect(page.getByRole("status").filter({ hasText: "Removed 2 blocked times" })).toBeVisible();
  await expect(bar).toHaveCount(0);
  await expect(page.getByLabel(/, blocked/)).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Block a time" })).toBeFocused();

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByLabel(/, blocked/)).toHaveCount(3);
});

test("the selection bar's Delete works in drawing mode, and Escape clears the pick before leaving the mode", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPlan(page, [
    { day: "Mon", start: 720, end: 780 },
    { day: "Tue", start: 720, end: 780 },
  ]);
  await startDrawing(page);
  const monday = page.getByLabel(/^Monday 12:00 to 1:00 PM, blocked/);
  const tuesday = page.getByLabel(/^Tuesday 12:00 to 1:00 PM, blocked/);
  await monday.click({ modifiers: ["ControlOrMeta"] });
  await expect(page.getByRole("group", { name: "Selected blocked times" })).toContainText("1 selected");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("group", { name: "Selected blocked times" })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Drawing mode" })).toBeVisible();

  await monday.click({ modifiers: ["ControlOrMeta"] });
  await tuesday.click({ modifiers: ["ControlOrMeta"] });
  await page.getByRole("group", { name: "Selected blocked times" }).getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Removed 2 blocked times" })).toBeVisible();
  await expect(page.getByLabel(/, blocked/)).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Drawing mode" })).toBeVisible();
});
