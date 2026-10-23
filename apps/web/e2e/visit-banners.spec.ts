import { expect, test, type Page } from "@playwright/test";
import { coursePanelTerm } from "./fixtures/coursePanel";
import { emptyDraft } from "../src/lib/store/draft";
import { designPlan } from "../src/lib/plans/testing";

const notice = "Guide progress can’t be remembered in this browser. You may see the guide again next visit.";
const guide = (page: Page) => page.getByRole("dialog").filter({ has: page.getByRole("button", { name: "Close guide" }) });
const next = (page: Page) => guide(page).getByRole("button", { name: "Next", exact: true });
const settled = (page: Page) => expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");

test.beforeEach(async ({ page }) => {
  const term = coursePanelTerm("07");
  term.term.name = "C Term";
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.route("**/data/index.json", (route) => route.fulfill({ json: { terms: [{ ...term.term, status: "upcoming", courses: term.courses.length, sections: 7, generatedAt: term.generatedAt }] } }));
  await page.route(`**/data/${term.term.id}.json`, (route) => route.fulfill({ json: term }));
});

test("state 36: finishing the guide and returning restores only the choices kept", async ({ page }) => {
  await page.goto("/");
  await expect(next(page)).toHaveAttribute("aria-disabled", "false");
  await next(page).click();
  await page.getByRole("searchbox").fill("AE 2320");
  await page.getByRole("searchbox").press("Enter");
  await settled(page);
  await next(page).click();
  const professor = page.getByRole("combobox", { name: "Lecture professor" });
  await professor.click();
  await page.getByRole("option", { name: "Ye Lu", exact: true }).click();
  await settled(page);
  await next(page).click();
  await next(page).click();
  await guide(page).getByRole("button", { name: "Finish guide" }).click();
  await expect(guide(page)).toBeHidden();
  await page.evaluate(() => {
    const key = "goatplan:draft:v1:2027-C";
    const draft = JSON.parse(localStorage.getItem(key)!);
    draft.preferences.startsAfter = 540;
    draft.preferences.blocked = ["Tue", "Fri"].map((day) => ({ day, start: 840, end: 960, label: "Work" }));
    draft.locks = { "AE 2320": ["AE 2320-CX02", "removed"] };
    draft.courses = ["AE 2320", "AE 2410", "AE 2210", "REMOVED 1000"];
    localStorage.setItem(key, JSON.stringify(draft));
  });
  await page.reload();
  await settled(page);
  await expect(guide(page)).toBeHidden();
  const banner = page.getByRole("status").filter({ hasText: "Plan restored" });
  await expect(banner).toHaveText("Plan restored · 9 AM start, Work, Ye Lu and lab CX02 are kept.");
  await expect(page.getByRole("button", { name: "Unlock Lab CX02", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "AE 2320 CX02", exact: false }).first().click();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "e2e/screenshots/visit-state-36-1440.png", animations: "disabled" });
  await expect(page).toHaveScreenshot("visit-state-36-1440.png", { animations: "disabled" });
});

test("state 37: a failed guide write changes the open step once while planning continues", async ({ page }) => {
  await page.goto("/");
  await expect(next(page)).toHaveAttribute("aria-disabled", "false");
  await next(page).click();
  await page.getByRole("searchbox").fill("AE 2320");
  await page.getByRole("searchbox").press("Enter");
  await settled(page);
  await next(page).click();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new DOMException("Storage blocked", "SecurityError"); };
  });
  await next(page).focus();
  await page.keyboard.press("Enter");
  await expect(guide(page).getByRole("heading", { name: "Keep planning in this visit" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: notice })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "e2e/screenshots/visit-state-37-1440.png", animations: "disabled" });
  await expect(page).toHaveScreenshot("visit-state-37-1440.png", { animations: "disabled" });
  await next(page).click();
  await expect(guide(page).getByRole("heading", { name: "Make room for your day" })).toBeVisible();
  await guide(page).getByRole("button", { name: "Back", exact: true }).click();
  await expect(guide(page).getByRole("heading", { name: "A professor preference is optional" })).toBeVisible();
  await guide(page).getByRole("button", { name: "Skip guide" }).click();
  await expect(guide(page)).toBeHidden();
  await page.getByRole("combobox", { name: "Starts after" }).selectOption("600");
  await settled(page);
  await expect(page.getByRole("combobox", { name: "Starts after" })).toHaveValue("600");
  await expect(page.getByRole("status").filter({ hasText: notice })).toBeVisible();
});

test("saved-plan URLs restore the snapshot with an empty working draft", async ({ page }) => {
  const saved = designPlan({ professorByCourse: { "AE 2320": "Ye Lu" } });
  await page.addInitScript(({ saved, draft }) => {
    localStorage.setItem("goatplan:plans:v1:plan:plan-1", JSON.stringify({ version: 1, ...saved }));
    localStorage.setItem("goatplan:draft:v1:2027-C", JSON.stringify({ version: 1, ...draft }));
  }, { saved, draft: emptyDraft() });
  await page.goto("/?view=saved&plan=plan-1");
  await expect(page.getByRole("status").filter({ hasText: "Plan restored" })).toHaveText("Plan restored · 9 AM start, Ye Lu and lab CX02 are kept.");
  await expect(guide(page)).toBeHidden();
});

test("storage blocked from arrival still permits finishing the guide", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Storage blocked", "SecurityError"); } });
  });
  await page.goto("/");
  await expect(next(page)).toHaveAttribute("aria-disabled", "false");
  await next(page).click();
  await expect(guide(page).getByRole("heading", { name: "Keep planning in this visit" })).toBeVisible();
  await next(page).click();
  await page.getByRole("searchbox").fill("AE 2320");
  await page.getByRole("searchbox").press("Enter");
  await settled(page);
  for (let i = 0; i < 3; i++) await next(page).click();
  await guide(page).getByRole("button", { name: "Finish guide" }).click();
  await expect(guide(page)).toBeHidden();
  await expect(page.getByRole("status").filter({ hasText: notice })).toBeVisible();
});
