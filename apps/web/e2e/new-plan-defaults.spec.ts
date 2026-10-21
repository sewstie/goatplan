import { expect, test, type Page } from "@playwright/test";
import type { Section, TermFile } from "../src/lib/data/types";

const code = "AE 2410";
const data: TermFile = {
  term: { id: "2099-C", name: "C Term", season: "Spring", year: 2099, start: "2099-01-13", end: "2099-03-05" },
  generatedAt: "2026-10-20T12:00:00Z",
  courses: [{
    code, subject: "AE", title: "Applied Dynamics", credits: 3, level: "Undergraduate", description: "",
    sections: [480, 600, 780, 900].map((start, index): Section => ({
      id: `${code}-C0${index + 1}`, code: `C0${index + 1}`, type: "lecture",
      status: index === 2 ? "closed" : "open", capacity: 40, enrolled: index === 2 ? 40 : 10,
      waitlist: { taken: 0, capacity: 0 }, delivery: "in-person",
      instructors: [index === 0 ? "Mark Richman" : "Ye Lu"],
      meetings: [{ days: ["Mon"], start, end: start + 50, location: "Higgins Labs 116" }],
    })),
    options: [[`${code}-C01`], [`${code}-C02`], [`${code}-C03`]],
  }],
};

const preferences = (page: Page) => page.getByRole("group", { name: "Preferences" });
const startsAfter = (page: Page) => preferences(page).getByRole("combobox", { name: "Starts after" });
const onlyOpen = (page: Page) => preferences(page).getByRole("switch", { name: "Only open sections" });
const details = (page: Page) => page.getByRole("complementary", { name: "Course details" });
const settled = (page: Page) => expect(page.locator("[data-planner-solve-status]")).toHaveAttribute(
  "data-planner-solve-status", "done", { timeout: 30_000 },
);

async function openFreshPlanner(page: Page) {
  await page.route("**/data/index.json", (route) => route.fulfill({ json: { terms: [{
    ...data.term, status: "upcoming", courses: 1, sections: 4, generatedAt: data.generatedAt,
  }] } }));
  await page.route("**/data/2099-C.json", (route) => route.fulfill({ json: data }));
  await page.goto("/");
  await expect(page.locator("[data-planner-term-status]")).toHaveAttribute("data-planner-term-status", "ready");
}

async function addCourse(page: Page) {
  await page.getByRole("searchbox").fill(code);
  await page.getByRole("button", { name: `Add ${code}` }).click();
  await settled(page);
}

async function expectSchedules(page: Page, sections: string[]) {
  await settled(page);
  if (sections.length === 0) {
    await expect(page.getByText("0 schedules fit", { exact: true })).toBeVisible();
    return;
  }
  await expect(page.getByText(`Schedule 1 of ${sections.length}`, { exact: true })).toBeVisible();
  const shown: string[] = [];
  for (let index = 0; index < sections.length; index++) {
    const heading = details(page).getByRole("heading", { name: /^Lecture C0/ });
    shown.push(await heading.innerText());
    await expect(page.getByRole("region", { name: "Weekly schedule" }).getByRole("button", {
      name: new RegExp(`${code} ${shown[index].replace("Lecture ", "")},`),
    })).toBeVisible();
    if (index < sections.length - 1) await page.getByRole("button", { name: "Next schedule" }).click();
  }
  expect(shown.sort()).toEqual(sections.map((section) => `Lecture ${section}`).sort());
}

async function blockTime(page: Page, day: string, from: string, to: string) {
  await preferences(page).getByRole("button", { name: "Block a time" }).click();
  const dialog = page.getByRole("dialog", { name: "Block a time" });
  await dialog.getByRole("checkbox", { name: day, exact: true }).check();
  await dialog.getByRole("combobox", { name: "From", exact: true }).selectOption(from);
  await dialog.getByRole("combobox", { name: "To", exact: true }).selectOption(to);
  await dialog.getByRole("button", { name: "Block time", exact: true }).click();
  await settled(page);
}

async function screenshot(page: Page, name: string, width: number) {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `e2e/screenshots/new-plan-${name}-${width}.png`, fullPage: true, animations: "disabled" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
}

for (const width of [1440, 834]) {
  test(`fresh defaults allow early classes and explicit restrictions update results at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 834 ? 1194 : 900 });
    await openFreshPlanner(page);
    await expect(startsAfter(page)).toHaveValue("0");
    await expect(startsAfter(page).getByRole("option", { selected: true })).toHaveText("Any time");
    await expect(onlyOpen(page)).toBeChecked();
    await expect(preferences(page).getByRole("button", { name: /Remove blocked time/ })).toHaveCount(0);
    await screenshot(page, "fresh", width);

    await addCourse(page);
    await expectSchedules(page, ["C01", "C02"]);
    await screenshot(page, "early", width);

    await startsAfter(page).selectOption("540");
    await expectSchedules(page, ["C02"]);
    await startsAfter(page).selectOption("0");
    await expectSchedules(page, ["C01", "C02"]);

    await blockTime(page, "Monday", "480", "540");
    await expectSchedules(page, ["C02"]);
    await onlyOpen(page).focus();
    await page.keyboard.press("Space");
    await expectSchedules(page, ["C02", "C03"]);
    await blockTime(page, "Monday", "600", "660");
    await expectSchedules(page, ["C03"]);
    await screenshot(page, "restricted", width);

    await onlyOpen(page).click();
    await expectSchedules(page, []);
    await expect(startsAfter(page)).toHaveValue("0");
    await expect(preferences(page).getByRole("button", { name: /Remove blocked time/ })).toHaveCount(2);
  });
}

test("reload, saving, and saving a copy preserve configured preferences, professor, locks, and sections", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFreshPlanner(page);
  await addCourse(page);
  await startsAfter(page).selectOption("540");
  await blockTime(page, "Tuesday", "720", "780");
  await onlyOpen(page).click();
  await details(page).getByRole("combobox", { name: "Lecture professor" }).selectOption("Ye Lu");
  await expectSchedules(page, ["C02", "C03"]);
  await details(page).getByRole("button", { name: "Lock Lecture C03", exact: true }).click();
  await settled(page);

  async function expectConfiguredPlan() {
    await settled(page);
    await expect(startsAfter(page)).toHaveValue("540");
    await expect(onlyOpen(page)).not.toBeChecked();
    await expect(preferences(page).getByRole("button", { name: "Remove blocked time Tue 12 PM–1 PM" })).toBeVisible();
    await expect(details(page).getByRole("combobox", { name: "Lecture professor" })).toHaveValue("Ye Lu");
    await expect(details(page).getByRole("heading", { name: "Lecture C03", exact: true })).toBeVisible();
    await expect(details(page).getByRole("button", { name: "Unlock Lecture C03", exact: true })).toBeVisible();
    await expect(page.getByText("Schedule 1 of 1", { exact: true })).toBeVisible();
  }

  await page.reload();
  await expectConfiguredPlan();
  await page.getByRole("button", { name: "Save schedule", exact: true }).click();
  const save = page.getByRole("dialog", { name: "Save schedule", exact: true });
  await save.getByRole("textbox", { name: "Plan name" }).fill("Mornings free");
  await save.getByRole("button", { name: "Save", exact: true }).click();
  await expect(save).toBeHidden();

  await page.getByRole("button", { name: "Saved plans", exact: true }).click();
  await page.getByRole("button", { name: "Save as a new plan", exact: true }).click();
  const copy = page.getByRole("dialog", { name: "Save as a new plan", exact: true });
  await copy.getByRole("textbox", { name: "Plan name" }).fill("Mornings copy");
  await copy.getByRole("button", { name: "Save", exact: true }).click();
  await expect(copy).toBeHidden();

  for (const name of ["Mornings free", "Mornings copy"]) {
    await startsAfter(page).selectOption("0");
    await preferences(page).getByRole("button", { name: "Remove blocked time Tue 12 PM–1 PM" }).click();
    await details(page).getByRole("button", { name: "Unlock Lecture C03", exact: true }).click();
    await details(page).getByRole("combobox", { name: "Lecture professor" }).selectOption("");
    await onlyOpen(page).click();
    await expectSchedules(page, ["C01", "C02"]);

    await page.getByRole("button", { name: "Saved plans", exact: true }).click();
    await page.getByRole("list", { name: "Saved plans for C Term · Spring 2099" }).getByRole("button", { name: new RegExp(name) }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Open plan", exact: true }).click();
    await expectConfiguredPlan();
  }
});
