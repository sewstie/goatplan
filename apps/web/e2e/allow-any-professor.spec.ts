import { expect, frozenTerm, test } from "./fixtures/test";
import type { Page } from "@playwright/test";
import type { TermFile } from "../src/lib/data/types";
import type { Draft } from "../src/lib/store/types";

const source: TermFile = frozenTerm("2027-C");
const key = "goatplan:draft:v1:2027-C";
const details = (page: Page) => page.getByRole("complementary", { name: "Course details" });
const settled = (page: Page) => expect(page.locator("[data-planner-solve-status]").last()).toHaveAttribute("data-planner-solve-status", "done", { timeout: 30_000 });
const draft = (page: Page): Promise<Draft> => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);

/**
 * Build term data for the allow-any-professor tests.
 *
 * PH 1110: three lectures — Alpha at 9 AM, Beta at 11 AM, Gamma at 12 PM — plus a lab at 3 PM.
 * CS 2022: one lecture at 12 PM (clashes with PH CL03).
 * MA 1024: one lecture at 2 PM (no clash with anything).
 *
 * The key relationships:
 * - With professor=Alpha and startsAfter=660, all PH options are removed (Alpha's only lecture
 *   is at 540). clearAnyOf alone restores Beta (660) and Gamma (720). Schedule fits → plain fix.
 * - With professor=Alpha and startsAfter=720, clearAnyOf alone leaves only Gamma (720)
 *   which clashes with CS (720). Relaxing startsAfter to 660 adds Beta (660). Schedule fits
 *   → combined fix with startsAfter=660 ("change to 11:00 AM").
 */
function termData(): TermFile {
  const term = structuredClone(source);
  const template = term.courses[0].sections[0];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

  const section = (id: string, code: string, type: "lecture" | "lab", instructor: string, start: number) => ({
    ...template, id, code, type,
    instructors: [instructor], status: "open" as const, capacity: 40, enrolled: 10,
    meetings: [{ days: [...days], start, end: start + 50, location: "Unity Hall 400" }],
  });

  const ph: TermFile["courses"][0] = {
    code: "PH 1110", subject: "PH", title: "Introductory Physics I",
    credits: 3, level: "Undergraduate", description: "",
    sections: [
      section("PH 1110-CL01", "CL01", "lecture", "Prof Alpha", 540),
      section("PH 1110-CL02", "CL02", "lecture", "Prof Beta", 660),
      section("PH 1110-CL03", "CL03", "lecture", "Prof Gamma", 720),
      section("PH 1110-CX01", "CX01", "lab", "Lab TA", 900),
    ],
    options: [
      ["PH 1110-CL01", "PH 1110-CX01"],
      ["PH 1110-CL02", "PH 1110-CX01"],
      ["PH 1110-CL03", "PH 1110-CX01"],
    ],
  };

  const cs: TermFile["courses"][0] = {
    code: "CS 2022", subject: "CS", title: "Discrete Mathematics",
    credits: 3, level: "Undergraduate", description: "",
    sections: [section("CS 2022-C01", "C01", "lecture", "Dr CS", 720)],
    options: [["CS 2022-C01"]],
  };

  const ma: TermFile["courses"][0] = {
    code: "MA 1024", subject: "MA", title: "Calculus IV",
    credits: 3, level: "Undergraduate", description: "",
    sections: [section("MA 1024-C01", "C01", "lecture", "Dr MA", 840)],
    options: [["MA 1024-C01"]],
  };

  term.courses = [ph, cs, ma];
  return term;
}

async function open(page: Page, changes: Partial<Draft> = {}, data = termData()) {
  const plan: Draft = {
    courses: ["PH 1110", "CS 2022", "MA 1024"],
    preferences: { startsAfter: 0, blocked: [], onlyOpen: true },
    locks: {}, professorByCourse: {}, sortPreset: "fewestEarly", alternatives: {},
    ...changes,
  };
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/data/2027-C.json", (route) => route.fulfill({ json: data }));
  await page.addInitScript(({ key, plan }) => {
    if (sessionStorage.getItem("anyprof-seeded")) return;
    sessionStorage.setItem("anyprof-seeded", "1");
    localStorage.setItem("goatplan:term:v1", "2027-C");
    localStorage.setItem(key, JSON.stringify({ version: 1, ...plan }));
  }, { key, plan });
  await page.goto("/");
  await settled(page);
}

async function screenshots(page: Page, name: string) {
  await page.mouse.move(0, 0);
  for (const width of [1440, 834]) {
    await page.setViewportSize({ width, height: width === 834 ? 1194 : 900 });
    await page.screenshot({ path: `e2e/screenshots/allow-any-professor-${name}-${width}.png`, fullPage: true, animations: "disabled" });
  }
}

// 11 AM case (plain fix): startsAfter=660, professor=Alpha.
// Alpha's only lecture CL01 (540) is excluded by startsAfter. PH empty.
// clearAnyOf alone restores Beta CL02 (660) and Gamma CL03 (720). CL02 + CS (720) + MA (840) fit.
for (const [label, action] of [["by click", "click"], ["by keyboard", "keyboard"]] as const) {
  test(`11 AM (plain fix): Allow any professor for PH 1110 applied ${label}`, async ({ page }) => {
    await open(page, {
      preferences: { startsAfter: 660, blocked: [], onlyOpen: true },
      professorByCourse: { "PH 1110": "Prof Alpha" },
    });

    await expect(page.getByText("0 schedules fit", { exact: true })).toBeVisible();
    const fix = details(page).getByRole("button", { name: /^Allow any professor for PH 1110/ });
    await expect(fix).toContainText("Allow any professor for PH 1110");
    await expect(fix).not.toContainText("and change to");
    await expect(fix).toContainText(/\d+ schedule/);
    if (action === "click") await screenshots(page, "11am-plain");

    if (action === "click") {
      await fix.click();
    } else {
      await fix.focus();
      await page.keyboard.press("Enter");
    }
    await settled(page);

    const stored = await draft(page);
    expect(stored.professorByCourse["PH 1110"]).toBeNull();
    expect(stored.preferences.startsAfter).toBe(660);
    await expect(page.getByText(/Schedule 1 of \d/, { exact: true })).toBeVisible();
    await expect(details(page).getByText("Needs attention")).toHaveCount(0);
  });
}

// 12 PM case (combined fix): startsAfter=720, professor=Alpha.
// clearAnyOf alone leaves only CL03 (720) which clashes with CS (720). No schedule.
// Relaxing startsAfter to 660 adds CL02 (660). CL02 + CS (720) + MA (840) fit.
// Combined fix: "Allow any professor for PH 1110 and change to 11:00 AM".
for (const [label, action] of [["by click", "click"], ["by keyboard", "keyboard"]] as const) {
  test(`12 PM (combined fix): Allow any professor and change to 11:00 AM applied ${label}`, async ({ page }) => {
    await open(page, {
      preferences: { startsAfter: 720, blocked: [], onlyOpen: true },
      professorByCourse: { "PH 1110": "Prof Alpha" },
    });

    await expect(page.getByText("0 schedules fit", { exact: true })).toBeVisible();
    const fix = details(page).getByRole("button", { name: /^Allow any professor for PH 1110 and change to/ });
    await expect(fix).toContainText("Allow any professor for PH 1110 and change to 11:00 AM");
    await expect(fix).toContainText(/\d+ schedule/);
    if (action === "click") await screenshots(page, "12pm-combined");

    if (action === "click") {
      await fix.click();
    } else {
      await fix.focus();
      await page.keyboard.press("Enter");
    }
    await settled(page);

    const stored = await draft(page);
    expect(stored.professorByCourse["PH 1110"]).toBeNull();
    expect(stored.preferences.startsAfter).toBe(660);
    await expect(page.getByText(/Schedule 1 of \d/, { exact: true })).toBeVisible();
    await expect(details(page).getByText("Needs attention")).toHaveCount(0);
    await expect(page.getByRole("combobox", { name: "Starts after" })).toHaveValue("660");
  });
}

// Unavailable professor: professor has no lectures at all.
// Client-side generates the clearAnyOf fix.
for (const [label, action] of [["by click", "click"], ["by keyboard", "keyboard"]] as const) {
  test(`unavailable professor: Allow any professor applied ${label}`, async ({ page }) => {
    await open(page, {
      preferences: { startsAfter: 0, blocked: [], onlyOpen: true },
      professorByCourse: { "PH 1110": "Former Professor" },
    });

    await expect(page.getByText("0 schedules fit", { exact: true })).toBeVisible();
    await expect(details(page).getByRole("heading", { name: "Your selected professor is unavailable" })).toBeVisible();
    const fix = details(page).getByRole("button", { name: /^Allow any professor for PH 1110/ });
    await expect(fix).toContainText("Allow any professor for PH 1110");
    await expect(fix).not.toContainText("and change to");
    await expect(fix).toContainText(/\d+ schedule/);
    if (action === "click") await screenshots(page, "unavailable");

    if (action === "click") {
      await fix.click();
    } else {
      await fix.focus();
      await page.keyboard.press("Enter");
    }
    await settled(page);

    const stored = await draft(page);
    expect(stored.professorByCourse["PH 1110"]).toBeNull();
    await expect(page.getByText(/Schedule 1 of \d/, { exact: true })).toBeVisible();
    await expect(details(page).getByText("Needs attention")).toHaveCount(0);
  });
}
