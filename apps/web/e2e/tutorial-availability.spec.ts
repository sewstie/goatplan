import { expect, test, type Page } from "@playwright/test";
import type { TermFile } from "../src/lib/data/types";

const code = "AE 2410";
const term: TermFile = {
  term: { id: "2099-C", name: "C Term", season: "Spring", year: 2099, start: "2099-01-13", end: "2099-03-05" },
  generatedAt: "2026-10-21T12:00:00Z",
  courses: [{
    code, subject: "AE", title: "Applied Dynamics", credits: 3, level: "Undergraduate", description: "",
    sections: [480, 600, 720, 720, 840].map((start, index) => ({
      id: `${code}-C0${index + 1}`, code: `C0${index + 1}`, type: "lecture",
      status: index === 4 ? "closed" : "open", capacity: 40, enrolled: index === 4 ? 40 : 10,
      waitlist: { taken: 0, capacity: 0 }, delivery: "in-person", instructors: ["Ye Lu"],
      meetings: [{ days: [index === 2 || index === 4 ? "Tue" : "Mon"], start, end: start + 50, location: "Higgins Labs 116" }],
    })),
    options: [1, 2, 3, 4, 5].map((index) => [`${code}-C0${index}`]),
  }],
};

const guide = (page: Page) => page.getByRole("region", { name: "First plan tutorial" });
const next = (page: Page) => guide(page).getByRole("button", { name: "Next", exact: true });
const startTime = (page: Page) => page.getByRole("combobox", { name: "Starts after" });
const settled = (page: Page) => expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");

async function openAvailability(page: Page, width: number) {
  await page.setViewportSize({ width, height: width === 834 ? 1194 : 900 });
  await page.route("**/data/index.json", (route) => route.fulfill({ json: { terms: [{
    ...term.term, status: "upcoming", courses: 1, sections: 5, generatedAt: term.generatedAt,
  }] } }));
  await page.route("**/data/2099-C.json", (route) => route.fulfill({ json: term }));
  await page.goto("/");
  await next(page).click();
  await page.getByRole("searchbox").fill(code);
  await page.getByRole("searchbox").press("Enter");
  await next(page).click();
  await expect(guide(page).getByRole("heading", { name: "Set availability if you want" })).toBeFocused();
  await settled(page);
}

async function capture(page: Page, state: string, width: number) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `e2e/screenshots/tutorial-availability-${state}-${width}.png`, fullPage: true, animations: "disabled" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
}

async function browse(page: Page, sections: string[]) {
  await settled(page);
  const previous = page.getByRole("button", { name: "Previous schedule", exact: true });
  while (await previous.getAttribute("aria-disabled") === "false") await previous.click();
  const shown: string[] = [];
  for (let index = 0; index < sections.length; index++) {
    await expect(page.getByText(`Schedule ${index + 1} of ${sections.length}`, { exact: true })).toBeVisible();
    const block = page.getByRole("region", { name: "Weekly schedule" }).getByRole("button", { name: /^AE 2410 C0/ });
    const label = await block.getAttribute("aria-label");
    shown.push(label!.match(/AE 2410 (C\d+),/)![1]);
    if (index + 1 < sections.length) await page.getByRole("button", { name: "Next schedule", exact: true }).click();
  }
  expect(shown.sort()).toEqual([...sections].sort());
}

for (const width of [1440, 834]) {
  test(`availability is optional and preserves unrestricted-start results at ${width}`, async ({ page }) => {
    await openAvailability(page, width);
    const current = guide(page).getByRole("group", { name: "Current availability" });
    await expect(current).toContainText("Any time");
    await expect(current).toContainText("None");
    await expect(current).toContainText("Only open sections");
    await capture(page, "fresh", width);
    await next(page).press("Enter");
    await expect(startTime(page)).toHaveValue("0");
    await expect(page.getByRole("switch", { name: "Only open sections" })).toBeChecked();
    await capture(page, "optional", width);
    await guide(page).getByRole("button", { name: "Finish tutorial" }).press("Enter");
    await browse(page, ["C01", "C02", "C03", "C04"]);
    await page.reload();
    await settled(page);
    await expect(guide(page)).toBeHidden();
    await expect(startTime(page)).toHaveValue("0");
  });

  test(`keyboard availability edits remain hard restrictions through completion and reload at ${width}`, async ({ page }) => {
    await openAvailability(page, width);
    await guide(page).getByRole("button", { name: "Find Starts after" }).press("Enter");
    await expect(startTime(page)).toBeFocused();
    await startTime(page).selectOption("600");
    await guide(page).getByRole("button", { name: "Find Block a time" }).press("Enter");
    await expect(page.getByRole("button", { name: "Block a time", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Block a time" });
    await dialog.getByRole("textbox", { name: "Name (optional)" }).fill("Lunch");
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("checkbox", { name: "Monday", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("checkbox", { name: "Tuesday", exact: true })).toBeFocused();
    await page.keyboard.press("Space");
    await expect(dialog.getByRole("combobox", { name: "From", exact: true })).toHaveValue("720");
    await expect(dialog.getByRole("combobox", { name: "To", exact: true })).toHaveValue("780");
    await dialog.getByRole("button", { name: "Block time", exact: true }).press("Enter");
    await settled(page);
    await browse(page, ["C02", "C04"]);
    await guide(page).getByRole("button", { name: "Find Only open sections" }).press("Enter");
    const onlyOpen = page.getByRole("switch", { name: "Only open sections" });
    await expect(onlyOpen).toBeFocused();
    await page.keyboard.press("Space");
    await settled(page);
    await browse(page, ["C02", "C04", "C05"]);
    const current = guide(page).getByRole("group", { name: "Current availability" });
    await expect(current).toContainText("10:00 AM");
    await expect(current).toContainText("Lunch · Tue 12 PM–1 PM");
    await expect(current).toContainText("Open and full sections");
    await guide(page).getByRole("heading").focus();
    await capture(page, "configured", width);
    await next(page).press("Enter");
    await guide(page).getByRole("button", { name: "Back", exact: true }).press("Enter");
    await expect(current).toContainText("10:00 AM");
    await next(page).press("Enter");
    await guide(page).getByRole("button", { name: "Finish tutorial" }).press("Enter");
    await page.reload();
    await settled(page);
    await expect(guide(page)).toBeHidden();
    await expect(startTime(page)).toHaveValue("600");
    await expect(onlyOpen).not.toBeChecked();
    await expect(page.getByRole("button", { name: "Remove blocked time Lunch, Tue 12 PM–1 PM" })).toBeVisible();
    await browse(page, ["C02", "C04", "C05"]);
  });

  test(`finishing without matches keeps restrictions until explicit recovery at ${width}`, async ({ page }) => {
    await openAvailability(page, width);
    await startTime(page).selectOption("780");
    await settled(page);
    await expect(page.getByText("0 schedules fit", { exact: true })).toBeVisible();
    const details = page.getByRole("complementary", { name: "Course details" });
    await expect(details.getByRole("heading", { name: "Your preferences exclude this course" })).toBeVisible();
    const fix = details.getByRole("button", { name: /^Change to 12:00 PM/ });
    await expect(fix).toBeVisible();
    await next(page).click();
    await expect(guide(page)).toContainText("Your restrictions are still in place.");
    await expect(guide(page).getByRole("button", { name: "Finish tutorial" })).toBeEnabled();
    await capture(page, "no-match", width);
    await guide(page).getByRole("button", { name: "Finish tutorial" }).click();
    await expect(page.getByRole("region", { name: "Schedule browser" })).toBeFocused();
    await capture(page, "completed", width);
    await page.reload();
    await settled(page);
    await expect(guide(page)).toBeHidden();
    await expect(startTime(page)).toHaveValue("780");
    await expect(page.getByRole("switch", { name: "Only open sections" })).toBeChecked();
    await expect(page.getByText("0 schedules fit", { exact: true })).toBeVisible();
    await fix.press("Enter");
    await browse(page, ["C03", "C04"]);
    await expect(startTime(page)).toHaveValue("720");
    await startTime(page).selectOption("0");
    await browse(page, ["C01", "C02", "C03", "C04"]);
  });
}
