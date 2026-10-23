import { expect, test, type Page } from "@playwright/test";
import { designPlan } from "../src/lib/plans/testing";

const plan = designPlan({ name: "Morning classes" });

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript((plan) => {
    if (sessionStorage.getItem("edit-plan-seeded")) return;
    sessionStorage.setItem("edit-plan-seeded", "true");
    localStorage.clear();
    localStorage.setItem("goatplan:tutorial:v1", "completed");
    localStorage.setItem("goatplan:term:v1", "2027-C");
    localStorage.setItem(`goatplan:plans:v1:plan:${plan.id}`, JSON.stringify({ version: 1, ...plan }));
    localStorage.setItem("goatplan:draft:v1:2027-C", JSON.stringify({
      version: 1,
      courses: ["AE 2320"],
      locks: {},
      professorByCourse: {},
      preferences: { startsAfter: 0, blocked: [], onlyOpen: true },
      sortPreset: "fewestEarly",
      alternatives: {},
    }));
  }, plan);
});

async function ready(page: Page) {
  await expect(page.locator("[data-planner-term-status]")).toHaveAttribute("data-planner-term-status", "ready");
  await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");
}

test("Edit this plan confirms unsaved changes, preserves Cancel, and opens an editable draft with keyboard focus", async ({ page }) => {
  await page.goto("/?share=reserved&view=saved&plan=plan-1");
  await ready(page);
  const edit = page.getByRole("button", { name: "Edit this plan", exact: true });
  await expect(edit).toBeVisible();
  await expect(page.getByRole("button", { name: "Schedule saved" })).toHaveCount(0);
  await page.locator("header").screenshot({ path: "e2e/screenshots/edit-this-plan-header-1440.png" });
  await page.screenshot({ path: "e2e/screenshots/edit-this-plan-1440.png", fullPage: true });
  const before = await page.evaluate(() => localStorage.getItem("goatplan:draft:v1:2027-C"));
  await edit.focus();
  await page.keyboard.press("Enter");
  const confirm = page.getByRole("dialog", { name: "Open “Morning classes”?" });
  await expect(confirm).toContainText("Your unsaved changes to the C Term schedule will be lost.");
  await confirm.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(edit).toBeFocused();
  await expect(page).toHaveURL("/?share=reserved&view=saved&plan=plan-1");
  expect(await page.evaluate(() => localStorage.getItem("goatplan:draft:v1:2027-C"))).toBe(before);
  await page.keyboard.press("Enter");
  await confirm.getByRole("button", { name: "Open plan", exact: true }).click();
  await ready(page);
  await expect(page).toHaveURL("/?share=reserved");
  await expect(page.getByRole("region", { name: "Schedule browser" })).toBeFocused();
  await expect(page.getByRole("status").filter({ hasText: "Opened “Morning classes” for editing." })).toBeAttached();
  await expect(page.getByRole("button", { name: "Remove AE 2410", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Unlock Lab CX02", exact: true })).toBeVisible();
  await expect(edit).toHaveCount(0);
  await page.reload();
  await ready(page);
  await expect(page.getByRole("button", { name: "Remove AE 2410", exact: true })).toBeVisible();
});

test("a missing saved-plan link shows the existing message and returns to Found with the draft intact", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  const before = await page.evaluate(() => localStorage.getItem("goatplan:draft:v1:2027-C"));
  const found = await page.getByRole("group", { name: "Schedules", exact: true }).innerText();
  await page.goto("/?share=reserved&view=saved&plan=missing#schedule");
  await ready(page);
  const message = page.getByRole("alert").filter({ hasText: "This plan isn’t here" });
  await expect(message).toBeVisible();
  await expect(message).toContainText("Saved plans stay in the browser they were saved in. It may have been deleted.");
  await expect(page).toHaveURL("/?share=reserved#schedule");
  await expect(page.getByRole("group", { name: "Schedules", exact: true })).toHaveText(found);
  await expect(page.getByRole("button", { name: "Remove AE 2320", exact: true })).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/missing-plan-1440.png", fullPage: true });
  expect(await page.evaluate(() => localStorage.getItem("goatplan:draft:v1:2027-C"))).toBe(before);
  await page.reload();
  await ready(page);
  await expect(page.getByRole("heading", { name: "This plan isn’t here" })).toHaveCount(0);
});
