import type { Page } from "@playwright/test";
import { expect, frozenTerm, openCourseDetails, test } from "./fixtures/test";

async function openPlanner(page: Page, width: number, courses: string[] = []) {
  await page.setViewportSize({ width, height: 1000 });
  await page.addInitScript((courses) => {
    localStorage.setItem("goatplan:term:v1", "2027-C");
    localStorage.setItem("goatplan:tutorial:v1", "dismissed");
    localStorage.setItem("goatplan:draft:v1:2027-C", JSON.stringify({ version: 1, courses, preferences: { startsAfter: 0, blocked: [], onlyOpen: false }, locks: {}, professorByCourse: {}, sortPreset: "bestOverall", alternatives: {} }));
  }, courses);
  await page.goto("/");
  await expect(page.locator("[data-planner-term-status]")).toHaveAttribute("data-planner-term-status", "ready", { timeout: 30_000 });
}

for (const width of [1440, 834, 375]) {
  test(`live seats say how fresh they are at ${width}px`, async ({ page }) => {
    await openPlanner(page, width);
    const freshness = page.getByRole("status", { name: "Seat freshness" });
    await expect(freshness).toHaveText("Seats updated just now");
    await expect(page.getByText("Confirm in Workday before you register.")).toBeVisible();
    const box = await freshness.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
  });

  test(`failed live seats keep the daily data and offer Retry at ${width}px`, async ({ page }) => {
    let fail = true;
    await page.route("**/api/seats?*", (route) => (fail ? route.fulfill({ status: 503, json: { error: "unavailable" } }) : route.fallback()));
    await openPlanner(page, width);
    const freshness = page.getByRole("status", { name: "Seat freshness" });
    await expect(freshness.locator("time")).toHaveAttribute("datetime", frozenTerm("2027-C").generatedAt);
    await expect(freshness).toContainText(/^Seats from [A-Z][a-z]{2} \d+/);
    await expect(page.getByText("Confirm in Workday before you register.")).toBeVisible();

    fail = false;
    const retry = page.getByRole("button", { name: "Retry getting the latest seats" });
    await expect(retry).toHaveText("Retry");
    await retry.click();
    await expect(freshness).toHaveText("Seats updated just now");
    await expect(retry).toHaveCount(0);
  });
}

test("live seat counts replace the daily ones in course details", async ({ page }) => {
  const lecture = frozenTerm("2027-C").courses.find((course) => course.code === "AE 2320")!.sections.find((section) => section.type === "lecture")!;
  await page.route("**/api/seats?term=2027-C", (route) => route.fulfill({ json: {
    termId: "2027-C",
    fetchedAt: new Date().toISOString(),
    sections: [{ id: lecture.id, status: "open", enrolled: lecture.capacity - 3, capacity: lecture.capacity, waitlist: lecture.waitlist }],
  } }));
  await openPlanner(page, 1440, ["AE 2320"]);
  await openCourseDetails(page, "AE 2320");
  await expect(page.getByRole("complementary", { name: "Course details" })).toContainText(`3 of ${lecture.capacity} seats open`);
});
