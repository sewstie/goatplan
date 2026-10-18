import { expect, test, type Page } from "@playwright/test";

const screenshotDir = "e2e/screenshots";
const DRAFT_KEY = "goatplan:draft:v1:2027-C";

type Draft = {
  courses: string[];
  preferences: {
    startsAfter: number;
    blocked: { day: string; start: number; end: number; label?: string }[];
    onlyOpen: boolean;
  };
  locks: Record<string, string[]>;
};

// The planner of the designs: AE 2320, AE 2410 and AE 2210 with "Work" blocked Tue and Fri 2–4 PM.
const regular: Draft = {
  courses: ["AE 2320", "AE 2410", "AE 2210"],
  preferences: {
    startsAfter: 540,
    blocked: [
      { day: "Tue", start: 840, end: 960 },
      { day: "Fri", start: 840, end: 960 },
    ],
    onlyOpen: true,
  },
  locks: {},
};

// CH 1010 with times blocked so that only lecture CL01 and the same-time labs CX02 and CX10 fit.
// This relies on the 2027-C sections in public/data: check it again if a data update breaks the sheet test.
const sameTimeLabs: Draft = {
  courses: ["CH 1010"],
  preferences: {
    startsAfter: 480,
    blocked: [
      { day: "Mon", start: 540, end: 720 },
      { day: "Mon", start: 840, end: 960 },
      { day: "Tue", start: 540, end: 960 },
    ],
    onlyOpen: true,
  },
  locks: {},
};

/** Opens the planner on C Term 2027 with this draft. Reloads keep what the page saved since. */
async function openPlanner(page: Page, draft: Draft) {
  await page.addInitScript(
    ({ key, value }) => {
      if (sessionStorage.getItem("prefs-spec-seeded")) return;
      sessionStorage.setItem("prefs-spec-seeded", "1");
      localStorage.setItem("goatplan:term:v1", "2027-C");
      localStorage.setItem(key, value);
    },
    { key: DRAFT_KEY, value: JSON.stringify({ version: 1, sortPreset: "fewestEarly", alternatives: {}, ...draft }) },
  );
  await page.goto("/");
  await waitForSchedules(page);
}

async function waitForSchedules(page: Page) {
  await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done", {
    timeout: 30_000,
  });
}

async function savedDraft(page: Page): Promise<Draft> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), DRAFT_KEY);
}

const preferencesRow = (page: Page) => page.getByRole("group", { name: "Preferences" });
const details = (page: Page) => page.getByRole("complementary", { name: "Course details" });

test("the preferences row changes the plan and is saved", async ({ page }) => {
  await openPlanner(page, regular);
  const row = preferencesRow(page);

  await expect(row.getByText("Tue, Fri")).toBeVisible();
  await expect(row.getByRole("combobox", { name: "Sort" })).toHaveValue("fewestEarly");

  await row.getByRole("combobox", { name: "Starts after" }).selectOption({ label: "10:00 AM" });
  await waitForSchedules(page);

  await row.getByRole("button", { name: "Block a time" }).click();
  const dialog = page.getByRole("dialog", { name: "Block a time" });
  await dialog.getByRole("textbox", { name: "Name (optional)" }).fill("Lunch");
  await dialog.getByRole("checkbox", { name: "Monday" }).check();
  await dialog.getByRole("checkbox", { name: "Wednesday" }).check();
  await dialog.getByRole("combobox", { name: "From" }).selectOption({ label: "12:00 PM" });
  await dialog.getByRole("combobox", { name: "To" }).selectOption({ label: "1:00 PM" });
  await dialog.getByRole("button", { name: "Block time" }).click();
  await expect(dialog).toBeHidden();
  await expect(row.getByText("Lunch")).toBeVisible();
  await expect(row.getByText("· Mon, Wed 12 PM–1 PM")).toBeVisible();

  await row.getByRole("button", { name: "Remove blocked time Tue, Fri 2 PM–4 PM" }).click();
  await row.getByRole("switch", { name: "Only open sections" }).click();
  await waitForSchedules(page);

  expect((await savedDraft(page)).preferences).toEqual({
    startsAfter: 600,
    blocked: [
      { day: "Mon", start: 720, end: 780, label: "Lunch" },
      { day: "Wed", start: 720, end: 780, label: "Lunch" },
    ],
    onlyOpen: false,
  });

  await page.reload();
  await waitForSchedules(page);
  await expect(row.getByRole("combobox", { name: "Starts after" })).toHaveValue("600");
  await expect(row.getByText("Lunch")).toBeVisible();
  await expect(row.getByRole("switch", { name: "Only open sections" })).toHaveAttribute("aria-checked", "false");
});

test("the block form works with the keyboard and checks its days", async ({ page }) => {
  await openPlanner(page, regular);

  await preferencesRow(page).getByRole("button", { name: "Block a time" }).focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Block a time" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("textbox", { name: "Name (optional)" })).toBeFocused();
  const before = await dialog.boundingBox();
  await dialog.getByRole("button", { name: "Block time" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Pick at least one day.");
  // The message sits next to the buttons, so the dialog doesn't grow or jump.
  expect(await dialog.boundingBox()).toEqual(before);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(preferencesRow(page).getByRole("button", { name: "Block a time" })).toBeFocused();
});

test("the block form opens without a ring on Close and keeps its size while hovering", async ({ page }) => {
  await openPlanner(page, regular);

  await preferencesRow(page).getByRole("button", { name: "Block a time" }).click();
  const dialog = page.getByRole("dialog", { name: "Block a time" });
  await expect(dialog.getByRole("textbox", { name: "Name (optional)" })).toBeFocused();
  await expect(dialog.getByRole("button", { name: "Close" })).not.toBeFocused();

  const size = await dialog.boundingBox();
  const parts = [
    dialog.getByRole("button", { name: "Close" }),
    dialog.getByRole("textbox", { name: "Name (optional)" }),
    ...["Monday", "Thursday", "Sunday"].map((day) => dialog.getByRole("checkbox", { name: day })),
    dialog.getByRole("combobox", { name: "From" }),
    dialog.getByRole("combobox", { name: "To" }),
    dialog.getByRole("button", { name: "Cancel" }),
    dialog.getByRole("button", { name: "Block time" }),
  ];
  for (const part of parts) {
    await part.hover();
    expect(await dialog.boundingBox()).toEqual(size);
  }
  await dialog.getByRole("checkbox", { name: "Wednesday" }).check();
  await dialog.getByRole("button", { name: "Cancel" }).hover();
  expect(await dialog.boundingBox()).toEqual(size);
});

test("a section can be locked and unlocked from the details panel", async ({ page }) => {
  await openPlanner(page, regular);
  const panel = details(page);

  await expect(panel.getByRole("heading", { level: 2, name: "AE 2320" })).toBeVisible();
  await expect(panel.getByRole("article").filter({ hasText: "Lecture CL01" }).getByText("Only lecture")).toBeVisible();

  const lock = panel.getByRole("button", { name: /^Lock Lab CX0\d$/ });
  const lab = (await lock.getAttribute("aria-label"))!.replace("Lock ", "");
  await lock.click();
  await waitForSchedules(page);
  await expect(panel.getByRole("button", { name: `Unlock ${lab}` })).toBeVisible();
  expect((await savedDraft(page)).locks).toEqual({ "AE 2320": [`AE 2320-${lab.split(" ")[1]}`] });

  await page.reload();
  await waitForSchedules(page);
  await panel.getByRole("button", { name: `Unlock ${lab}` }).click();
  await waitForSchedules(page);
  await expect(panel.getByRole("button", { name: `Lock ${lab}` })).toBeVisible();
  expect((await savedDraft(page)).locks).toEqual({});
});

test("the sheet swaps a lab for one at the same time", async ({ page }) => {
  await openPlanner(page, sameTimeLabs);
  const panel = details(page);
  const shownLab = panel.getByRole("heading", { name: /^Lab CX(02|10)$/ });
  const before = (await shownLab.textContent())!.replace("Lab ", "");
  const other = before === "CX02" ? "CX10" : "CX02";

  await panel.getByRole("button", { name: "View other lab choices" }).click();
  const sheet = page.getByRole("dialog", { name: "Choose a lab" });
  const group = sheet.getByRole("group", { name: "Other lab choices" });
  await expect(group.getByText(`${before}, your lab now`)).toBeAttached();
  const row = group.getByRole("radio", { name: new RegExp(other) });
  await expect(row).not.toBeChecked();
  await expect(group.locator("label", { hasText: other })).toContainText("Mon, Thu · 12:00 PM–1:50 PM · Goddard Hall");

  await sheet.getByRole("button", { name: `Pick ${other}` }).click();
  await expect(sheet).toBeHidden();
  await expect(panel.getByRole("heading", { name: `Lab ${other}` })).toBeVisible();
  await expect(panel.getByRole("button", { name: "View other lab choices" })).toBeFocused();
});

test("choosing a lab at another time switches schedules, or locks it when no schedule has it", async ({ page }) => {
  await openPlanner(page, regular);
  const panel = details(page);
  const lab = () => panel.getByRole("heading", { name: /^Lab CX0\d$/ });

  await panel.getByRole("button", { name: "View other lab choices" }).click();
  const sheet = page.getByRole("dialog", { name: "Choose a lab" });
  await expect(sheet.getByText("These labs fit around the rest of your schedule", { exact: false })).toBeFocused();
  const pick = sheet.getByRole("button", { name: /^Pick CX0\d$/ });
  const first = (await pick.textContent())!.replace("Pick ", "");
  await pick.click();
  await expect(sheet).toBeHidden();
  await expect(lab()).toHaveText(`Lab ${first}`);
  // The engine had a schedule with that lab, so nothing got locked.
  expect((await savedDraft(page)).locks).toEqual({});

  await panel.getByRole("button", { name: `Lock Lab ${first}` }).click();
  await waitForSchedules(page);
  await panel.getByRole("button", { name: "View other lab choices" }).click();
  const second = (await pick.textContent())!.replace("Pick ", "");
  await pick.click();
  await waitForSchedules(page);
  await expect(lab()).toHaveText(`Lab ${second}`);
  await expect(panel.getByRole("button", { name: `Unlock Lab ${second}` })).toBeVisible();
  expect((await savedDraft(page)).locks).toEqual({ "AE 2320": [`AE 2320-${second}`] });
});

test("the details panel follows the course picked in the sidebar or on the calendar", async ({ page }) => {
  await openPlanner(page, regular);
  const panel = details(page);
  await expect(panel.getByRole("heading", { level: 2, name: "AE 2320" })).toBeVisible();

  await page.getByRole("region", { name: "Your courses" }).getByRole("button", { name: /^AE 2410/ }).click();
  await expect(panel.getByRole("heading", { level: 2, name: "AE 2410" })).toBeVisible();
  await expect(panel.getByText("Selected course")).toHaveCount(0);

  await page.getByRole("region", { name: "Weekly schedule" }).getByRole("button", { name: /^AE 2210 C01, .*Wednesday/ }).click();
  await expect(panel.getByRole("heading", { level: 2, name: "AE 2210" })).toBeVisible();
  await expect(panel.getByText("Selected course")).toBeVisible();
  await expect(page.getByRole("region", { name: "Your courses" }).getByRole("button", { name: /^AE 2210/ })).toHaveAttribute(
    "aria-current",
    "true",
  );
});

for (const [width, height] of [
  [1440, 900],
  [834, 1194],
] as const) {
  test(`preferences and details screenshots at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openPlanner(page, regular);
    await page.screenshot({ path: `${screenshotDir}/prefs-planner-${width}.png`, fullPage: width === 834, animations: "disabled" });

    await page.getByRole("button", { name: /^Lock Lab CX0\d$/ }).click();
    await waitForSchedules(page);
    await page.mouse.move(0, 0);
    await page.screenshot({ path: `${screenshotDir}/prefs-locked-${width}.png`, fullPage: width === 834, animations: "disabled" });

    await preferencesRow(page).getByRole("button", { name: "Block a time" }).click();
    await page.getByRole("checkbox", { name: "Monday" }).check();
    await page.screenshot({ path: `${screenshotDir}/prefs-block-form-${width}.png`, animations: "disabled" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });

  test(`lab sheet screenshot at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openPlanner(page, regular);
    await details(page).getByRole("button", { name: "View other lab choices" }).click();
    await expect(page.getByRole("dialog", { name: "Choose a lab" })).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/prefs-sheet-${width}.png`, animations: "disabled" });
  });
}
