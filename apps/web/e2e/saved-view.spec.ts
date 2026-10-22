import { expect, test, type Locator, type Page } from "@playwright/test";
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

test("saved browsing survives reload and back, and Found restores the draft", async ({ page }) => {
  await page.goto("/?share=reserved");
  await ready(page);
  const before = await page.evaluate(() => localStorage.getItem("goatplan:draft:v1:2027-C"));
  const foundLabel = await page.getByRole("group", { name: "Schedules", exact: true }).innerText();
  await page.locator("header").screenshot({ path: "e2e/screenshots/found-header-1440.png" });
  await page.getByRole("button", { name: "Saved", exact: true }).click();
  await expect(page).toHaveURL(/view=saved&plan=plan-1/);
  await expect(page.getByRole("button", { name: "Previous saved plan" })).toHaveAttribute("aria-disabled", "true");
  await page.locator("header").screenshot({ path: "e2e/screenshots/saved-header-1440.png" });
  await page.getByRole("button", { name: "Next saved plan" }).click();
  await expect(page).toHaveURL(/plan=plan-2/);
  await expect(page.getByRole("button", { name: "Next saved plan" })).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByRole("group", { name: "Preferences", exact: true })).toContainText("Job");
  await expect(page.getByRole("button", { name: /AE 2320 CX99/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Rate My Professors\s*: Ye Lu/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^(Lock |Unlock |Remove |Block a time|Save schedule)/ })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Lecture professor" })).toHaveCount(0);
  await page.reload();
  await ready(page);
  await expect(page.getByRole("status", { name: /Saved plan 2 of 2/ })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("status", { name: /Saved plan 1 of 2/ })).toBeVisible();
  await page.getByRole("button", { name: "Found", exact: true }).click();
  await expect(page).toHaveURL("/?share=reserved");
  await expect(page.getByRole("group", { name: "Schedules", exact: true })).toHaveText(foundLabel);
  expect(await page.evaluate(() => localStorage.getItem("goatplan:draft:v1:2027-C"))).toBe(before);
});

test("the saved browser works entirely with the keyboard", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  const saved = page.getByRole("button", { name: "Saved", exact: true });
  await tabTo(page, saved);
  await page.keyboard.press("Enter");
  await expect(saved).toBeFocused();
  const next = page.getByRole("button", { name: "Next saved plan" });
  await tabTo(page, next);
  await page.keyboard.press("Enter");
  await expect(next).toBeFocused();
  await expect(page.getByRole("status", { name: /Saved plan 2 of 2/ })).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("status", { name: /Saved plan 1 of 2/ })).toBeVisible();
  await tabTo(page, page.getByRole("button", { name: "Found", exact: true }));
  await page.keyboard.press("Space");
  await expect(page).toHaveURL("/");
});

test("leaving Saved for the registration page restores the editable working draft", async ({ page }) => {
  await page.goto("/?view=saved&plan=plan-1");
  await ready(page);
  await page.getByRole("link", { name: "Sections to register" }).click();
  await expect(page).toHaveURL("/plans?plan=plan-1");
  await expect(page.getByRole("button", { name: "Remove AE 2320" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Block a time", exact: true })).toBeVisible();
});
