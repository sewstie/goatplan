import { expect, test } from "./fixtures/test";
import type { Locator, Page } from "@playwright/test";
import { designPlan } from "../src/lib/plans/testing";

const first = designPlan({ name: "Morning classes" });
const second = designPlan({ id: "plan-2", name: "My saved plan with a very long name for the next term schedule", savedAt: "2026-10-16T12:00:00Z", preferences: { startsAfter: 0, blocked: [{ day: "Sun", start: 1080, end: 1200, label: "Job" }], onlyOpen: false } });
second.schedule[0].sections[0] = { ...second.schedule[0].sections[0], id: "AE 2320-CX99", code: "CX99", meetings: [{ days: ["Sun"], start: 1200, end: 1250, location: "Snapshot room" }] };

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(({ first, second }) => {
    if (localStorage.getItem("saved-view-seeded")) return;
    localStorage.clear();
    localStorage.setItem("saved-view-seeded", "true");
    localStorage.setItem("goatplan:term:v1", "2027-C");
    localStorage.setItem("goatplan:plans:v1:current:2027-C", "plan-1");
    localStorage.setItem("goatplan:draft:v1:2027-C", JSON.stringify({ version: 1, courses: ["AE 2320"], locks: {}, professorByCourse: {}, preferences: { startsAfter: 0, blocked: [], onlyOpen: true }, sortPreset: "fewestEarly", alternatives: {} }));
    for (const plan of [first, second]) localStorage.setItem(`goatplan:plans:v1:plan:${plan.id}`, JSON.stringify({ version: 1, ...plan }));
  }, { first, second });
});

async function ready(page: Page) {
  await expect(page.locator("[data-planner-term-status]")).toHaveAttribute("data-planner-term-status", "ready");
  await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");
}

async function tabTo(page: Page, target: Locator) {
  for (let index = 0; index < 100; index += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }
  throw new Error("Could not reach the control with Tab");
}

test("saved URLs survive reload and back without changing the working draft", async ({ page }) => {
  await page.goto("/?share=reserved");
  await ready(page);
  const before = await page.evaluate(() => localStorage.getItem("goatplan:draft:v1:2027-C"));
  const foundLabel = await page.getByRole("group", { name: "Schedules", exact: true }).innerText();
  await page.locator("header").screenshot({ path: "e2e/screenshots/found-header-1440.png" });
  await expect(page.getByRole("group", { name: "Schedule source" })).toHaveCount(0);
  await page.goto("/?share=reserved&view=saved&plan=plan-1");
  await ready(page);
  await expect(page).toHaveURL(/view=saved&plan=plan-1/);
  await expect(page.getByRole("button", { name: "Previous saved plan" })).toHaveAttribute("aria-disabled", "true");
  await page.locator("header").screenshot({ path: "e2e/screenshots/saved-header-1440.png" });
  await page.getByRole("button", { name: "Next saved plan" }).click();
  await expect(page).toHaveURL(/plan=plan-2/);
  await expect(page.getByRole("button", { name: "Next saved plan" })).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByRole("group", { name: "Preferences", exact: true })).toContainText("Job");
  await expect(page.getByRole("button", { name: /AE 2320 CX99/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /View Ye Lu on Rate My Professors/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^(Lock |Unlock |Remove |Block a time|Save schedule)/ })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Lecture professor" })).toHaveCount(0);
  await page.reload();
  await ready(page);
  await expect(page.getByRole("status", { name: /Saved plan 2 of 2/ })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("status", { name: /Saved plan 1 of 2/ })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL("/?share=reserved");
  await expect(page.getByRole("group", { name: "Schedules", exact: true })).toHaveText(foundLabel);
  expect(await page.evaluate(() => localStorage.getItem("goatplan:draft:v1:2027-C"))).toBe(before);
});

test("saved paging and the simplified menu work entirely with the keyboard", async ({ page }) => {
  await page.goto("/?view=saved&plan=plan-1");
  await ready(page);
  const next = page.getByRole("button", { name: "Next saved plan" });
  await tabTo(page, next);
  await page.keyboard.press("Enter");
  await expect(next).toBeFocused();
  await expect(page.getByRole("status", { name: /Saved plan 2 of 2/ })).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("status", { name: /Saved plan 1 of 2/ })).toBeVisible();
  await tabTo(page, page.getByRole("button", { name: "Saved plans", exact: true }));
  await page.keyboard.press("Enter");
  await expect(page.getByRole("list", { name: "Plan actions" }).getByRole("listitem")).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Sections to register", exact: true })).toHaveCount(0);
  await tabTo(page, page.getByRole("link", { name: "All saved plans" }));
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/plans");
  await tabTo(page, page.getByRole("link", { name: "Back to planner" }));
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/");
});

test("the saved-plans page offers Back to planner instead of save controls", async ({ page }) => {
  await page.goto("/?view=saved&plan=plan-1");
  await ready(page);
  await page.getByRole("button", { name: "Saved plans", exact: true }).click();
  await page.getByRole("link", { name: "All saved plans" }).click();
  await expect(page).toHaveURL("/plans");
  await expect(page.locator("header").getByRole("button")).toHaveCount(0);
  await page.locator("header:visible").screenshot({ path: "e2e/screenshots/all-saved-header-1440.png" });
  await page.getByRole("link", { name: "Back to planner" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Remove AE 2320" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Block a time", exact: true })).toBeVisible();
});

test("save states are shown by the button and the dropdown keeps only the requested actions", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  const header = page.locator("header");
  await expect(header.getByText("Unsaved changes", { exact: true })).toHaveCount(0);
  for (const width of [1440, 834]) {
    await page.setViewportSize({ width, height: 900 });
    await header.screenshot({ path: `e2e/screenshots/planner-unsaved-header-${width}.png` });
  }
  await header.getByRole("button", { name: "Save schedule", exact: true }).click();
  await expect(header.getByRole("button", { name: "Schedule saved", exact: true })).toHaveAttribute("aria-disabled", "true");
  await expect(header.getByText("Schedule saved", { exact: true })).toHaveCount(0);
  for (const width of [1440, 834]) {
    await page.setViewportSize({ width, height: 900 });
    await header.screenshot({ path: `e2e/screenshots/planner-saved-header-${width}.png` });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await header.getByRole("button", { name: "Saved plans", exact: true }).click();
  await expect(page.getByRole("list", { name: "Plan actions" }).getByRole("listitem")).toHaveText(["Start a new plan", "Save as a new plan", "All saved plans"]);
  await page.screenshot({ path: "e2e/screenshots/planner-saved-menu-1440.png", fullPage: true });
});

test("opening the current saved plan from its dropdown returns to the editable planner", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await page.getByRole("button", { name: "Save schedule", exact: true }).click();
  await expect(page.getByRole("button", { name: "Schedule saved", exact: true })).toBeVisible();
  const before = await page.evaluate(() => localStorage.getItem("goatplan:draft:v1:2027-C"));
  await page.goto("/?view=saved&plan=plan-1");
  await ready(page);
  await page.getByRole("button", { name: "Saved plans", exact: true }).click();
  await page.getByRole("button", { name: /Morning classes.*open now/ }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Remove AE 2320" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("goatplan:draft:v1:2027-C"))).toBe(before);
});

test("Save as a new plan copies a viewed snapshot without changing the draft", async ({ page }) => {
  await page.goto("/?view=saved&plan=plan-1");
  await ready(page);
  const before = await page.evaluate(() => localStorage.getItem("goatplan:draft:v1:2027-C"));
  await page.getByRole("button", { name: "Saved plans", exact: true }).click();
  await page.getByRole("button", { name: "Save as a new plan", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Save as a new plan" });
  await dialog.getByRole("textbox", { name: "Plan name" }).fill("Morning copy");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status", { name: /Morning copy/ })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("goatplan:draft:v1:2027-C"))).toBe(before);
});
