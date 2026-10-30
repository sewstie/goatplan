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

/** The middle of a day's column at a time, with the grid showing 8 AM to 5 PM. */
async function pointAt(page: Page, day: string, minute: number) {
  const box = (await page.getByRole("group", { name: day, exact: true }).boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + ((minute - 480) / 540) * box.height };
}

async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }, during?: () => Promise<void>) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await during?.();
  await page.mouse.up();
}

test("dragging across Mon–Wed blocks 12–1 PM on each day and solves once, on release", async ({ page }) => {
  await openPlan(page);
  await expect(page.getByText("Schedule 1 of 4", { exact: true })).toBeVisible();

  const empty = await pointAt(page, "Tuesday", 750);
  await page.mouse.click(empty.x, empty.y);
  await expect(page.getByRole("status").filter({ hasText: "Blocked" })).toHaveCount(0);

  await drag(page, await pointAt(page, "Monday", 725), await pointAt(page, "Wednesday", 775), async () => {
    await expect(page.getByText("Mon–Wed 12:00–1:00 PM", { exact: true })).toBeVisible();
    await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");
  });

  await expect(page.getByRole("status").filter({ hasText: "Blocked Mon–Wed 12–1 PM" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Name it" })).toBeVisible();
  await settled(page);
  await expect(page.getByText("Schedule 1 of 3", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove blocked time Mon–Wed 12 PM–1 PM" })).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/drag-block-1440.png" });
});

test("Undo puts the blocked times back the way they were", async ({ page }) => {
  await openPlan(page);
  await drag(page, await pointAt(page, "Monday", 725), await pointAt(page, "Wednesday", 775));
  await settled(page);
  await expect(page.getByText("Schedule 1 of 3", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("button", { name: "Block a time" })).toBeFocused();
  await settled(page);
  await expect(page.getByText("Schedule 1 of 4", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Remove blocked time/ })).toHaveCount(0);
});

test("Name it opens the Block time form filled in, and saves the name", async ({ page }) => {
  await openPlan(page);
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
});

test("the toast only names the days that changed", async ({ page }) => {
  await openPlan(page, [{ day: "Thu", start: 720, end: 840, label: "Work" }]);
  await drag(page, await pointAt(page, "Wednesday", 725), await pointAt(page, "Friday", 775));
  await expect(page.getByRole("status").filter({ hasText: "Blocked Wed, Fri 12–1 PM" })).toBeVisible();
});

test("a drag that starts on a blocked time removes that part, splitting the block", async ({ page }) => {
  await openPlan(page, [{ day: "Mon", start: 720, end: 840, label: "Work" }]);

  await drag(page, await pointAt(page, "Monday", 755), await pointAt(page, "Monday", 800), async () => {
    await expect(page.getByText("Remove Mon 12:30–1:30 PM", { exact: true })).toBeVisible();
  });

  await expect(page.getByRole("status").filter({ hasText: "Unblocked Mon 12:30–1:30 PM" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove blocked time Work, Mon 12 PM–12:30 PM" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove blocked time Work, Mon 1:30 PM–2 PM" })).toBeVisible();
});

test("Escape cancels a drag", async ({ page }) => {
  await openPlan(page);
  const from = await pointAt(page, "Monday", 725);
  const to = await pointAt(page, "Tuesday", 775);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await expect(page.getByText("Mon, Tue 12:00–1:00 PM", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("Mon, Tue 12:00–1:00 PM", { exact: true })).toHaveCount(0);
  await page.mouse.up();
  await expect(page.getByRole("button", { name: /^Remove blocked time/ })).toHaveCount(0);
});

test("a class block still opens its details", async ({ page }) => {
  await openPlan(page);
  await page.getByRole("button", { name: /^CS 1101 CL01/ }).first().click();
  await expect(page.getByRole("status").filter({ hasText: "Blocked" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^CS 1101 CL01/ }).first()).toHaveAttribute("aria-pressed", "true");
});
