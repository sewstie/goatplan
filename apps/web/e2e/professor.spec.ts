import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import type { TermFile } from "../src/lib/data/types";
import type { Draft } from "../src/lib/store/types";
import { lectureProfessorTerm } from "../src/lib/store/testing/lectureProfessors";

const source: TermFile = JSON.parse(readFileSync(path.join(__dirname, "../public/data/2027-C.json"), "utf8"));
const key = "goatplan:draft:v1:2027-C";
const code = "AE 2410";
const details = (page: Page) => page.getByRole("complementary", { name: "Course details" });
const picker = (page: Page) => details(page).getByRole("combobox", { name: "Professor" });
const settled = (page: Page) => expect(page.locator("[data-planner-solve-status]").last()).toHaveAttribute("data-planner-solve-status", "done", { timeout: 30_000 });
const draft = (page: Page): Promise<Draft> => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);

function termData() {
  const term = structuredClone(source);
  const course = term.courses.find((course) => course.code === code)!;
  const template = course.sections[0];
  course.sections = [540, 600, 660].map((start, index) => ({
    ...template, id: `${code}-C0${index + 1}`, code: `C0${index + 1}`,
    instructors: [index < 2 ? "Ye Lu" : "Mark Richman"],
    status: "open", capacity: 40, enrolled: 10,
    meetings: [{ days: ["Mon"], start, end: start + 50, location: "Unity Hall 400" }],
  }));
  course.options = course.sections.map((section) => [section.id]);
  const other = term.courses.find((course) => course.code === "AE 2210")!;
  other.sections = [{ ...template, id: "AE 2210-C01", code: "C01", status: "open", capacity: 40, enrolled: 10,
    meetings: [{ days: ["Mon"], start: 540, end: 650, location: "Higgins Labs 116" }] }];
  other.options = [["AE 2210-C01"]];
  term.courses = [course, other];
  return term;
}

async function open(page: Page, changes: Partial<Draft> = {}, data = termData()) {
  const plan: Draft = {
    courses: [code], preferences: { startsAfter: 0, blocked: [], onlyOpen: true },
    locks: {}, professorByCourse: {}, sortPreset: "fewestEarly", alternatives: {}, ...changes,
  };
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/data/2027-C.json", (route) => route.fulfill({ json: data }));
  await page.addInitScript(({ key, plan }) => {
    if (sessionStorage.getItem("professor-seeded")) return;
    sessionStorage.setItem("professor-seeded", "1");
    localStorage.setItem("goatplan:term:v1", "2027-C");
    localStorage.setItem(key, JSON.stringify({ version: 1, ...plan }));
  }, { key, plan });
  await page.goto("/");
  await settled(page);
}

async function screenshots(page: Page, name: string) {
  for (const width of [1440, 834]) {
    await page.setViewportSize({ width, height: width === 834 ? 1194 : 900 });
    await page.screenshot({ path: `e2e/screenshots/professor-${name}-${width}.png`, fullPage: true, animations: "disabled" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
}

test("lecture filtering keeps linked labs and discussions, supports alternatives, and clears within availability", async ({ page }) => {
  await open(page, {
    courses: ["AE 2320"],
    preferences: { startsAfter: 540, blocked: [{ day: "Mon", start: 660, end: 710 }], onlyOpen: true },
  }, lectureProfessorTerm());
  await expect(picker(page)).toHaveValue("");
  await expect(picker(page).getByRole("option")).toHaveText(["Any professor", "Ye Lu", "Alex Smith", "Mark Richman"]);
  await expect(page.getByText("Schedule 1 of 4", { exact: true })).toBeVisible();
  await picker(page).focus();
  await expect(picker(page)).toBeFocused();
  await picker(page).selectOption("Ye Lu");
  await settled(page);
  await expect(page.getByText("Schedule 1 of 3", { exact: true })).toBeVisible();
  const lectures: string[] = [];
  const labs: string[] = [];
  for (let index = 0; index < 3; index++) {
    lectures.push(await details(page).getByRole("heading", { name: /^Lecture CL/ }).innerText());
    labs.push(await details(page).getByRole("heading", { name: /^Lab CX/ }).innerText());
    await expect(details(page).getByRole("heading", { name: "Discussion CD01", exact: true })).toBeVisible();
    await expect(details(page).getByRole("article").filter({ hasText: "Discussion CD01" })).toContainText("Discussion Tutor");
    await expect(details(page).getByRole("heading", { name: /Lecture CL0[3-6]|Lab CX03/ })).toHaveCount(0);
    if (index < 2) await page.getByRole("button", { name: "Next schedule" }).click();
  }
  expect(lectures.sort()).toEqual(["Lecture CL01", "Lecture CL02", "Lecture CL02"]);
  expect(labs).toContain("Lab CX04");
  await screenshots(page, "lecture-only");

  while (await page.getByRole("button", { name: "Previous schedule" }).isEnabled()) {
    await page.getByRole("button", { name: "Previous schedule" }).click();
  }
  for (let index = 0; index < 2 && await details(page).getByRole("heading", { name: "Lecture CL01", exact: true }).count() === 0; index++) {
    await page.getByRole("button", { name: "Next schedule" }).click();
  }
  await expect(details(page).getByRole("heading", { name: "Lecture CL01", exact: true })).toBeVisible();
  const currentLab = await details(page).getByRole("heading", { name: /^Lab CX/ }).innerText();
  const otherLab = currentLab === "Lab CX01" ? "CX02" : "CX01";
  await details(page).getByRole("button", { name: "View other section choices" }).click();
  const sheet = page.getByRole("dialog", { name: "Choose a section" });
  await expect(sheet.getByRole("radio", { name: /CL03|CL04|CL05|CL06|CX03/ })).toHaveCount(0);
  await screenshots(page, "lecture-choices");
  const sameTimeChoice = sheet.getByRole("radio", { name: new RegExp(`CL01.*${otherLab}`) });
  await sameTimeChoice.focus();
  await page.keyboard.press("Space");
  await expect(sameTimeChoice).toBeChecked();
  await sheet.getByRole("button", { name: `Pick CL01 · ${otherLab}`, exact: true }).click();
  await expect(details(page).getByRole("heading", { name: `Lab ${otherLab}`, exact: true })).toBeVisible();
  await expect(details(page).getByRole("heading", { name: "Lecture CL01", exact: true })).toBeVisible();

  await details(page).getByRole("button", { name: "View other section choices" }).click();
  await sheet.getByRole("radio", { name: /CL02.*CX04/ }).focus();
  await page.keyboard.press("Space");
  await sheet.getByRole("button", { name: "Pick CL02 · CX04", exact: true }).click();
  await expect(details(page).getByRole("heading", { name: "Lab CX04", exact: true })).toBeVisible();
  await expect(details(page).getByRole("article").filter({ hasText: "Lecture CL02" })).toContainText("Alex Smith, ye lu");

  await picker(page).selectOption("");
  await settled(page);
  await expect(page.getByText("Schedule 1 of 4", { exact: true })).toBeVisible();
  const cleared: string[] = [];
  for (let index = 0; index < 4; index++) {
    cleared.push(await details(page).getByRole("heading", { name: /^Lecture CL/ }).innerText());
    if (index < 3) await page.getByRole("button", { name: "Next schedule" }).click();
  }
  expect(cleared.sort()).toEqual(["Lecture CL01", "Lecture CL02", "Lecture CL02", "Lecture CL04"]);
  const row = page.getByRole("group", { name: "Preferences" });
  await expect(row.getByRole("combobox", { name: "Starts after" })).toHaveValue("540");
  await expect(row.getByRole("switch", { name: "Only open sections" })).toBeChecked();
  await expect(row.getByRole("button", { name: /Remove blocked time Mon/ })).toBeVisible();
});

test("a course without lectures omits the professor filter and retains individual section choices", async ({ page }) => {
  await open(page, { courses: ["AE 2410"] }, lectureProfessorTerm());
  await expect(picker(page)).toHaveCount(0);
  await expect(details(page).getByRole("heading", { name: "Seminar S01", exact: true })).toBeVisible();
  await details(page).getByRole("button", { name: "View other seminar choices" }).click();
  const sheet = page.getByRole("dialog", { name: "Choose a seminar" });
  await sheet.getByRole("button", { name: "Pick S02", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(details(page).getByRole("heading", { name: "Seminar S02", exact: true })).toBeVisible();
  await expect(picker(page)).toHaveCount(0);
  await details(page).getByRole("button", { name: "Lock Seminar S02", exact: true }).click();
  await settled(page);
  await expect(details(page).getByRole("button", { name: "Unlock Seminar S02", exact: true })).toBeVisible();
  await screenshots(page, "no-lectures");
});

test("a professor filters both lecture choices, survives reload and Any professor restores all results", async ({ page }) => {
  await open(page);
  await expect(picker(page)).toHaveValue("");
  await expect(picker(page).getByRole("option").first()).toHaveText("Any professor");
  await expect(page.getByText("Schedule 1 of 3", { exact: true })).toBeVisible();
  await picker(page).selectOption("Ye Lu");
  await settled(page);
  await expect(page.getByText("Schedule 1 of 2", { exact: true })).toBeVisible();
  await expect(details(page).getByRole("link", { name: /Rate My Professors/ })).toHaveAttribute("href", /q=Ye%20Lu$/);
  const shown: string[] = [];
  for (let index = 0; index < 2; index++) {
    shown.push(await details(page).getByRole("heading", { name: /^Lecture C0/ }).innerText());
    await expect(details(page).getByText("Ye Lu", { exact: true }).first()).toBeVisible();
    await expect(details(page).getByRole("heading", { name: "Lecture C03" })).toHaveCount(0);
    if (index === 0) await page.getByRole("button", { name: "Next schedule" }).click();
  }
  expect(new Set(shown)).toEqual(new Set(["Lecture C01", "Lecture C02"]));
  expect((await draft(page)).professorByCourse).toEqual({ [code]: "Ye Lu" });
  await screenshots(page, "chosen");
  await page.reload();
  await settled(page);
  await expect(picker(page)).toHaveValue("Ye Lu");
  await expect(page.getByText("Schedule 1 of 2", { exact: true })).toBeVisible();
  await picker(page).selectOption("");
  await settled(page);
  await expect(page.getByText("Schedule 1 of 3", { exact: true })).toBeVisible();
  expect((await draft(page)).professorByCourse[code]).toBeNull();
});

test("choosing another professor removes an incompatible lock and says which section was unlocked", async ({ page }) => {
  await open(page, { locks: { [code]: [`${code}-C03`] } });
  await expect(details(page).getByRole("heading", { name: "Lecture C03" })).toBeVisible();
  await picker(page).selectOption("Ye Lu");
  await settled(page);
  expect((await draft(page)).locks).toEqual({});
  await expect(details(page).getByRole("status")).toHaveText("Unlocked C03 for this professor.");
  await expect(page.getByText("Schedule 1 of 2", { exact: true })).toBeVisible();
});

test("when both of a professor's lectures clash, clearAnyOf offers a counted fix and restores the schedule", async ({ page }) => {
  await open(page, { courses: [code, "AE 2210"] });
  await expect(page.getByText("Schedule 1 of 1", { exact: true })).toBeVisible();
  await picker(page).selectOption("Ye Lu");
  await settled(page);
  await expect(page.getByText("0 schedules fit", { exact: true })).toBeVisible();
  const fix = details(page).getByRole("button", { name: /^Allow any professor for AE 2410/ });
  await expect(fix).toContainText("1 schedule fits");
  await expect(picker(page)).toHaveValue("Ye Lu");
  await screenshots(page, "clash");
  await fix.focus();
  await page.keyboard.press("Enter");
  await settled(page);
  expect((await draft(page)).professorByCourse[code]).toBeNull();
  await expect(page.getByText("Schedule 1 of 1", { exact: true })).toBeVisible();
  await expect(details(page).getByRole("heading", { name: "Lecture C03" })).toBeVisible();
});
