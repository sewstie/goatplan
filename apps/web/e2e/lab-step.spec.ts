import { expect, test } from "./fixtures/test";
import type { Page } from "@playwright/test";
import type { Draft } from "../src/lib/store/types";
import { coursePanelTerm } from "./fixtures/coursePanel";

const code = "AE 2320";
const key = "goatplan:draft:v1:2027-C";
const details = (page: Page) => page.getByRole("complementary", { name: "Course details" });
const settled = (page: Page) => expect(page.locator("[data-planner-solve-status]").last()).toHaveAttribute("data-planner-solve-status", "done", { timeout: 30_000 });

async function open(page: Page, locks: Draft["locks"]) {
  const term = coursePanelTerm("07");
  const course = term.courses[0];
  course.sections[1].enrolled = 39;
  const last = course.sections[3];
  last.id = `${code}-CX03`;
  last.code = "CX03";
  last.enrolled = 9;
  last.instructors = ["Ye Lu"];
  last.meetings = [{ days: ["Thu"], start: 960, end: 1010, location: "Higgins Labs 230" }];
  course.options[2] = [`${code}-CL01`, last.id];
  const plan: Draft = {
    courses: [code, "AE 2410", "AE 2210"],
    preferences: { startsAfter: 540, onlyOpen: true, blocked: [
      { day: "Tue", start: 840, end: 960, label: "Work" },
      { day: "Fri", start: 840, end: 960, label: "Work" },
    ] },
    locks, professorByCourse: { [code]: "Ye Lu" }, sortPreset: "fewestEarly", alternatives: {},
  };
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.route("**/data/2027-C.json", (route) => route.fulfill({ json: term }));
  await page.addInitScript(({ key, plan }) => {
    localStorage.setItem("goatplan:tutorial:v1", "completed");
    localStorage.setItem("goatplan:term:v1", "2027-C");
    localStorage.setItem(key, JSON.stringify({ version: 1, ...plan }));
  }, { key, plan });
  await page.goto("/");
  await settled(page);
}

test("state 21 previews another lab inline at 1440", async ({ page }) => {
  await open(page, { [code]: [`${code}-CX02`] });
  await details(page).getByRole("button", { name: "View other lab choices" }).click();
  const list = details(page).getByRole("list", { name: "Other lab choices" });
  await expect(list.getByRole("button")).toHaveCount(2);
  await expect(list.getByRole("button", { name: "Choose Lab CX02" })).toHaveCount(0);
  await list.getByRole("button", { name: "Choose Lab CX03" }).hover();
  await expect(list.getByText("Previewing")).toBeVisible();
  const ghost = page.getByRole("button", { name: /^Preview, AE 2320 CX03,/ });
  await expect(ghost).toBeVisible();
  await expect(ghost).toHaveCSS("border-top-style", "dashed");
  await expect(page.getByRole("button", { name: /^AE 2320 CX02,/ })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot("lab-step-state-21-1440.png", { animations: "disabled" });
});

test("the real engine narrows the count after a keyboard lab choice and keeps other locks", async ({ page }) => {
  const locks = { [code]: [`${code}-CL01`], "AE 2410": ["AE 2410-C01"] };
  await open(page, locks);
  await expect(page.getByText("Schedule 1 of 3", { exact: true })).toBeVisible();
  const disclosure = details(page).getByRole("button", { name: "View other lab choices" });
  await disclosure.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  const choice = details(page).getByRole("button", { name: "Choose Lab CX02" });
  await expect(choice).toBeFocused();
  await expect(page.getByRole("button", { name: /^Preview, AE 2320 CX02,/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(disclosure).toBeFocused();
  await expect(page.locator("[data-preview]")).toHaveCount(0);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await settled(page);
  await expect(details(page).getByRole("button", { name: "Unlock Lab CX02" })).toBeFocused();
  await expect(page.getByText("Schedule 1 of 1", { exact: true })).toBeVisible();
  const draft: Draft = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
  expect(draft.locks).toEqual({ [code]: [`${code}-CL01`, `${code}-CX02`], "AE 2410": ["AE 2410-C01"] });
  await expect(page.locator("[data-preview]")).toHaveCount(0);
});
