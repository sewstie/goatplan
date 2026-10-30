import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import type { TermFile } from "../src/lib/data/types";
import type { Draft } from "../src/lib/store/types";
import { lectureProfessorTerm } from "../src/lib/store/testing/lectureProfessors";
import { coursePanelTerm } from "./fixtures/coursePanel";

const source: TermFile = JSON.parse(readFileSync(path.join(__dirname, "../public/data/2027-C.json"), "utf8"));
const key = "goatplan:draft:v1:2027-C";
const code = "AE 2410";
const details = (page: Page) => page.getByRole("complementary", { name: "Course details" });
const picker = (page: Page) => details(page).getByRole("combobox", { name: "Lecture professor" });
const settled = (page: Page) => expect(page.locator("[data-planner-solve-status]").last()).toHaveAttribute("data-planner-solve-status", "done", { timeout: 30_000 });
const draft = (page: Page): Promise<Draft> => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);

for (const state of ["04", "07", "24", "29"] as const) {
  test(`v2 course panel state ${state} at 1440`, async ({ page }) => {
    const data = coursePanelTerm(state);
    const code = data.courses[0].code;
    await page.addInitScript(() => localStorage.setItem("goatplan:tutorial:v1", "completed"));
    await open(page, {
      courses: state === "07" ? [code, "AE 2410", "AE 2210"] : [code],
      locks: state === "29" ? { [code]: ["DEMO 2001-B01"] } : {},
      professorByCourse: state === "07" ? { [code]: "Ye Lu" } : {},
      preferences: { startsAfter: state === "04" || state === "07" ? 540 : 0, onlyOpen: true,
        blocked: state === "04" || state === "07" ? [
          { day: "Tue", start: 840, end: 960, label: "Work" },
          { day: "Fri", start: 840, end: 960, label: "Work" },
        ] : [],
      },
    }, data);
    await page.setViewportSize({ width: 1440, height: 800 });
    if (state === "04") {
      await page.getByRole("searchbox").fill("a");
      await expect(page.getByRole("region", { name: "Search results" })).toBeVisible();
      await page.getByRole("searchbox").blur();
    }
    await expect(details(page).getByRole("heading", { level: 2, name: code })).toBeVisible();
    expect((await details(page).boundingBox())!.width).toBe(284);
    if (state === "29") {
      await expect(picker(page)).toHaveCount(0);
      await expect(details(page).getByRole("button", { name: "Unlock Lab B01", exact: true })).toBeVisible();
    } else {
      await expect(picker(page)).toBeVisible();
      const field = await picker(page).boundingBox();
      const sections = await details(page).getByRole("heading", { name: "Sections in this schedule" }).boundingBox();
      expect(field!.y + field!.height).toBeLessThan(sections!.y);
    }
    if (state === "24") {
      while (await details(page).getByRole("heading", { name: "Lecture L01", exact: true }).count() === 0) {
        await page.getByRole("button", { name: "Next schedule" }).click();
      }
      await expect(details(page).getByRole("link", { name: /in OSCAR/ }).first()).toBeVisible();
      await expect(details(page).getByText("Compatible", { exact: true })).toHaveCount(0);
      await expect(details(page).getByRole("button", { name: /^Lock Lab B0/ })).toBeVisible();
    }
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`course-panel-v2-${state}-1440.png`, { animations: "disabled" });
  });
}

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

async function chooseProfessor(page: Page, name: string) {
  await picker(page).click();
  await page.getByRole("option", { name: name || "Any professor", exact: true }).click();
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
  await expect(picker(page)).toHaveText("Any professor");
  await picker(page).click();
  await expect(page.getByRole("listbox").getByRole("option")).toHaveText(["Any professor", "Ye Lu", "Alex Smith", "Mark Richman"]);
  await page.keyboard.press("Escape");
  await expect(page.getByText("Schedule 1 of 4", { exact: true })).toBeVisible();
  await picker(page).focus();
  await expect(picker(page)).toBeFocused();
  await chooseProfessor(page, "Ye Lu");
  await settled(page);
  await expect(page.getByText("Schedule 1 of 3", { exact: true })).toBeVisible();
  const lectures: string[] = [];
  const labs: string[] = [];
  for (let index = 0; index < 3; index++) {
    lectures.push(await details(page).getByRole("heading", { name: /^Lecture CL/ }).innerText());
    labs.push(await details(page).getByRole("heading", { name: /^Lab CX/ }).innerText());
    await expect(details(page).getByRole("heading", { name: "Discussion CD01", exact: true })).toBeVisible();
    await expect(details(page).getByRole("article").filter({ hasText: "Discussion CD01" })).not.toContainText("Discussion Tutor");
    await expect(details(page).getByRole("heading", { name: /Lecture CL0[3-6]|Lab CX03/ })).toHaveCount(0);
    if (index < 2) await page.getByRole("button", { name: "Next schedule" }).click();
  }
  expect(lectures.sort()).toEqual(["Lecture CL01", "Lecture CL02", "Lecture CL02"]);
  expect(labs).toContain("Lab CX04");
  await screenshots(page, "lecture-only");

  while (await page.getByRole("button", { name: "Previous schedule" }).isEnabled()) {
    await page.getByRole("button", { name: "Previous schedule" }).click();
  }
  while (await details(page).getByRole("heading", { name: "Lecture CL02", exact: true }).count() === 0) {
    await page.getByRole("button", { name: "Next schedule" }).click();
  }
  const coTeachers = details(page).getByRole("article").filter({ hasText: "Lecture CL02" });
  await expect(coTeachers.getByRole("group", { name: "Alex Smith", exact: true })).toBeVisible();
  await expect(coTeachers.getByRole("group", { name: "ye lu", exact: true })).toBeVisible();

  await chooseProfessor(page, "");
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
  await details(page).getByRole("button", { name: "Choose Seminar S02", exact: true }).focus();
  await page.keyboard.press("Enter");
  await settled(page);
  await expect(details(page).getByRole("heading", { name: "Seminar S02", exact: true })).toBeVisible();
  await expect(picker(page)).toHaveCount(0);
  // Picking a seminar from the list locks it, like a lab.
  await expect(details(page).getByRole("button", { name: "Unlock Seminar S02", exact: true })).toBeVisible();
  await screenshots(page, "no-lectures");
});

test("a professor filters both lecture choices, survives reload and Any professor restores all results", async ({ page }) => {
  await open(page);
  await expect(picker(page)).toHaveText("Any professor");
  await picker(page).click();
  await expect(page.getByRole("listbox").getByRole("option").first()).toHaveText("Any professor");
  await page.keyboard.press("Escape");
  await expect(page.getByText("Schedule 1 of 3", { exact: true })).toBeVisible();
  await chooseProfessor(page, "Ye Lu");
  await settled(page);
  await expect(page.getByText("Schedule 1 of 2", { exact: true })).toBeVisible();
  await expect(details(page).getByRole("link", { name: /Rate My Professors/ })).toHaveAttribute("href", /q=Ye%20Lu$/);
  const shown: string[] = [];
  for (let index = 0; index < 2; index++) {
    shown.push(await details(page).getByRole("heading", { name: /^Lecture C0/ }).innerText());
    await expect(details(page).getByRole("group", { name: "Ye Lu", exact: true })).toBeVisible();
    await expect(details(page).getByRole("heading", { name: "Lecture C03" })).toHaveCount(0);
    if (index === 0) await page.getByRole("button", { name: "Next schedule" }).click();
  }
  expect(new Set(shown)).toEqual(new Set(["Lecture C01", "Lecture C02"]));
  expect((await draft(page)).professorByCourse).toEqual({ [code]: "Ye Lu" });
  await screenshots(page, "chosen");
  await page.reload();
  await settled(page);
  await expect(picker(page)).toHaveText("Ye Lu");
  await expect(page.getByText("Schedule 1 of 2", { exact: true })).toBeVisible();
  await chooseProfessor(page, "");
  await settled(page);
  await expect(page.getByText("Schedule 1 of 3", { exact: true })).toBeVisible();
  expect((await draft(page)).professorByCourse[code]).toBeNull();
});

for (const recovery of ["clear professor", "unlock lecture"] as const) {
  test(`an incompatible lecture lock survives reload and recovers through ${recovery}`, async ({ page }) => {
    const preferences = { startsAfter: 540, blocked: [{ day: "Fri" as const, start: 840, end: 960, label: "Work" }], onlyOpen: true };
    await open(page, { preferences });
    for (let index = 0; index < 3 && await details(page).getByRole("heading", { name: "Lecture C03", exact: true }).count() === 0; index++) {
      await page.getByRole("button", { name: "Next schedule" }).click();
    }
    await details(page).getByRole("button", { name: "Lock Lecture C03", exact: true }).click();
    await settled(page);
    await chooseProfessor(page, "Ye Lu");
    await settled(page);
    await expect(page.getByText("0 schedules fit", { exact: true })).toBeVisible();
    await expect(details(page).getByRole("heading", { name: "Your professor choice conflicts with your locks" })).toBeVisible();
    await expect(details(page).getByRole("button", { name: "Unlock Lecture C03", exact: true })).toBeVisible();
    await expect(picker(page)).toHaveText("Ye Lu");
    expect((await draft(page)).locks).toEqual({ [code]: [`${code}-C03`] });
    await screenshots(page, `lock-conflict-${recovery}`);

    await page.reload();
    await settled(page);
    await expect(page.getByText("0 schedules fit", { exact: true })).toBeVisible();
    await expect(picker(page)).toHaveText("Ye Lu");
    await expect(details(page).getByRole("button", { name: "Unlock Lecture C03", exact: true })).toBeVisible();
    if (recovery === "clear professor") {
      await picker(page).focus();
      await chooseProfessor(page, "");
    } else {
      await details(page).getByRole("button", { name: "Unlock Lecture C03", exact: true }).focus();
      await page.keyboard.press("Enter");
    }
    await settled(page);
    const stored = await draft(page);
    expect(stored.preferences).toEqual(preferences);
    expect(stored.locks).toEqual(recovery === "clear professor" ? { [code]: [`${code}-C03`] } : {});
    expect(stored.professorByCourse[code]).toBe(recovery === "clear professor" ? null : "Ye Lu");
    await expect(page.getByText(recovery === "clear professor" ? "Schedule 1 of 1" : "Schedule 1 of 2", { exact: true })).toBeVisible();
    const lectures = recovery === "clear professor" ? ["C03"] : ["C01", "C02"];
    const shown: string[] = [];
    for (let index = 0; index < lectures.length; index++) {
      shown.push(await details(page).getByRole("heading", { name: /^Lecture C/ }).innerText());
      if (index + 1 < lectures.length) await page.getByRole("button", { name: "Next schedule" }).click();
    }
    expect(shown.sort()).toEqual(lectures.map((lecture) => `Lecture ${lecture}`));
    await screenshots(page, `lock-recovered-${recovery}`);
  });
}

for (const hasLectures of [true, false]) {
  test(`opening a saved plan with an unavailable professor stays restricted, with lectures: ${hasLectures}`, async ({ page }) => {
    const data = termData();
    const course = data.courses.find((course) => course.code === code)!;
    if (!hasLectures) for (const section of course.sections) section.type = "seminar";
    const preferences = { startsAfter: 600, blocked: [{ day: "Fri" as const, start: 840, end: 960, label: "Work" }], onlyOpen: false };
    const locks = { [code]: [`${code}-C03`] };
    const saved = {
      version: 1, id: "unavailable-professor", name: "Unavailable professor", termId: "2027-C", term: data.term,
      savedAt: "2026-10-21T12:00:00Z", courses: [code], locks, preferences,
      professorByCourse: { [code]: "Former Professor" }, sortPreset: "fewestGaps",
      schedule: [{ code, title: course.title, sections: [{ ...course.sections[2], instructors: ["Former Professor"] }] }],
    };
    await page.addInitScript((saved) => {
      localStorage.setItem("goatplan:plans:v1:plan:unavailable-professor", JSON.stringify(saved));
    }, saved);
    await open(page, {}, data);
    await expect(page.getByText("Schedule 1 of 3", { exact: true })).toBeVisible();
    await page.goto("/plans");
    await page.getByRole("button", { name: "Open in planner Unavailable professor" }).click();
    await page.getByRole("dialog", { name: "Open “Unavailable professor”?" }).getByRole("button", { name: "Open plan" }).click();
    await expect(page).toHaveURL(/\/$/);
    await settled(page);
    await expect(page.getByText("0 schedules fit", { exact: true })).toBeVisible();
    await expect(details(page).getByRole("heading", { name: "Your selected professor is unavailable" })).toBeVisible();
    await expect(picker(page)).toHaveText("Former Professor");
    await expect(page.locator("[data-block]")).toHaveCount(0);
    expect(await draft(page)).toMatchObject({ locks, preferences, professorByCourse: saved.professorByCourse, sortPreset: "fewestGaps" });
    await screenshots(page, `unavailable-${hasLectures}`);
    await page.reload();
    await settled(page);
    await expect(page.getByText("0 schedules fit", { exact: true })).toBeVisible();
    await expect(picker(page)).toHaveText("Former Professor");
    await picker(page).focus();
    await chooseProfessor(page, "");
    await settled(page);
    await expect(page.getByText("Schedule 1 of 1", { exact: true })).toBeVisible();
    await expect(details(page).getByRole("heading", { name: `${hasLectures ? "Lecture" : "Seminar"} C03`, exact: true })).toBeVisible();
    await expect(page.locator("[data-block]")).toHaveCount(1);
    expect(await draft(page)).toMatchObject({ locks, preferences, professorByCourse: { [code]: null }, sortPreset: "fewestGaps" });
    await screenshots(page, `unavailable-recovered-${hasLectures}`);
  });
}

test("compatible lab and discussion locks hold under a lecture professor, hide their instructors, and only an explicit unlock changes them", async ({ page }) => {
  const courseCode = "AE 2320";
  const preferences = { startsAfter: 540, blocked: [{ day: "Fri" as const, start: 840, end: 960 }], onlyOpen: true };
  const locks = { [courseCode]: [`${courseCode}-CX01`, `${courseCode}-CD01`] };
  await open(page, { courses: [courseCode], preferences, locks }, lectureProfessorTerm());
  await chooseProfessor(page, "Ye Lu");
  await settled(page);
  await expect(page.getByText("Schedule 1 of 2", { exact: true })).toBeVisible();
  for (let index = 0; index < 2; index++) {
    await expect(details(page).getByRole("button", { name: "Unlock Lab CX01", exact: true })).toBeVisible();
    await expect(details(page).getByRole("article").filter({ hasText: "Lab CX01" })).not.toContainText("Lab Tutor");
    await expect(details(page).getByRole("button", { name: "Unlock Discussion CD01", exact: true })).toBeVisible();
    await expect(details(page).getByRole("article").filter({ hasText: "Discussion CD01" })).not.toContainText("Discussion Tutor");
    if (index === 0) await page.getByRole("button", { name: "Next schedule" }).click();
  }
  expect((await draft(page)).locks).toEqual(locks);
  await chooseProfessor(page, "Mark Richman");
  await settled(page);
  await expect(page.getByText("0 schedules fit", { exact: true })).toBeVisible();
  expect((await draft(page)).locks).toEqual(locks);
  await details(page).getByRole("button", { name: "Unlock Lab CX01", exact: true }).focus();
  await page.keyboard.press("Enter");
  await settled(page);
  await expect(page.getByText("Schedule 1 of 2", { exact: true })).toBeVisible();
  for (let index = 0; index < 2; index++) {
    await expect(details(page).getByRole("heading", { name: "Lab CX03", exact: true })).toBeVisible();
    await expect(details(page).getByRole("button", { name: "Unlock Discussion CD01", exact: true })).toBeVisible();
    await expect(details(page).getByRole("article").filter({ hasText: /Lecture CL0[34]/ })).toContainText("Mark Richman");
    if (index === 0) await page.getByRole("button", { name: "Next schedule" }).click();
  }
  expect(await draft(page)).toMatchObject({ preferences, locks: { [courseCode]: [`${courseCode}-CD01`] }, professorByCourse: { [courseCode]: "Mark Richman" } });
  await screenshots(page, "lab-recovered");
});

test("when both of a professor's lectures clash, clearAnyOf offers a counted fix and restores the schedule", async ({ page }) => {
  await open(page, { courses: [code, "AE 2210"] });
  await expect(page.getByText("Schedule 1 of 1", { exact: true })).toBeVisible();
  await chooseProfessor(page, "Ye Lu");
  await settled(page);
  await expect(page.getByText("0 schedules fit", { exact: true })).toBeVisible();
  const fix = details(page).getByRole("button", { name: /^Allow any professor for AE 2410/ });
  await expect(fix).toContainText("1 schedule fits");
  await expect(picker(page)).toHaveText("Ye Lu");
  await screenshots(page, "clash");
  await fix.focus();
  await page.keyboard.press("Enter");
  await settled(page);
  expect((await draft(page)).professorByCourse[code]).toBeNull();
  await expect(page.getByText("Schedule 1 of 1", { exact: true })).toBeVisible();
  await expect(details(page).getByRole("heading", { name: "Lecture C03" })).toBeVisible();
});
