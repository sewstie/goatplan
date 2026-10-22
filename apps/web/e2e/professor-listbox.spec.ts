import { expect, test, type Page } from "@playwright/test";
import type { Draft } from "../src/lib/store/types";
import { professorListboxTerm } from "./fixtures/professorListbox";

const code = "DEMO 1001";
const key = "goatplan:draft:v1:2027-C";
const details = (page: Page) => page.getByRole("complementary", { name: "Course details" });
const picker = (page: Page) => page.getByRole("combobox", { name: "Lecture professor" });
const settled = (page: Page) => expect(page.locator("[data-planner-solve-status]").last()).toHaveAttribute("data-planner-solve-status", "done");

async function open(page: Page, data = professorListboxTerm()) {
  const plan: Draft = {
    courses: [code], preferences: { startsAfter: 0, blocked: [], onlyOpen: true },
    locks: { [code]: [`${code}-B01`] }, professorByCourse: {}, sortPreset: "fewestEarly", alternatives: {},
  };
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.route("**/data/2027-C.json", (route) => route.fulfill({ json: data }));
  await page.addInitScript(({ key, plan }) => {
    localStorage.setItem("goatplan:tutorial:v1", "completed");
    localStorage.setItem("goatplan:term:v1", "2027-C");
    localStorage.setItem(key, JSON.stringify({ version: 1, ...plan }));
  }, { key, plan });
  await page.goto("/");
  await settled(page);
}

test("state 25 opens the professor list over the course panel at 1440", async ({ page }) => {
  await open(page);
  for (let index = 0; index < 4 && await details(page).getByRole("heading", { name: "Lecture L01", exact: true }).count() === 0; index++) {
    await page.getByRole("button", { name: "Next schedule" }).click();
  }
  await page.getByRole("button", { name: /^DEMO 1001 B01,/ }).click();
  await picker(page).click();
  const popup = page.getByRole("listbox", { name: "Lecture professor" });
  await expect(popup.getByRole("option")).toHaveText([
    "Any professorAll 4 lecture times", "Alex Rivera3 lecture times · includes co-teaching", "Jordan Kim1 co-taught lecture", "Morgan Lee1 lecture time",
  ]);
  const box = (await popup.boundingBox())!;
  const field = (await picker(page).boundingBox())!;
  expect(box.width).toBe(252);
  expect(box.height).toBe(208);
  expect(box.y).toBe(field.y + field.height);
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot("professor-listbox-state-25-1440.png", { animations: "disabled" });
});

test("keyboard navigation keeps the highlighted professor visible in a long list", async ({ page }) => {
  const data = professorListboxTerm();
  data.courses[0].sections[0].instructors.push(...Array.from({ length: 16 }, (_, index) => `Teacher ${index + 1}`));
  await open(page, data);
  await picker(page).focus();
  await page.keyboard.press("End");
  const popup = page.getByRole("listbox");
  const last = popup.getByRole("option", { name: "Morgan Lee", exact: true });
  const box = (await popup.boundingBox())!;
  const option = (await last.boundingBox())!;
  expect(option.y).toBeGreaterThanOrEqual(box.y);
  expect(option.y + option.height).toBeLessThanOrEqual(box.y + box.height);
});

test("keyboard-only professor selection keeps every lecture and the lab lock with the real engine, state 26", async ({ page }) => {
  await open(page);
  await expect(page.getByText("Schedule 1 of 4", { exact: true })).toBeVisible();
  for (let index = 0; index < 40 && !await picker(page).evaluate((field) => field === document.activeElement); index++) await page.keyboard.press("Tab");
  await expect(picker(page)).toBeFocused();
  await page.keyboard.press("Alt+ArrowDown");
  await page.keyboard.type("Alex");
  await page.keyboard.press("Enter");
  await settled(page);
  await expect(page.getByText("Schedule 1 of 3", { exact: true })).toBeVisible();
  const lectures: string[] = [];
  for (let index = 0; index < 3; index++) {
    lectures.push(await details(page).getByRole("heading", { name: /^Lecture L/ }).innerText());
    await expect(details(page).getByRole("button", { name: "Unlock Lab B01", exact: true })).toBeVisible();
    if (index < 2) {
      await page.getByRole("button", { name: "Next schedule" }).focus();
      await page.keyboard.press("Enter");
    }
  }
  expect(lectures.sort()).toEqual(["Lecture L01", "Lecture L02", "Lecture L03"]);
  while (await details(page).getByRole("heading", { name: "Lecture L03", exact: true }).count() === 0) {
    await page.getByRole("button", { name: "Previous schedule" }).focus();
    await page.keyboard.press("Enter");
  }
  await expect(details(page).getByRole("group", { name: "Jordan Kim", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^DEMO 1001 B01,/ }).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot("professor-listbox-state-26-1440.png", { animations: "disabled" });
  await picker(page).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Home");
  await page.keyboard.press("Space");
  await settled(page);
  await expect(page.getByText("Schedule 1 of 4", { exact: true })).toBeVisible();
  const stored: Draft = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
  expect(stored).toMatchObject({ professorByCourse: { [code]: null }, locks: { [code]: [`${code}-B01`] }, preferences: { startsAfter: 0, blocked: [], onlyOpen: true } });
});
