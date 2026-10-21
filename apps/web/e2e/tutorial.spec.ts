import { expect, test, type Page } from "@playwright/test";
import type { TermFile } from "../src/lib/data/types";

const course = "AE 2410";
const term: TermFile = {
  term: { id: "2099-C", name: "C Term", season: "Spring", year: 2099, start: "2099-01-13", end: "2099-03-05" },
  generatedAt: "2026-10-21T12:00:00Z",
  courses: [{
    code: course, subject: "AE", title: "Applied Dynamics", credits: 3, level: "Undergraduate", description: "",
    sections: [540, 660].map((start, index) => ({
      id: `${course}-C0${index + 1}`, code: `C0${index + 1}`, type: "lecture",
      status: "open", capacity: 40, enrolled: 10, waitlist: { taken: 0, capacity: 0 },
      delivery: "in-person", instructors: ["Ye Lu"],
      meetings: [{ days: ["Mon"], start, end: start + 50, location: "Higgins Labs 116" }],
    })),
    options: [[`${course}-C01`], [`${course}-C02`]],
  }],
};
const otherTerm: TermFile = { ...term, term: { ...term.term, id: "2099-D", name: "D Term", start: "2099-03-15", end: "2099-05-05" } };

async function data(page: Page, current = term) {
  await page.route("**/data/index.json", (route) => route.fulfill({ json: { terms: [current, otherTerm].map((file) => ({
    ...file.term, status: "upcoming", courses: file.courses.length, sections: 2, generatedAt: file.generatedAt,
  })) } }));
  await page.route("**/data/2099-C.json", (route) => route.fulfill({ json: current }));
  await page.route("**/data/2099-D.json", (route) => route.fulfill({ json: otherTerm }));
}

const guide = (page: Page) => page.getByRole("region", { name: "First plan tutorial" });
const next = (page: Page) => guide(page).getByRole("button", { name: "Next", exact: true });
const choices = (page: Page) => page.getByRole("region", { name: "Your courses" });
const settled = (page: Page) => expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");

async function capture(page: Page, state: string, width: number) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `e2e/screenshots/tutorial-${state}-${width}.png`, fullPage: true, animations: "disabled" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
}

for (const width of [1440, 834]) {
  test(`guides a real plan by keyboard and remembers completion at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 834 ? 1194 : 900 });
    await data(page);
    await page.goto("/");
    await expect(guide(page).getByRole("heading", { name: "Choose your term" })).toBeFocused();
    await capture(page, "term", width);
    await page.keyboard.press("Tab");
    await expect(guide(page).getByRole("button", { name: "Choose a term" })).toBeFocused();
    await page.keyboard.press("Enter");
    const picker = page.getByRole("combobox", { name: "Term", exact: true });
    await expect(picker).toBeFocused();
    await picker.selectOption("2099-D");
    await expect(next(page)).toBeEnabled();
    await next(page).press("Enter");
    await expect(guide(page).getByRole("heading", { name: "Add your courses" })).toBeFocused();
    await expect(next(page)).toBeDisabled();
    await capture(page, "courses", width);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("searchbox")).toBeFocused();
    await page.keyboard.type(course);
    await page.keyboard.press("Enter");
    await settled(page);
    await next(page).press("Enter");
    await expect(guide(page).getByRole("heading", { name: "Set availability if you want" })).toBeFocused();
    await next(page).press("Enter");
    await expect(guide(page).getByRole("heading", { name: "Browse your schedules" })).toBeFocused();
    await capture(page, "browse", width);
    await guide(page).getByRole("button", { name: "Back", exact: true }).press("Enter");
    await expect(choices(page).getByRole("button", { name: `Remove ${course}` })).toBeVisible();
    await next(page).press("Enter");
    await guide(page).getByRole("button", { name: "Finish tutorial" }).press("Enter");
    await expect(guide(page)).toBeHidden();
    await expect(page.getByRole("region", { name: "Schedule browser" })).toBeFocused();
    const block = page.getByRole("region", { name: "Weekly schedule" }).getByRole("button", { name: /AE 2410 C0[12],/ });
    const firstSection = await block.getAttribute("aria-label");
    await page.getByRole("button", { name: "Next schedule", exact: true }).press("Enter");
    await expect(page.getByText("Schedule 2 of 2", { exact: true })).toBeVisible();
    await expect(block).toBeVisible();
    await expect(block).not.toHaveAttribute("aria-label", firstSection!);
    await capture(page, "dismissed", width);
    await page.reload();
    await settled(page);
    await expect(guide(page)).toBeHidden();
    await expect(choices(page).getByRole("button", { name: `Remove ${course}` })).toBeVisible();
    await picker.selectOption("2099-C");
    await expect(guide(page)).toBeHidden();
  });

  test(`skipping keeps a real course across reload and saved-plan opening at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 834 ? 1194 : 900 });
    await data(page);
    await page.goto("/");
    await next(page).click();
    await page.getByRole("searchbox").fill(course);
    await page.getByRole("searchbox").press("Enter");
    await settled(page);
    await guide(page).getByRole("button", { name: "Back", exact: true }).click();
    await expect(page.getByRole("combobox", { name: "Term", exact: true })).toHaveValue("2099-C");
    await next(page).click();
    await guide(page).getByRole("button", { name: "Skip tutorial" }).press("Enter");
    await expect(page.getByRole("searchbox")).toBeFocused();
    await page.reload();
    await settled(page);
    await expect(guide(page)).toBeHidden();
    await expect(choices(page).getByRole("button", { name: `Remove ${course}` })).toBeVisible();

    await page.getByRole("button", { name: "Save schedule", exact: true }).click();
    const save = page.getByRole("dialog", { name: "Save schedule", exact: true });
    await save.getByRole("textbox", { name: "Plan name" }).fill("My first plan");
    await save.getByRole("button", { name: "Save", exact: true }).click();
    await expect(save).toBeHidden();
    await page.getByRole("combobox", { name: "Starts after" }).selectOption("720");
    await settled(page);
    await page.getByRole("button", { name: "Saved plans", exact: true }).click();
    await page.getByRole("list", { name: "Saved plans for C Term · Spring 2099" }).getByRole("button", { name: /My first plan/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Open plan", exact: true }).click();
    await settled(page);
    await expect(page.getByRole("combobox", { name: "Starts after" })).toHaveValue("0");
    await expect(guide(page)).toBeHidden();
    await expect(choices(page).getByRole("button", { name: `Remove ${course}` })).toBeVisible();
    await page.getByRole("combobox", { name: "Term", exact: true }).selectOption("2099-D");
    await expect(choices(page).getByRole("button", { name: `Remove ${course}` })).toHaveCount(0);
    await expect(guide(page)).toBeHidden();
    await page.reload();
    await expect(page.getByRole("combobox", { name: "Term", exact: true })).toHaveValue("2099-D");
    await expect(guide(page)).toBeHidden();
  });

  test(`finishes without matches and leaves recovery available at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 834 ? 1194 : 900 });
    const closed = structuredClone(term);
    for (const section of closed.courses[0].sections) {
      section.status = "closed";
      section.enrolled = section.capacity!;
    }
    await data(page, closed);
    await page.goto("/");
    await next(page).click();
    await page.getByRole("searchbox").fill(course);
    await page.getByRole("searchbox").press("Enter");
    await settled(page);
    await expect(page.getByText("0 schedules fit", { exact: true })).toBeVisible();
    await next(page).click();
    await next(page).click();
    await guide(page).getByRole("button", { name: "Finish tutorial" }).click();
    await expect(guide(page)).toBeHidden();
    await expect(page.getByRole("region", { name: "Schedule browser" })).toBeFocused();
    await page.getByRole("switch", { name: "Only open sections" }).click();
    await settled(page);
    await expect(page.getByText("Schedule 1 of 2", { exact: true })).toBeVisible();
  });

  test(`an unavailable term disables advancement and can still be dismissed at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 834 ? 1194 : 900 });
    await data(page);
    await page.route("**/data/2099-D.json", (route) => route.abort());
    await page.goto("/");
    await expect(guide(page)).toBeVisible();
    await page.getByRole("combobox", { name: "Term", exact: true }).selectOption("2099-D");
    await expect(page.locator("[data-planner-term-status]")).toHaveAttribute("data-planner-term-status", "error");
    await expect(next(page)).toBeDisabled();
    await capture(page, "term-validation", width);
    await guide(page).getByRole("button", { name: "Close tutorial" }).press("Enter");
    await expect(guide(page)).toBeHidden();
    await expect(page.getByRole("combobox", { name: "Term", exact: true })).toBeFocused();
    await page.getByRole("combobox", { name: "Term", exact: true }).selectOption("2099-C");
    await expect(page.locator("[data-planner-term-status]")).toHaveAttribute("data-planner-term-status", "ready");
    await expect(guide(page)).toBeHidden();
  });

  test(`blocked browser storage does not prevent a real plan at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 834 ? 1194 : 900 });
    await page.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw new Error("Storage blocked"); } }));
    await data(page);
    await page.goto("/");
    await next(page).click();
    await page.getByRole("searchbox").fill(course);
    await page.getByRole("searchbox").press("Enter");
    await next(page).click();
    await next(page).click();
    await guide(page).getByRole("button", { name: "Finish tutorial" }).click();
    await settled(page);
    await expect(page.getByText("This browser couldn’t remember that you closed the guide. It may appear on your next visit.")).toBeVisible();
    await expect(choices(page).getByRole("button", { name: `Remove ${course}` })).toBeVisible();
    await page.getByRole("button", { name: "Next schedule", exact: true }).click();
    await expect(page.getByText("Schedule 2 of 2", { exact: true })).toBeVisible();
    await capture(page, "storage", width);
  });
}

test("a restored draft bypasses the guide, including later visits to an empty term", async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("tutorial-seeded")) return;
    sessionStorage.setItem("tutorial-seeded", "yes");
    localStorage.setItem("goatplan:term:v1", "2099-C");
    localStorage.setItem("goatplan:draft:v1:2099-C", JSON.stringify({ version: 1,
      courses: ["AE 2410"], preferences: { startsAfter: 600, blocked: [], onlyOpen: true },
      locks: {}, professorByCourse: {}, sortPreset: "fewestEarly", alternatives: {},
    }));
  });
  await data(page);
  await page.goto("/");
  await settled(page);
  await expect(guide(page)).toBeHidden();
  await expect(choices(page).getByRole("button", { name: `Remove ${course}` })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Starts after" })).toHaveValue("600");
  await page.getByRole("combobox", { name: "Term", exact: true }).selectOption("2099-D");
  await page.reload();
  await expect(page.locator("[data-planner-term-status]")).toHaveAttribute("data-planner-term-status", "ready");
  await expect(guide(page)).toBeHidden();
});
