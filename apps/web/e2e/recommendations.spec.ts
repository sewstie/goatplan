import { expect, test } from "./fixtures/test";
import { openDegree, stored, panel, savedCourse } from "./fixtures/degree";
import type { Page } from "@playwright/test";

const catalog = ["CS 1101", "CS 1102", "CS 2022", "CS 2102", "CS 2223", "MA 1021", "PH 1110", "EN 1251", "PSY 1400"].map((code) => ({ code, title: `${code} title`, credits: 3, level: "Undergraduate", lastOffered: "2027-D", termLetters: ["A", "B", "C", "D"] }));
const nextPanel = (page: Page) => panel(page, "Suggest next terms");
async function open(page: Page) {
  await page.clock.setFixedTime(new Date("2026-11-07T12:00:00Z"));
  await page.route("**/data/catalog.json", (route) => route.fulfill({ json: { courses: catalog } }));
  await openDegree(page);
  await page.getByRole("button", { name: "Plan ahead", exact: true }).click();
  await page.getByRole("button", { name: "Suggest next terms", exact: true }).click();
  await pickStart(page, "A Term 2027");
}
async function pickStart(page: Page, term: string) {
  await nextPanel(page).getByRole("button", { name: /^Starting term/ }).click();
  await page.getByRole("button", { name: new RegExp(`^${term}`) }).click();
}
const addButton = (page: Page) => nextPanel(page).getByRole("button", { name: /to my plan$/ });
async function generate(page: Page) {
  await nextPanel(page).getByRole("button", { name: /^(Suggest courses|Suggest again)$/ }).click();
  await expect(nextPanel(page).getByRole("status")).toContainText("Suggestions ready", { timeout: 30_000 });
}

test("preview, keep, exclude, regenerate, and cancel preserve degree and planner storage", async ({ page }) => {
  await open(page);
  const before = await stored(page);
  const plannerBefore = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith("goatplan:draft:") || key === "goatplan:term:v1")));
  await nextPanel(page).getByRole("group", { name: "Terms", exact: true }).getByRole("button", { name: "2", exact: true }).click();
  await generate(page);
  await expect(nextPanel(page).getByText("Ready after earlier terms").first()).toBeVisible();
  await nextPanel(page).locator("summary").filter({ hasText: "Other options" }).first().click();
  await nextPanel(page).getByRole("button", { name: "Keep MA 1021", exact: true }).first().click();
  await expect(nextPanel(page).getByRole("button", { name: "Keep MA 1021", exact: true }).first()).toHaveAttribute("aria-pressed", "true");
  await expect(addButton(page)).toBeDisabled();
  await generate(page);
  await expect(nextPanel(page).getByRole("list", { name: "Kept choices" })).toContainText("MA 1021");
  await nextPanel(page).getByRole("button", { name: "Skip CS 2022", exact: true }).first().click();
  await generate(page);
  await expect(nextPanel(page).getByRole("checkbox", { name: "Add CS 2022", exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");
  expect(await stored(page)).toEqual(before);
  expect(await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith("goatplan:draft:") || key === "goatplan:term:v1")))).toEqual(plannerBefore);
});

test("explicit application saves planned additions and repeated generation avoids duplicates", async ({ page }) => {
  await open(page);
  await generate(page);
  await addButton(page).click();
  await expect(nextPanel(page).getByRole("status")).toContainText("added to your plan");
  const after = await stored(page);
  expect(after.courses.length).toBeGreaterThan(0);
  expect(after.courses.every((course: { status: string; term: string }) => course.status === "planned" && course.term === "A Term 2027")).toBe(true);
  await expect(addButton(page)).toHaveCount(0);
  await expect(nextPanel(page).getByRole("button", { name: "Suggest courses" })).toBeFocused();
  await page.reload();
  expect(await stored(page)).toEqual(after);
  await page.getByRole("button", { name: "Plan ahead", exact: true }).click();
  await page.getByRole("button", { name: "Suggest next terms", exact: true }).click();
  await pickStart(page, "A Term 2027");
  await generate(page);
  await expect(nextPanel(page).getByRole("checkbox", { name: "Add CS 1101", exact: true })).toHaveCount(0);
});

test("keyboard opening, alternatives, and focus return work", async ({ page }) => {
  await open(page);
  await page.keyboard.press("Escape");
  await expect(nextPanel(page)).toHaveCount(0);
  const action = page.getByRole("button", { name: "Suggest next terms", exact: true });
  await expect(action).toBeFocused();
  await expect(async () => {
    if (await nextPanel(page).count() === 0) await action.press("Enter");
    await expect(nextPanel(page)).toHaveCount(1, { timeout: 500 });
  }).toPass();
  await expect(nextPanel(page).getByRole("heading", { name: "Suggest next terms", exact: true })).toBeFocused();
  await pickStart(page, "A Term 2027");
  await generate(page);
  const alternatives = nextPanel(page).locator("summary").filter({ hasText: "Other options" }).first();
  await alternatives.focus();
  await page.keyboard.press("Enter");
  await expect(nextPanel(page).getByRole("button", { name: "Keep MA 1021", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(action).toBeFocused();
});

test("failed published offerings require retry and never produce automatic additions", async ({ page }) => {
  let fail = true;
  await page.route("**/data/2027-C.json", (route) => fail ? route.fulfill({ status: 503 }) : route.fallback());
  await open(page);
  await pickStart(page, "C Term 2027");
  await nextPanel(page).getByRole("button", { name: "Suggest courses" }).click();
  await expect(nextPanel(page).getByRole("status")).toContainText("couldn’t be loaded", { timeout: 30_000 });
  await expect(nextPanel(page).getByRole("checkbox", { name: /^Add CS/ })).toHaveCount(0);
  fail = false;
  await generate(page);
  await expect(nextPanel(page).getByRole("button", { name: "Open in planner", exact: true })).toBeVisible();
});

test("project reservations and existing dated plans survive previews and application", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("goatplan:degree:projects", JSON.stringify({ "A Term 2027": "IQP" })));
  await page.route("**/data/catalog.json", (route) => route.fulfill({ json: { courses: catalog } }));
  const existing = savedCourse({ code: "CS 1101", credits: 3, term: "A Term 2027" }, true);
  await openDegree(page, { courses: [existing] });
  await page.getByRole("button", { name: "Plan ahead", exact: true }).click();
  await page.getByRole("button", { name: "Suggest next terms", exact: true }).click();
  await pickStart(page, "A Term 2027");
  await generate(page);
  await expect(nextPanel(page).getByText(/IQP reserves this term/)).toBeVisible();
  await expect(nextPanel(page).getByRole("checkbox", { name: /^Add / })).toHaveCount(0);
  expect((await stored(page)).courses).toEqual([existing]);
  expect(await page.evaluate(() => localStorage.getItem("goatplan:degree:projects"))).toBe(JSON.stringify({ "A Term 2027": "IQP" }));
});

test("changing history during offering loading discards the old response", async ({ page }) => {
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/data/2027-C.json", async (route) => { await held; await route.fallback(); });
  await open(page);
  await pickStart(page, "C Term 2027");
  await nextPanel(page).getByRole("button", { name: "Suggest courses" }).click();
  await expect(nextPanel(page).getByRole("status")).toContainText("Checking your sheet");
  await page.evaluate(() => {
    const key = "goatplan:history:v1";
    const history = JSON.parse(localStorage.getItem(key)!);
    history.courses.push({ code: "CS 1101", title: "Intro", credits: 3, status: "taken", apIb: false, source: "found" });
    localStorage.setItem(key, JSON.stringify(history));
    window.dispatchEvent(new StorageEvent("storage", { key }));
  });
  release();
  await expect(nextPanel(page).getByRole("status")).toContainText("settings changed", { timeout: 30_000 });
  await expect(addButton(page)).toHaveCount(0);
});

for (const width of [1440, 834, 375]) {
  for (const theme of ["light", "dark"]) {
    test(`preview layout at ${width}px in ${theme}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.addInitScript((value) => localStorage.setItem("goatplan:theme:v1", value), theme);
      await open(page);
      await generate(page);
      await expect(nextPanel(page).getByRole("heading", { name: "Suggest next terms", exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`recommendations-${width}-${theme}.png`), fullPage: true });
    });
  }
}
