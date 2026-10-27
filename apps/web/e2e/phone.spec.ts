import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import type { TermFile } from "../src/lib/data/types";

const source: TermFile = JSON.parse(readFileSync(path.join(__dirname, "../public/data/2027-C.json"), "utf8"));

/** Seeds a draft with the given courses, serves the term data, and waits for the first solve. */
async function openPlanner(page: Page, courses: string[]) {
  await page.route("**/data/2027-C.json", (route) => route.fulfill({ json: source }));
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
  await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute(
    "data-planner-solve-status",
    "done",
    { timeout: 30_000 },
  );
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
    // The disclosure is open when there are no courses.
    const toggle = page.getByRole("button", { name: /^Your courses/ });
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    // Search and add a course by tapping.
    const searchBox = page.getByLabel("Search courses");
    await searchBox.fill("AE 2320");
    const addButton = page.getByRole("button", { name: "Add AE 2320" });
    await expect(addButton).toBeVisible({ timeout: 5_000 });
    await addButton.tap();

    // The course should appear in the list.
    await expect(page.getByRole("button", { name: "AE 2320 added" })).toBeVisible();
    await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute(
      "data-planner-solve-status",
      "done",
      { timeout: 30_000 },
    );
  });

  test("opens and closes details in the bottom sheet", async ({ page }) => {
    await openPlanner(page, ["AE 2320", "AE 2410"]);
    // Open the disclosure to reach the course rows.
    await page.getByRole("button", { name: "Your courses (2)" }).click();
    await page.locator('[data-course-row="AE 2320"]').click();

    // The bottom sheet should appear.
    const sheet = page.getByRole("dialog", { name: "AE 2320" });
    await expect(sheet).toBeVisible();
    // Verify it's a full-width bottom sheet.
    const box = (await sheet.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.width).toBeGreaterThan(viewport.width - 2);

    // Close the sheet and verify the selection is kept.
    await sheet.getByRole("button", { name: "Close" }).click();
    await expect(sheet).toBeHidden();
    await expect(page.locator('[data-course-row="AE 2320"]')).toHaveAttribute("aria-current", "true");
  });

  test("the disclosure collapses after the first course is added", async ({ page }) => {
    await openPlanner(page, []);
    const toggle = page.getByRole("button", { name: /^Your courses/ });
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    // Add a course.
    await page.getByLabel("Search courses").fill("AE 2320");
    const addButton = page.getByRole("button", { name: "Add AE 2320" });
    await expect(addButton).toBeVisible({ timeout: 5_000 });
    await addButton.tap();

    // Wait for the solve to complete so the UI has settled.
    await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute(
      "data-planner-solve-status",
      "done",
      { timeout: 30_000 },
    );

    // The disclosure should collapse, showing the course code in a summary line.
    const updatedToggle = page.getByRole("button", { name: "Your courses (1)" });
    await expect(updatedToggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByText("AE 2320")).toBeVisible();
  });

  test("hides the sidebar and shows a single column", async ({ page }) => {
    await openPlanner(page, []);
    // The sidebar is hidden on a phone (hidden tablet:flex).
    await expect(page.getByRole("complementary", { name: "Term and courses" })).toBeHidden();
    await expect(page.getByRole("region", { name: "Weekly schedule" })).toBeVisible();
  });
});

test.describe("phone day calendar", () => {
  test("every class shows its time and room, visible and readable", async ({ page }) => {
    await openPlanner(page, ["AE 2320", "AE 2410"]);

    // The day calendar should be visible on a 375px phone viewport.
    const tablist = page.getByRole("tablist", { name: "Days of the week" });
    await expect(tablist).toBeVisible();

    // AE 2320 and AE 2410 both have Mon–Fri classes. Check that blocks are visible.
    // AE 2320 CL01: 9:00 AM–9:50 AM, Unity Hall 400
    // AE 2410 C01: 10:00 AM–10:50 AM, Higgins Labs 116
    const panel = page.getByRole("tabpanel");
    await expect(panel.getByText("9:00 AM–9:50 AM")).toBeVisible();
    await expect(panel.getByText("Unity Hall 400")).toBeVisible();
    await expect(panel.getByText("10:00 AM–10:50 AM")).toBeVisible();
    await expect(panel.getByText("Higgins Labs 116")).toBeVisible();

    // No sideways scroll with the day calendar
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("switching days by tap shows that day's classes", async ({ page }) => {
    await openPlanner(page, ["AE 2320", "AE 2410"]);

    const tablist = page.getByRole("tablist", { name: "Days of the week" });
    await expect(tablist).toBeVisible();

    // AE 2320 has a lab on Thursday (CX01 or CX02 depending on the schedule).
    // Tap the Thursday tab.
    const thuTab = page.getByRole("tab", { name: "Thu" });
    await thuTab.tap();
    await expect(thuTab).toHaveAttribute("aria-selected", "true");

    // The panel should show Thursday's lab (e.g., Higgins Labs 230).
    const panel = page.getByRole("tabpanel");
    await expect(panel.getByText(/Higgins Labs 230/)).toBeVisible();
  });

  test("tapping a class block opens the details sheet", async ({ page }) => {
    await openPlanner(page, ["AE 2320", "AE 2410"]);

    // Wait for the day calendar and find a class block to tap.
    const panel = page.getByRole("tabpanel");
    const classBlock = panel.getByRole("button", { name: /AE 2410 C01/ });
    await expect(classBlock).toBeVisible();
    await classBlock.tap();

    // The bottom sheet should appear with AE 2410 details.
    const sheet = page.getByRole("dialog", { name: "AE 2410" });
    await expect(sheet).toBeVisible();
  });

  test("no sideways scroll with the day calendar", async ({ page }) => {
    await openPlanner(page, ["AE 2320", "AE 2410"]);
    await expect(page.getByRole("tablist", { name: "Days of the week" })).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
