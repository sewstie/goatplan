import { expect, frozenTerm, test } from "./fixtures/test";
import type { Page } from "@playwright/test";
import type { TermFile } from "../src/lib/data/types";
import type { Draft } from "../src/lib/store/types";
import type { WorkerReply, WorkerRequest } from "../src/lib/engine/protocol";

const source: TermFile = frozenTerm("2027-C");
const key = "goatplan:draft:v1:2027-C";
const regular: Draft = {
  professorByCourse: {},
  courses: ["AE 2320", "AE 2410", "AE 2210"],
  preferences: { startsAfter: 540, blocked: [{ day: "Tue", start: 840, end: 960, label: "Work" }, { day: "Fri", start: 840, end: 960, label: "Work" }], onlyOpen: true },
  locks: { "AE 2320": ["AE 2320-CX02"] }, sortPreset: "fewestEarly", alternatives: {},
};
const details = (page: Page) => page.getByRole("complementary", { name: "Course details" });
const calendar = (page: Page) => page.getByRole("region", { name: "Weekly schedule" });
const settled = (page: Page) => expect(page.locator("[data-planner-solve-status]").last()).toHaveAttribute("data-planner-solve-status", "done", { timeout: 30_000 });
const draft = (page: Page): Promise<Draft> => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);

function data() {
  const term = structuredClone(source);
  for (const course of term.courses.filter((item) => [...regular.courses, "AB 1533"].includes(item.code))) {
    for (const section of course.sections) Object.assign(section, { status: "open", capacity: 40, enrolled: 10 });
  }
  return term;
}

async function open(page: Page, plan: Draft = regular, term = data(), route = true, wait = true) {
  await page.setViewportSize({ width: 1440, height: 900 });
  if (route) await page.route("**/data/2027-C.json", (request) => request.fulfill({ json: term }));
  await page.addInitScript(({ key, plan }) => {
    localStorage.setItem("goatplan:term:v1", "2027-C");
    localStorage.setItem(key, JSON.stringify({ version: 1, ...plan }));
  }, { key, plan });
  await page.goto("/");
  if (wait) await expect(page.locator("[data-planner-solve-status]").last()).toHaveAttribute("data-planner-solve-status", /done|error/, { timeout: 30_000 });
}

async function screenshots(page: Page, name: string, widths = [1440, 834]) {
  await page.mouse.move(0, 0);
  for (const width of widths) {
    await page.setViewportSize({ width, height: width === 834 ? 1194 : 900 });
    await page.screenshot({ path: `e2e/screenshots/diagnosis-${name}-${width}.png`, fullPage: true, animations: "disabled" });
  }
}

async function selectCourse(page: Page, code: string) {
  await page.getByRole("region", { name: "Your courses" }).getByRole("button", { name: new RegExp(`^${code}`) }).click();
}

type MockReply = Omit<Extract<WorkerReply, { type: "result" }>, "id"> | Omit<Extract<WorkerReply, { type: "failure" }>, "id">;

async function firstSolve(page: Page, reply: MockReply | null, delay = 0) {
  await page.addInitScript(({ reply, delay }) => {
    const Original = window.Worker;
    window.Worker = class extends Original {
      private intercepted = false;
      postMessage(message: WorkerRequest, options: Transferable[] | StructuredSerializeOptions = []) {
        const transfer = Array.isArray(options) ? options : options.transfer ?? [];
        if (message.kind !== "solve" || this.intercepted) return super.postMessage(message, transfer);
        this.intercepted = true;
        setTimeout(() => {
          if (reply) this.dispatchEvent(new MessageEvent("message", { data: { ...reply, id: message.id } }));
          else super.postMessage(message, transfer);
        }, delay);
      }
    };
  }, { reply, delay });
}

for (const [label, start] of [["Change to 9:00 AM", 540], ["Clear start restriction", 0]] as const) {
  test(`start-time diagnosis uses state 35 wording and ${label} works by keyboard`, async ({ page }) => {
    await open(page, { ...regular, preferences: { ...regular.preferences, startsAfter: 600 } });
    await expect(details(page).getByRole("heading", { name: "Your start time excludes this lecture" })).toBeVisible();
    await expect(details(page)).toContainText("AE 2320’s only lecture starts at 9:00 AM, but Starts after is set to 10:00 AM.");
    await expect(page.getByText("Your start-time preference excludes AE 2320.", { exact: true })).toBeVisible();
    await expect(calendar(page).locator('[data-preview="true"]').filter({ hasText: "CL01" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Save schedule" })).toBeDisabled();
    await expect(details(page).getByRole("button", { name: /^Remove AE 2320/ })).toBeVisible();
    const fix = details(page).getByRole("button", { name: new RegExp(`^${label}`) });
    await expect(fix).toContainText(/\d+ schedule/);
    if (start === 540) await screenshots(page, "start-time", [1440]);
    await fix.focus();
    await page.keyboard.press("Enter");
    await settled(page);
    expect(await draft(page)).toMatchObject({ ...regular, preferences: { ...regular.preferences, startsAfter: start } });
    await expect(page.getByRole("combobox", { name: "Starts after" })).toHaveValue(String(start));
    await expect(page.getByText("Schedule 1 of 1", { exact: true })).toBeVisible();
    await expect(details(page).getByText("Needs attention")).toHaveCount(0);
  });
}

test("a full locked lab is explained, previewed, and unlocked through a fix", async ({ page }) => {
  const term = data();
  Object.assign(term.courses.find((course) => course.code === "AE 2320")!.sections.find((section) => section.code === "CX01")!, { status: "closed", enrolled: 40 });
  await open(page, { ...regular, locks: { "AE 2320": ["AE 2320-CX01"] } }, term);
  await expect(details(page).getByRole("heading", { name: "This lock leaves no options" })).toBeVisible();
  await expect(details(page)).toContainText("Locking CX01 leaves no options because it’s full.");
  await expect(calendar(page).locator('[data-preview="true"]').filter({ hasText: "CX01" })).toHaveClass(/bg-clash-surface/);
  await screenshots(page, "locked-full");
  await details(page).getByRole("button", { name: /^Unlock CX01/ }).click();
  await settled(page);
  expect((await draft(page)).locks).toEqual({});
  await expect(page.getByRole("button", { name: "Save schedule" })).toBeEnabled();
});

test("all-full diagnosis offers the engine's counted fix", async ({ page }) => {
  const term = data();
  for (const section of term.courses.find((course) => course.code === "AE 2410")!.sections) Object.assign(section, { status: "closed", enrolled: 40 });
  await open(page, regular, term);
  await selectCourse(page, "AE 2410");
  await expect(details(page).getByRole("heading", { name: "Every section is full" })).toBeVisible();
  await expect(details(page).getByRole("link", { name: /Join waitlist in Workday/ })).toHaveAttribute("target", "_blank");
  await screenshots(page, "all-full");
  await details(page).getByRole("button", { name: /^Show full sections/ }).click();
  await settled(page);
  expect((await draft(page)).preferences.onlyOpen).toBe(false);
  await expect(page.getByRole("button", { name: "Save schedule" })).toBeEnabled();
});

test("pair diagnosis shows exact overlap, and removing the course restores a schedule", async ({ page }) => {
  await open(page, { ...regular, courses: [...regular.courses, "AB 1533"] });
  await selectCourse(page, "AB 1533");
  await expect(details(page).getByRole("heading", { name: "Two lectures overlap" })).toBeVisible();
  await expect(details(page)).toContainText("both meet Mon, Tue, Thu, Fri from 9:00–9:50 AM.");
  const monday = calendar(page).getByRole("group", { name: "Monday" });
  const first = await monday.locator('[data-preview="true"]').filter({ hasText: "CL01" }).boundingBox();
  const second = await monday.locator('[data-preview="true"]').filter({ hasText: "AB 1533" }).boundingBox();
  expect(first!.x + first!.width).toBeLessThan(second!.x);
  await screenshots(page, "pair-clash");
  await details(page).getByRole("button", { name: /^Remove AB 1533/ }).click();
  await settled(page);
  expect((await draft(page)).courses).toEqual(regular.courses);
  await expect(page.getByText("Schedule 1 of 1", { exact: true })).toBeVisible();
});

test("blocked-time diagnosis clears blocked times through its fix", async ({ page }) => {
  await open(page, { ...regular, preferences: { ...regular.preferences, blocked: [{ day: "Mon", start: 540, end: 600, label: "Work" }] } });
  await expect(details(page).getByRole("heading", { name: "Your blocked times overlap" })).toBeVisible();
  await screenshots(page, "blocked-times");
  await details(page).getByRole("button", { name: /^Clear blocked times/ }).click();
  await settled(page);
  expect((await draft(page)).preferences.blocked).toEqual([]);
  await expect(page.getByRole("button", { name: "Save schedule" })).toBeEnabled();
});

test("the engine's clashing set is shown when every pair fits", async ({ page }) => {
  const term = data();
  const template = term.courses.find((course) => course.code === "AE 2410")!;
  const codes = ["AR 1100", "AREN 2004", "RBE 2020"];
  term.courses = codes.map((code) => {
    const sections = [540, 600].map((start, index) => ({ ...template.sections[0], id: `${code}-C0${index + 1}`, code: `C0${index + 1}`, meetings: [{ days: ["Mon" as const], start, end: start + 50, location: "" }] }));
    return { ...template, code, title: code, sections, options: sections.map((section) => [section.id]) };
  });
  await open(page, { ...regular, courses: codes, locks: {}, preferences: { startsAfter: 0, blocked: [], onlyOpen: true } }, term);
  await expect(details(page).getByRole("heading", { name: "These courses can’t all fit together" })).toBeVisible();
  await expect(details(page)).toContainText("AR 1100, AREN 2004 and RBE 2020 can’t all fit together with your current preferences.");
  await screenshots(page, "clashing-set");
  await details(page).getByRole("button", { name: /^Remove RBE 2020/ }).click();
  await settled(page);
  await expect(page.getByRole("button", { name: "Save schedule" })).toBeEnabled();
});

for (const failure of ["engine-error", "worker-failure"] as const) {
  test(`${failure} offers retry and doesn't claim the plan cannot fit`, async ({ page }) => {
    const reply = failure === "engine-error"
      ? { type: "result" as const, response: { ok: false as const, version: 1 as const, error: { code: "internal" as const, message: "Internal error", detail: null } } }
      : { type: "failure" as const, reason: "workerCrashed" as const, message: "Worker crashed" };
    await firstSolve(page, reply);
    await open(page);
    await expect(calendar(page).getByRole("alert")).toContainText("Couldn’t check your schedules.");
    await expect(page.getByText("0 schedules fit", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Save schedule" })).toBeDisabled();
    await screenshots(page, failure);
    await calendar(page).getByRole("button", { name: "Retry" }).click();
    await settled(page);
    await expect(page.getByRole("button", { name: "Save schedule" })).toBeEnabled();
  });
}

test("a capped empty answer is uncertain", async ({ page }) => {
  await firstSolve(page, { type: "result", response: { ok: true, version: 1, termId: "2027-C", total: 0, patterns: 0, capped: true, steps: 1, elapsedMs: 1, schedules: [], diagnosis: { unsure: true, emptyCourses: [], clashingPairs: [], minimalClash: [], fixes: [] } } });
  await open(page);
  await expect(page.getByText("Search incomplete", { exact: true })).toBeVisible();
  await expect(page.getByText("0 schedules fit", { exact: true })).toHaveCount(0);
  await expect(calendar(page).getByRole("alert")).toContainText("Too many combinations to check.");
  await expect(details(page).getByText("Ways to fix it")).toHaveCount(0);
  await screenshots(page, "capped-empty");
});

test("a capped positive answer shows lower bounds and keeps its usable schedule", async ({ page }) => {
  await firstSolve(page, { type: "result", response: {
    ok: true, version: 1, termId: "2027-C", total: 500, patterns: 500, capped: true, steps: 1, elapsedMs: 1, diagnosis: null,
    schedules: [{ score: { total: 0, earlyMinutes: 0, gapMinutes: 0, days: 5 }, courses: [{ code: "AE 2410", sections: ["AE 2410-C01"], alternatives: [["AE 2410-C01"]], openSeats: 30 }] }],
  } });
  await open(page, { ...regular, courses: ["AE 2410"], locks: {} });
  await expect(page.getByText("1 course · 500+ schedules fit", { exact: true })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "There are too many combinations" })).toContainText("Showing the best 1 schedule found.");
  await expect(calendar(page).locator("[data-block]")).not.toHaveCount(0);
  await expect(page.getByRole("button", { name: "Save schedule" })).toBeEnabled();
  await screenshots(page, "capped-positive");
});

test("a slow first solve keeps loading placeholders and announces progress", async ({ page }) => {
  await firstSolve(page, null, 3000);
  const opening = open(page);
  await expect(calendar(page).getByText("Finding schedules…")).toBeVisible();
  await expect(calendar(page).locator('[aria-busy="true"]')).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Finding schedules…" })).toBeVisible();
  await screenshots(page, "loading");
  await opening;
  await expect(page.getByText("Schedule 1 of 1", { exact: true })).toBeVisible();
});

test("a failed term hides unavailable controls and Retry reloads it", async ({ page }) => {
  let failed = true;
  const term = data();
  await page.route("**/data/2027-C.json", (route) => failed ? route.fulfill({ status: 500 }) : route.fulfill({ json: term }));
  await open(page, regular, term, false, false);
  await expect(calendar(page).getByRole("alert")).toContainText("Couldn’t load C Term sections.");
  await expect(details(page)).toHaveCount(0);
  await expect(page.getByRole("searchbox", { name: "Search courses" })).toBeDisabled();
  await screenshots(page, "term-failed");
  failed = false;
  await calendar(page).getByRole("button", { name: "Retry" }).click();
  await settled(page);
  await expect(page.getByText("Schedule 1 of 1", { exact: true })).toBeVisible();
});
