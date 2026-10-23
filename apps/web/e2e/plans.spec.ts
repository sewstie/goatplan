import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const screenshotDir = "e2e/screenshots";

// The scenario of div.app-12 and div.app-22, built from the real C Term data: AE 2320 (lab CX02
// locked), AE 2410 and AE 2210, starts after 9:00 AM, Work blocked Tue and Fri 2–4 PM.
type Section = { id: string; code: string; enrolled: number; capacity: number } & Record<string, unknown>;
type Course = { code: string; title: string; sections: Section[] };
const term: { courses: Course[] } = JSON.parse(
  readFileSync(path.join(__dirname, "../public/data/2027-C.json"), "utf8"),
);
const course = (code: string) => term.courses.find((item) => item.code === code)!;
const designLab = course("AE 2320").sections.find((section) => section.id === "AE 2320-CX02")!;
designLab.status = "open";
designLab.enrolled = designLab.capacity - 4;
const sections = (code: string, ids: string[]) =>
  ids.map((id) => structuredClone(course(code).sections.find((section) => section.id === id)!));

const preferences = {
  startsAfter: 540,
  blocked: [
    { day: "Tue", start: 840, end: 960 },
    { day: "Fri", start: 840, end: 960 },
  ],
  onlyOpen: true,
};
const draft = {
  version: 1,
  courses: ["AE 2320", "AE 2410", "AE 2210"],
  preferences,
  locks: { "AE 2320": ["AE 2320-CX02"] },
  sortPreset: "fewestEarly",
  alternatives: {},
};

function savedPlan(id: string, name: string, savedAt: string) {
  return {
    version: 1,
    id,
    name,
    termId: "2027-C",
    term: { name: "C Term", season: "Spring", year: 2027 },
    savedAt,
    courses: draft.courses,
    schedule: [
      { code: "AE 2320", title: course("AE 2320").title, sections: sections("AE 2320", ["AE 2320-CL01", "AE 2320-CX02"]) },
      { code: "AE 2410", title: course("AE 2410").title, sections: sections("AE 2410", ["AE 2410-C01"]) },
      { code: "AE 2210", title: course("AE 2210").title, sections: sections("AE 2210", ["AE 2210-C01"]) },
    ],
    locks: draft.locks,
    preferences,
    sortPreset: "fewestEarly",
  };
}

const plan = savedPlan("plan-design", "Plan 1", "2026-10-17T12:00:00.000Z");

/** Saved when CX02 had more open seats, with an AE 2410 section the latest data no longer has. */
const changedPlan = (() => {
  const changed = savedPlan("plan-changed", "Mornings free", "2026-10-16T12:00:00.000Z");
  const lab = changed.schedule[0].sections[1];
  lab.enrolled = Math.max(0, lab.enrolled - 7);
  changed.schedule[1].sections[0] = { ...changed.schedule[1].sections[0], id: "AE 2410-C09", code: "C09" };
  return changed;
})();

/** Nine courses, longer than the 630px the main region has on tablets. */
const longPlan = (() => {
  const long = savedPlan("plan-long", "Everything", "2026-10-17T12:00:00.000Z");
  const extra = term.courses.filter((item) => !long.courses.includes(item.code)).slice(0, 6);
  long.courses = [...long.courses, ...extra.map((item) => item.code)];
  long.schedule = [
    ...long.schedule,
    ...extra.map((item) => ({ code: item.code, title: item.title, sections: [structuredClone(item.sections[0])] })),
  ];
  return long;
})();

const baseStorage = { "goatplan:term:v1": "2027-C", "goatplan:draft:v1:2027-C": draft };
const savedStorage = {
  ...baseStorage,
  "goatplan:plans:v1:plan:plan-design": plan,
  "goatplan:plans:v1:current:2027-C": "plan-design",
};
const unsavedStorage = { ...savedStorage, "goatplan:draft:v1:2027-C": { ...draft, locks: {} } };
const twoPlansStorage = { ...savedStorage, "goatplan:plans:v1:plan:plan-changed": changedPlan };

/** Fills localStorage before the app starts, once per tab, so reloads keep what the test saved. */
async function seed(page: Page, entries: Record<string, unknown>) {
  await page.route("**/data/2027-C.json", (route) => route.fulfill({ json: term }));
  await page.addInitScript((items) => {
    if (sessionStorage.getItem("plans-e2e-seeded")) return;
    sessionStorage.setItem("plans-e2e-seeded", "1");
    for (const [key, value] of Object.entries(items)) {
      localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    }
  }, entries);
}

async function plannerSettled(page: Page) {
  await expect(page.locator("[data-planner-solve-status]").last()).toHaveAttribute("data-planner-solve-status", "done", {
    timeout: 30_000,
  });
}

/** Buttons fade between states, so screenshots wait for the fade to end. */
async function screenshot(page: Page, name: string, fullPage = false) {
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${screenshotDir}/${name}.png`, fullPage });
}

// The workspace header sits inside <main>, so it is no banner landmark.
const header = (page: Page) => page.locator("header");

test.describe("Save schedule", () => {
  test("saves the current schedule with a name, then reads Saved", async ({ page }) => {
    await seed(page, baseStorage);
    await page.goto("/");
    await plannerSettled(page);
    await expect(header(page).getByText(/^(Unsaved changes|Schedule saved)$/)).toHaveCount(0);

    await header(page).getByRole("button", { name: "Save schedule" }).click();
    const dialog = page.getByRole("dialog", { name: "Save schedule" });
    const name = dialog.getByRole("textbox", { name: "Plan name" });
    await expect(name).toHaveValue("Plan 1");
    await expect(name).toBeFocused();
    await page.keyboard.type("Mornings free");
    await page.keyboard.press("Enter");

    await expect(dialog).toBeHidden();
    await expect(header(page).getByRole("button", { name: "Schedule saved", exact: true })).toBeVisible();
    await expect(header(page).getByRole("button", { name: "Schedule saved", exact: true })).toHaveAttribute("aria-disabled", "true");

    const stored = await page.evaluate(() =>
      Object.keys(localStorage)
        .filter((key) => key.startsWith("goatplan:plans:v1:plan:"))
        .map((key) => JSON.parse(localStorage.getItem(key)!)),
    );
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("Mornings free");
    expect(stored[0].schedule.flatMap((item: Course) => item.sections.map((section) => section.id))).toEqual([
      "AE 2320-CL01",
      "AE 2320-CX02",
      "AE 2410-C01",
      "AE 2210-C01",
    ]);

    await page.reload();
    await plannerSettled(page);
    await expect(header(page).getByRole("button", { name: "Schedule saved", exact: true })).toBeVisible();
  });

  test("saves changes into the same plan and updates the save button", async ({ page }) => {
    await seed(page, unsavedStorage);
    await page.goto("/");
    await plannerSettled(page);
    await expect(header(page).getByRole("button", { name: "Save schedule" })).toBeEnabled();
    for (const width of [1440, 834]) {
      await page.setViewportSize({ width, height: width === 1440 ? 900 : 1194 });
      await screenshot(page, `plans-header-unsaved-${width}`);
    }

    await header(page).getByRole("button", { name: "Save schedule" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(header(page).getByRole("button", { name: "Schedule saved", exact: true })).toBeVisible();
    const locks = await page.evaluate(
      () => JSON.parse(localStorage.getItem("goatplan:plans:v1:plan:plan-design")!).locks,
    );
    expect(locks).toEqual({});
    for (const width of [1440, 834]) {
      await page.setViewportSize({ width, height: width === 1440 ? 900 : 1194 });
      await screenshot(page, `plans-header-saved-${width}`);
    }
  });

  test("the plan buttons are off while the term loads", async ({ page }) => {
    await seed(page, savedStorage);
    let release!: () => void;
    const released = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/data/2027-C.json", async (route) => {
      await released;
      await route.fallback();
    });
    await page.goto("/");
    await expect(page.locator("[data-planner-term-status]")).toHaveAttribute("data-planner-term-status", "loading");
    await expect(header(page).getByRole("button", { name: "Save schedule" })).toBeDisabled();
    await expect(header(page).getByRole("button", { name: "Saved plans" })).toBeDisabled();

    release();
    await plannerSettled(page);
    await expect(header(page).getByRole("button", { name: "Saved plans" })).toBeEnabled();
    await expect(header(page).getByRole("button", { name: "Schedule saved", exact: true })).toBeVisible();
  });

  test("the Saved plans menu works with the keyboard", async ({ page }) => {
    await seed(page, twoPlansStorage);
    await page.goto("/");
    await plannerSettled(page);
    const trigger = header(page).getByRole("button", { name: "Saved plans" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const list = page.getByRole("list", { name: "Saved plans for C Term · Spring 2027" });
    await expect(list.getByRole("button")).toHaveText([/Plan 1.*open now/, /Mornings free/]);
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();

    // A dialog opened from the menu gives focus back to the menu's button.
    await trigger.click();
    await page.getByRole("button", { name: "Save as a new plan" }).click();
    await expect(page.getByRole("dialog", { name: "Save as a new plan" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await page.getByRole("link", { name: "All saved plans" }).click();
    await expect(page).toHaveURL(/\/plans$/);
  });
});

test.describe("Sections to register", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("shows the saved plan's sections and copies the list", async ({ page }) => {
    await seed(page, savedStorage);
    await page.goto("/plans?plan=plan-design");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sections to register · Plan 1");
    await expect(page.getByRole("region", { name: "Sections to register" })).toBeVisible();
    await expect(header(page)).toContainText("Schedule 1 of 1");
    await expect(header(page)).toContainText("3 courses · 4 sections · Saved plan");
    await expect(page.getByRole("heading", { level: 2, name: "Ready for Workday" })).toBeVisible();
    await expect(page.getByText("4 sections across 3 courses", { exact: true })).toBeVisible();

    const table = page.getByRole("table");
    await expect(table.getByRole("columnheader")).toHaveText(["Course", "Section", "Meeting time", "Room / instructor"]);
    const rows = table.getByRole("row");
    await expect(rows).toHaveCount(5);
    await expect(rows.nth(1)).toContainText("AE 2320");
    await expect(rows.nth(1)).toContainText("CL01");
    await expect(rows.nth(1)).toContainText("Mon–Fri · 9:00–9:50 AM");
    await expect(rows.nth(2)).toContainText("CX02");
    await expect(rows.nth(2)).toContainText("Thu · 3:00–3:50 PM");

    const list = "AE 2320 — CL01 (lecture), CX02 (lab)\nAE 2410 — C01 (lecture)\nAE 2210 — C01 (lecture)";
    await expect(page.getByRole("main").locator("pre")).toHaveText(list);
    await page.getByRole("button", { name: "Copy section list" }).click();
    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(list);

    const summary = page.getByRole("complementary", { name: "Plan summary" });
    await expect(summary.getByText("Plan ready")).toBeVisible();
    await expect(summary.getByRole("listitem")).toHaveText([
      "Lecture and lab choices included",
      "No overlapping meeting times",
      "Preferences respected",
    ]);
    const workday = summary.getByRole("link", { name: /Open Workday/ });
    await expect(workday).toHaveAttribute("target", "_blank");
    await expect(
      page.getByRole("main").getByText("Saving a plan in GoatPlan keeps your choices. Complete registration in Workday."),
    ).toBeVisible();

    await expect(page.getByRole("button", { name: "Copy section list" })).toBeVisible({ timeout: 3000 });
    await page.mouse.move(0, 0);
    for (const width of [1680, 1440, 834]) {
      await page.setViewportSize({ width, height: width === 834 ? 1194 : width === 1440 ? 900 : 800 });
      await screenshot(page, `plans-register-${width}`, width === 834);
    }
  });

  test("prints only the section list", async ({ page }) => {
    await seed(page, savedStorage);
    await page.goto("/plans?plan=plan-design");
    await expect(page.getByRole("table")).toBeVisible();
    await page.emulateMedia({ media: "print" });
    await expect(page.getByRole("main")).toBeHidden();
    await expect(page.getByRole("complementary", { name: "Term and courses" })).toBeHidden();
    await expect(page.getByRole("heading", { level: 1, name: "Sections to register" })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByRole("button")).toHaveCount(0);
    await screenshot(page, "plans-print", true);
  });

  test("flags seats and sections that changed since the plan was saved", async ({ page }) => {
    await seed(page, twoPlansStorage);
    await page.goto("/plans?plan=plan-changed");
    const summary = page.getByRole("complementary", { name: "Plan summary" });
    await expect(summary.getByText("Saved plan needs attention")).toBeVisible();
    await expect(summary.getByRole("heading", { level: 3 })).toHaveText("AE 2410 C09 was removed.");
    await expect(summary.getByRole("button", { name: "Open in planner" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sections to register · Mornings free");
    await expect(header(page).getByRole("link", { name: "Back to planner" })).toBeVisible();
    await expect(header(page).getByRole("button")).toHaveCount(0);
    const rows = page.getByRole("table").getByRole("row");
    await expect(rows.nth(2)).toContainText(/Was \d+ open/);
    await expect(rows.nth(3)).toContainText("No longer offered");
    await page.setViewportSize({ width: 1440, height: 900 });
    await screenshot(page, "plans-attention-1440");
  });

  test("the saved-plan header returns to the planner to save changes", async ({ page }) => {
    await seed(page, unsavedStorage);
    await page.goto("/plans?plan=plan-design");
    await plannerSettled(page);
    await expect(header(page).getByRole("button")).toHaveCount(0);
    await header(page).getByRole("link", { name: "Back to planner" }).click();
    await expect(header(page).getByRole("button", { name: "Save schedule" })).toBeEnabled();
    await expect(page.getByRole("group", { name: "Preferences" }).getByRole("button", { name: "Block a time" })).toBeEnabled();
    await expect(page.getByRole("region", { name: "Your courses" }).getByRole("button", { name: "Remove AE 2320" })).toBeEnabled();
  });

  test("another plan shows its own courses and preferences without changing the planner", async ({ page }) => {
    const viewed = {
      ...changedPlan,
      courses: ["AE 2410"],
      schedule: [changedPlan.schedule[1]],
      locks: {},
      preferences: { startsAfter: 660, blocked: [{ day: "Sat", start: 1080, end: 1200, label: "Job" }], onlyOpen: false },
      sortPreset: "fewestGaps",
    };
    await seed(page, { ...twoPlansStorage, "goatplan:plans:v1:plan:plan-changed": viewed });
    await page.goto("/plans?plan=plan-changed");
    await plannerSettled(page);
    const courses = page.getByRole("region", { name: "Your courses" });
    await expect(courses.getByRole("listitem")).toHaveCount(1);
    await expect(courses).toContainText("AE 2410");
    await expect(courses).toContainText("C09");
    await expect(courses.getByRole("button")).toHaveCount(0);
    const prefs = page.getByRole("group", { name: "Preferences" });
    await expect(prefs).toContainText("11:00 AM");
    await expect(prefs).toContainText("Job");
    await expect(prefs).toContainText("Sat 6 PM–8 PM");
    await expect(prefs).toContainText("Fewest gaps");
    await expect(prefs.getByRole("switch", { name: "Only open sections" })).not.toBeChecked();
    await expect(prefs.getByRole("switch", { name: "Only open sections" })).toBeDisabled();
    await expect(prefs.getByRole("combobox")).toHaveCount(0);
    await expect(prefs.getByRole("button", { name: /Block a time|Remove/ })).toHaveCount(0);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("goatplan:draft:v1:2027-C")!));
    expect(stored.courses).toEqual(draft.courses);
    expect(stored.preferences).toEqual(preferences);
    for (const width of [1440, 834]) {
      await page.setViewportSize({ width, height: width === 834 ? 1194 : 900 });
      await screenshot(page, `plans-read-only-${width}`, true);
    }
    await page.getByRole("button", { name: "Open in planner to edit" }).click();
    await expect(page).toHaveURL(/\/$/);
    await plannerSettled(page);
    await expect(page.getByRole("region", { name: "Your courses" }).getByRole("button", { name: "Remove AE 2410" })).toBeEnabled();
    await expect(page.getByRole("group", { name: "Preferences" })).toContainText("Job");
  });

  test("a long plan makes the page longer on a tablet instead of scrolling inside a box", async ({ page }) => {
    await seed(page, { ...savedStorage, "goatplan:plans:v1:plan:plan-long": longPlan });
    await page.setViewportSize({ width: 834, height: 1194 });
    await page.goto("/plans?plan=plan-long");
    const region = page.getByRole("region", { name: "Sections to register" });
    await expect(region.getByRole("table").getByRole("row")).toHaveCount(11);
    expect((await region.boundingBox())!.height).toBeGreaterThan(630);
    const scrolls = await region.evaluate((element) =>
      [element, ...element.children].some((node) => node.scrollHeight > node.clientHeight + 1),
    );
    expect(scrolls).toBe(false);
  });

  test("says when the latest course data can't be checked", async ({ page }) => {
    await seed(page, savedStorage);
    await page.route("**/data/2027-C.json", (route) => route.fulfill({ status: 500 }));
    await page.goto("/plans?plan=plan-design");
    const summary = page.getByRole("complementary", { name: "Plan summary" });
    await expect(summary).toContainText("Couldn’t check the latest course data.");
    await expect(page.getByRole("table").getByRole("row")).toHaveCount(5);
  });

  test("says so when the plan isn't in this browser", async ({ page }) => {
    await seed(page, savedStorage);
    await page.goto("/plans?plan=missing");
    await expect(page.getByRole("heading", { name: "This plan isn’t here" })).toBeVisible();
    await page.getByRole("link", { name: "See your saved plans" }).click();
    await expect(page.getByRole("heading", { name: "Your saved plans" })).toBeVisible();
  });
});

test.describe("Saved plans list", () => {
  test("lists plans with their changes, renames and deletes them", async ({ page }) => {
    await seed(page, twoPlansStorage);
    await page.goto("/plans");
    await expect(page.getByRole("heading", { level: 1, name: "All saved plans" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your saved plans" })).toBeVisible();
    const group = page.getByRole("region", { name: "C Term · Spring 2027" });
    const items = group.getByRole("listitem").filter({ has: page.getByRole("heading", { level: 4 }) });
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toContainText("Plan 1");
    await expect(items.nth(0)).toContainText("In the planner");
    await expect(items.nth(0)).toContainText("No changes since you saved.");
    await expect(items.nth(1)).toContainText("AE 2410 C09 removed");
    await expect(items.nth(1)).toContainText(/AE 2320 CX02: \d+ open \(was \d+\)/);
    for (const width of [1440, 834]) {
      await page.setViewportSize({ width, height: width === 1440 ? 900 : 1194 });
      await screenshot(page, `plans-list-${width}`, width === 834);
    }

    await page.getByRole("button", { name: "Rename Mornings free" }).click();
    const rename = page.getByRole("dialog", { name: "Rename plan" });
    await rename.getByRole("textbox", { name: "Plan name" }).fill("Fridays off");
    await rename.getByRole("button", { name: "Rename" }).click();
    await expect(rename).toBeHidden();
    await expect(page.getByRole("heading", { level: 4, name: "Fridays off" })).toBeVisible();

    await page.getByRole("button", { name: "Delete Fridays off" }).click();
    const remove = page.getByRole("dialog", { name: "Delete “Fridays off”?" });
    await remove.getByRole("button", { name: "Delete plan" }).click();
    await expect(page.getByRole("heading", { level: 4 })).toHaveText(["Plan 1"]);
    await expect(page.getByRole("heading", { name: "Your saved plans" })).toBeFocused();

    await page.reload();
    await expect(page.getByRole("heading", { level: 4 })).toHaveText(["Plan 1"]);
    await page.getByRole("button", { name: "Delete Plan 1" }).click();
    await page.getByRole("button", { name: "Delete plan", exact: true }).click();
    await expect(page.getByRole("heading", { name: "No saved plans yet" })).toBeFocused();
    await expect(header(page).getByText(/^(Unsaved changes|Schedule saved)$/)).toHaveCount(0);
  });

  test("opening a plan asks before discarding unsaved changes", async ({ page }) => {
    await seed(page, unsavedStorage);
    await page.goto("/plans");
    await plannerSettled(page);
    await page.getByRole("button", { name: "Open in planner Plan 1" }).click();
    const confirm = page.getByRole("dialog", { name: "Open “Plan 1”?" });
    await expect(confirm).toContainText("Your unsaved changes to the C Term schedule will be lost.");
    await confirm.getByRole("button", { name: "Cancel" }).click();
    await expect(page).toHaveURL(/\/plans$/);

    await page.getByRole("button", { name: "Open in planner Plan 1" }).click();
    await confirm.getByRole("button", { name: "Open plan" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(header(page).getByRole("button", { name: "Schedule saved", exact: true })).toBeVisible({ timeout: 30_000 });
    const locks = await page.evaluate(() => JSON.parse(localStorage.getItem("goatplan:draft:v1:2027-C")!).locks);
    expect(locks).toEqual({ "AE 2320": ["AE 2320-CX02"] });
  });

  test("opening a plan keeps the names of its blocked times", async ({ page }) => {
    const blocked = preferences.blocked.map((block) => ({ ...block, label: "Work" }));
    await seed(page, {
      ...savedStorage,
      "goatplan:plans:v1:plan:plan-design": { ...plan, preferences: { ...preferences, blocked } },
    });
    await page.goto("/plans");
    await plannerSettled(page);
    // The planner's draft has the same times without a name, which counts as an unsaved change.
    await page.getByRole("button", { name: "Open in planner Plan 1" }).click();
    await page.getByRole("dialog", { name: "Open “Plan 1”?" }).getByRole("button", { name: "Open plan" }).click();
    await expect(header(page).getByRole("button", { name: "Schedule saved", exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("group", { name: "Preferences" }).getByText("Work")).toBeVisible();
    await expect(page.getByRole("group", { name: "Tuesday" }).getByText("Work")).toBeVisible();
  });

  test("shows a way to the planner when nothing is saved", async ({ page }) => {
    await seed(page, baseStorage);
    await page.goto("/plans");
    await expect(page.getByRole("heading", { name: "No saved plans yet" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to the planner" })).toHaveAttribute("href", "/");
  });
});
