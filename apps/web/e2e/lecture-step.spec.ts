import { expect, test, type Page } from "@playwright/test";
import type { Draft } from "../src/lib/store/types";
import { coursePanelTerm } from "./fixtures/coursePanel";

const code = "DEMO 1001";
const key = "goatplan:draft:v1:2027-C";
const details = (page: Page) => page.getByRole("complementary", { name: "Course details" });
const settled = (page: Page) => expect(page.locator("[data-planner-solve-status]").last()).toHaveAttribute("data-planner-solve-status", "done", { timeout: 30_000 });

test("lecture-first choices narrow real-engine results and preserve a locked lab using only the keyboard", async ({ page }) => {
  const term = coursePanelTerm("24");
  const course = term.courses[0];
  course.sections.push({ ...course.sections[1], id: `${code}-L03`, code: "L03", instructors: ["Alex Rivera", "Jordan Lee"],
    meetings: [{ days: ["Wed"], start: 660, end: 710, location: "Example Hall 103" }],
  });
  course.options = course.options.filter((option) => !(option.includes(`${code}-L01`) && option.includes(`${code}-B02`)));
  course.options.push([`${code}-L03`, `${code}-B02`, `${code}-D01`]);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route("**/data/2027-C.json", (route) => route.fulfill({ json: term }));
  await page.addInitScript(({ key, code }) => {
    localStorage.setItem("goatplan:tutorial:v1", "completed");
    localStorage.setItem("goatplan:term:v1", "2027-C");
    localStorage.setItem(key, JSON.stringify({ version: 1, courses: [code], preferences: { startsAfter: 0, blocked: [], onlyOpen: true },
      locks: {}, professorByCourse: {}, sortPreset: "fewestEarly", alternatives: {},
    }));
  }, { key, code });
  await page.goto("/");
  await settled(page);
  await expect(page.getByText("Schedule 1 of 4", { exact: true })).toBeVisible();
  const disclosure = details(page).getByRole("button", { name: "2 other lecture times · Unlocked" });
  await disclosure.focus();
  await page.keyboard.press("Enter");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "e2e/screenshots/lecture-step-open-1440.png", fullPage: true, animations: "disabled" });
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(details(page).getByRole("button", { name: "Choose L02" })).toBeFocused();
  await page.keyboard.press("Enter");
  await settled(page);
  await expect(page.getByText("Schedule 1 of 2", { exact: true })).toBeVisible();
  await expect(details(page).getByRole("status")).toHaveText("Lecture L02 locked · 2 schedules fit");
  await expect(details(page).getByRole("button", { name: "Other lab choices" })).toBeFocused();
  const currentLab = await details(page).getByRole("heading", { name: /^Lab B0/ }).innerText();
  const lockedLab = currentLab === "Lab B01" ? "B02" : "B01";
  await page.keyboard.press("Tab");
  const lab = details(page).getByRole("button", { name: `Choose ${lockedLab}` });
  await expect(lab).toBeFocused();
  await page.keyboard.press("Space");
  await settled(page);
  await expect(page.getByText("Schedule 1 of 1", { exact: true })).toBeVisible();
  await expect(details(page).getByRole("button", { name: `Unlock Lab ${lockedLab}` })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(details(page).getByRole("button", { name: "2 other lecture times · Locked" })).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  if (lockedLab === "B01") await page.keyboard.press("Tab");
  const disabled = details(page).getByRole("button", { name: lockedLab === "B02" ? "Choose L01" : "Choose L03" });
  await expect(disabled).toBeFocused();
  await expect(disabled).toHaveAttribute("aria-disabled", "true");
  await expect(disabled).toHaveAccessibleDescription(`Doesn't fit locked lab ${lockedLab}`);
  await page.keyboard.press("Enter");
  await expect(disabled).toBeFocused();
  await page.screenshot({ path: "e2e/screenshots/lecture-step-locked-lab-1440.png", fullPage: true, animations: "disabled" });
  await page.keyboard.press(lockedLab === "B02" ? "Tab" : "Shift+Tab");
  const nextLecture = lockedLab === "B02" ? "L03" : "L01";
  await expect(details(page).getByRole("button", { name: `Choose ${nextLecture}` })).toBeFocused();
  await page.keyboard.press("Enter");
  await settled(page);
  await expect(details(page).getByRole("button", { name: `Unlock Lecture ${nextLecture}` })).toBeVisible();
  await expect(details(page).getByRole("button", { name: `Unlock Lab ${lockedLab}` })).toBeVisible();
  const draft: Draft = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
  expect(draft.locks).toEqual({ [code]: [`${code}-${lockedLab}`, `${code}-${nextLecture}`] });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
});
