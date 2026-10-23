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

test("selecting a saved plan confirms unsaved changes and opens it directly for editing", async ({ page }) => {
  await page.goto("/?share=reserved&view=saved&plan=plan-1");
  await ready(page);
  const menu = page.getByRole("button", { name: "Saved plans", exact: true });
  await expect(page.getByRole("button", { name: "Edit this plan", exact: true })).toHaveCount(0);
  const before = await page.evaluate(() => localStorage.getItem("goatplan:draft:v1:2027-C"));
  await menu.click();
  await page.getByRole("button", { name: /Morning classes/ }).click();
  const confirm = page.getByRole("dialog", { name: "Open “Morning classes”?" });
  await expect(confirm).toContainText("Your unsaved changes to the C Term schedule will be lost.");
  await confirm.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(menu).toBeFocused();
  await expect(page).toHaveURL("/?share=reserved&view=saved&plan=plan-1");
  expect(await page.evaluate(() => localStorage.getItem("goatplan:draft:v1:2027-C"))).toBe(before);
  await menu.click();
  await page.getByRole("button", { name: /Morning classes/ }).click();
  await confirm.getByRole("button", { name: "Open plan", exact: true }).click();
  await ready(page);
  await expect(page).toHaveURL("/?share=reserved");
  await expect(page.getByRole("region", { name: "Schedule browser" })).toBeFocused();
  await expect(page.getByRole("status").filter({ hasText: "Opened “Morning classes” for editing." })).toBeAttached();
  await expect(page.getByRole("button", { name: "Remove AE 2410", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Unlock Lab CX02", exact: true })).toBeVisible();
  await page.reload();
  await ready(page);
  await expect(page.getByRole("button", { name: "Remove AE 2410", exact: true })).toBeVisible();
});

test("All saved plans leaves the surrounding planner panels empty without changing the draft", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  const before = await page.evaluate(() => localStorage.getItem("goatplan:draft:v1:2027-C"));
  await page.getByRole("button", { name: "Saved plans", exact: true }).click();
  await page.getByRole("link", { name: "All saved plans", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your saved plans", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "All saved plans", exact: true })).toBeVisible();
  const sidebar = page.getByRole("complementary", { name: "Term and courses" });
  await expect(sidebar.getByRole("combobox")).toHaveCount(0);
  await expect(sidebar.getByRole("searchbox")).toHaveCount(0);
  await expect(sidebar.getByText("AE 2320")).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Preferences", exact: true })).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "Plan summary" })).toBeEmpty();
  for (const width of [1440, 834]) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({ path: `e2e/screenshots/all-saved-plans-empty-panels-${width}.png`, fullPage: true });
  }
  expect(await page.evaluate(() => localStorage.getItem("goatplan:draft:v1:2027-C"))).toBe(before);
  await page.getByRole("link", { name: "Back to planner" }).click();
  await expect(page.getByRole("button", { name: "Remove AE 2320", exact: true })).toBeVisible();
});

test("Start a new plan confirms unsaved work and saves a separate plan from an empty draft", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  const before = await page.evaluate(() => localStorage.getItem("goatplan:draft:v1:2027-C"));
  const savedBefore = await page.evaluate(() => localStorage.getItem("goatplan:plans:v1:plan:plan-1"));
  const menu = page.getByRole("button", { name: "Saved plans", exact: true });
  await menu.click();
  await page.screenshot({ path: "e2e/screenshots/start-new-plan-menu-1440.png", fullPage: true });
  await page.getByRole("button", { name: "Start a new plan", exact: true }).click();
  const confirm = page.getByRole("dialog", { name: "Start a new plan?" });
  await expect(confirm).toBeVisible();
  await confirm.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(menu).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem("goatplan:draft:v1:2027-C"))).toBe(before);
  await menu.click();
  await page.getByRole("button", { name: "Start a new plan", exact: true }).click();
  await confirm.getByRole("button", { name: "Start a new plan", exact: true }).click();
  const search = page.getByRole("searchbox", { name: "Search courses" });
  await expect(search).toBeFocused();
  await expect(page.getByRole("button", { name: /^Remove AE/ })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Starts after" })).toHaveValue("0");
  await expect(page.getByRole("switch", { name: "Only open sections" })).toBeChecked();
  await expect(page.getByRole("button", { name: "Save schedule", exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.locator("[data-planner-term-status]")).toHaveAttribute("data-planner-term-status", "ready");
  await expect(page.getByRole("button", { name: /^Remove AE/ })).toHaveCount(0);
  await page.getByRole("searchbox", { name: "Search courses" }).fill("AE 2320");
  await page.getByRole("searchbox", { name: "Search courses" }).press("Enter");
  await ready(page);
  await page.getByRole("button", { name: "Save schedule", exact: true }).click();
  const naming = page.getByRole("dialog", { name: "Save schedule", exact: true });
  await naming.getByRole("textbox", { name: "Plan name" }).fill("Fresh plan");
  await naming.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("button", { name: "Schedule saved", exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("goatplan:plans:v1:plan:plan-1"))).toBe(savedBefore);
  await menu.click();
  await expect(page.getByRole("button", { name: /Fresh plan/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Morning classes/ })).toBeVisible();
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
