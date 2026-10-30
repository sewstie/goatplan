import { expect, test } from "./fixtures/test";
import type { Page } from "@playwright/test";

/** Seeds a draft with the given courses and waits for the term, and for the first solve when there are courses. */
async function openPlanner(page: Page, courses: string[]) {
  await page.addInitScript((seeded) => {
    localStorage.setItem("goatplan:term:v1", "2027-C");
    localStorage.setItem("goatplan:tutorial:v1", "dismissed");
    localStorage.setItem(
      "goatplan:draft:v1:2027-C",
      JSON.stringify({
        version: 1,
        courses: seeded,
        preferences: { startsAfter: 0, blocked: [], onlyOpen: true },
        locks: {},
        professorByCourse: {},
        sortPreset: "fewestEarly",
        alternatives: {},
      }),
    );
  }, courses);
  await page.goto("/");
  const status = page.locator("[data-planner-solve-status]");
  // An empty plan sends nothing to the engine, so its solve status stays idle.
  if (courses.length === 0) await expect(status).toHaveAttribute("data-planner-term-status", "ready");
  else await expect(status).toHaveAttribute("data-planner-solve-status", "done", { timeout: 30_000 });
}

const settled = (page: Page) =>
  expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done", { timeout: 30_000 });

/** Taps the search box look-alike on the schedule screen and lands on "Find a course". */
async function openSearch(page: Page) {
  await page.getByRole("button", { name: "Course code or professor . Find a course" }).tap();
  await expect(page.getByRole("heading", { level: 1, name: "Find a course" })).toBeVisible();
}

test.describe("phone shell", () => {
  test("has no sideways scroll on the planner", async ({ page }) => {
    await openPlanner(page, ["AE 2320", "AE 2410"]);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("add a course by touch", async ({ page }) => {
    await openPlanner(page, []);
    await expect(page.getByRole("list", { name: "Your courses" })).toHaveCount(0);

    await openSearch(page);
    await page.getByRole("searchbox", { name: "Search courses" }).fill("AE 2320");
    const addButton = page.getByRole("button", { name: "Add AE 2320" });
    await expect(addButton).toBeVisible();
    await addButton.tap();

    await expect(page.getByRole("button", { name: "AE 2320 added" })).toBeVisible();
    await settled(page);
  });

  test("opens a course's details as its own screen and goes back to the schedule", async ({ page }) => {
    await openPlanner(page, ["AE 2320", "AE 2410"]);
    await page.getByRole("button", { name: "AE 2320. Show details" }).tap();

    const details = page.getByRole("region", { name: "Course details" });
    await expect(details.getByRole("heading", { level: 2, name: "AE 2320" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Schedule planner" })).toBeHidden();
    const box = (await details.boundingBox())!;
    expect(box.width).toBeGreaterThan(page.viewportSize()!.width - 40);

    await page.getByRole("button", { name: "Back to schedule" }).tap();
    await expect(details).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: "Schedule planner" })).toBeVisible();
    await expect(page.getByRole("button", { name: "AE 2320. Show details" })).toBeVisible();
  });

  test("the first added course shows up as a chip back on the schedule", async ({ page }) => {
    await openPlanner(page, []);
    await openSearch(page);
    await page.getByRole("searchbox", { name: "Search courses" }).fill("AE 2320");
    await page.getByRole("button", { name: "Add AE 2320" }).tap();
    await settled(page);

    await page.getByRole("button", { name: "Back to schedule" }).tap();
    const chips = page.getByRole("list", { name: "Your courses" });
    await expect(chips.getByRole("button")).toHaveText(["AE 2320"]);
    await expect(page.getByRole("group", { name: "Calendar time grid" }).getByRole("button", { name: /^AE 2320 CL01/ }).first()).toBeVisible();
  });

  test("hides the sidebar and shows a single column", async ({ page }) => {
    await openPlanner(page, []);
    // The sidebar is hidden on a phone (hidden tablet:flex).
    await expect(page.getByRole("complementary", { name: "Term and courses" })).toBeHidden();
    await expect(page.getByRole("region", { name: "Weekly schedule" })).toBeVisible();
  });
});

test.describe("phone week calendar", () => {
  const grid = (page: Page) => page.getByRole("group", { name: "Calendar time grid" });

  test("every class shows its time and room, visible and readable", async ({ page }) => {
    await openPlanner(page, ["AE 2320", "AE 2410"]);

    // AE 2320 CL01 meets 9:00–9:50 AM in Unity Hall 400, AE 2410 C01 10:00–10:50 AM in Higgins Labs 116.
    const monday = grid(page).getByRole("group", { name: "Monday" });
    for (const text of ["9:00 AM–9:50 AM", "Unity Hall 400", "10:00 AM–10:50 AM", "Higgins Labs 116"]) {
      await expect(monday.getByText(text)).toBeInViewport();
    }

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("swiping shows the later days' classes", async ({ page }) => {
    await openPlanner(page, ["AE 2320", "AE 2410"]);

    // AE 2320's Thursday lab is in Higgins Labs 230, off to the right until the week is swiped. It's
    // below the fold at 2 PM, so only its sideways position is checked against the calendar's.
    const lab = grid(page).getByRole("group", { name: "Thursday" }).getByText(/Higgins Labs 230/);
    const across = async () => {
      const [box, frame] = [await lab.boundingBox(), await grid(page).boundingBox()];
      return box!.x >= frame!.x && box!.x + box!.width <= frame!.x + frame!.width;
    };
    expect(await across()).toBe(false);
    await page.getByRole("button", { name: "Swipe for more days" }).tap();
    await expect.poll(across).toBe(true);
  });

  test("tapping a class block opens its course details", async ({ page }) => {
    await openPlanner(page, ["AE 2320", "AE 2410"]);

    await grid(page).getByRole("group", { name: "Monday" }).getByRole("button", { name: /^AE 2410 C01/ }).tap();
    await expect(page.getByRole("region", { name: "Course details" }).getByRole("heading", { level: 2, name: "AE 2410" })).toBeVisible();
  });

  test("no sideways scroll with the week calendar", async ({ page }) => {
    await openPlanner(page, ["AE 2320", "AE 2410"]);
    await expect(grid(page)).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
