import { expect, test } from "@playwright/test";
import { coursePanelTerm } from "./fixtures/coursePanel";

for (const width of [1440, 834]) {
  test(`calendar blocks show details only on activation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 834 ? 1194 : 800 });
    const data = coursePanelTerm("07");
    data.instructors = { "Mark Richman": { rating: { score: 4.4, count: 27 }, ratingSource: "Example data" } };
    await page.route("**/data/2027-C.json", (route) => route.fulfill({ json: data }));
    await page.addInitScript(() => {
      localStorage.setItem("goatplan:tutorial:v1", "completed");
      localStorage.setItem("goatplan:term:v1", "2027-C");
      localStorage.setItem("goatplan:draft:v1:2027-C", JSON.stringify({
        version: 1, courses: ["AE 2320", "AE 2410", "AE 2210"],
        preferences: { startsAfter: 540, onlyOpen: true, blocked: [
          { day: "Tue", start: 840, end: 960, label: "Work" },
          { day: "Fri", start: 840, end: 960, label: "Work" },
        ] },
        locks: { "AE 2320": ["AE 2320-CX02"] }, professorByCourse: { "AE 2320": "Ye Lu" },
        sortPreset: "fewestEarly", alternatives: {},
      }));
    });
    await page.goto("/");
    await expect(page.locator("[data-planner-solve-status]").last()).toHaveAttribute("data-planner-solve-status", "done", { timeout: 30_000 });
    const lab = page.getByRole("button", { name: /^AE 2320 CX02, .*Thursday/ });
    await lab.click();
    const lecture = page.getByRole("button", { name: /^AE 2410 C01, .*Tuesday/ });
    await lecture.hover();

    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await expect(lecture).not.toContainText(/OSCAR|Rate My Professors/);
    const panel = page.getByRole("complementary", { name: "Course details" });
    await expect(panel.getByRole("heading", { level: 2, name: "AE 2320" })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `e2e/screenshots/calendar-no-popup-hover-${width}.png`, animations: "disabled", fullPage: true });

    await page.mouse.move(0, 0);
    const precedingLecture = page.getByRole("button", { name: /^AE 2320 CL01, .*Tuesday/ });
    await precedingLecture.focus();
    await page.keyboard.press("Tab");
    await expect(lecture).toBeFocused();
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await expect(panel.getByRole("heading", { level: 2, name: "AE 2320" })).toBeVisible();
    await expect(page).toHaveScreenshot(`calendar-no-popup-focus-${width}.png`, { animations: "disabled", fullPage: true });
    await page.screenshot({ path: `e2e/screenshots/calendar-no-popup-focus-${width}.png`, animations: "disabled", fullPage: true });

    await page.keyboard.press("Enter");
    await expect(panel.getByRole("heading", { level: 2, name: "AE 2410" })).toBeVisible();
    const professor = panel.getByRole("group", { name: "Mark Richman" });
    await expect(professor.getByRole("link", { name: "View Mark Richman in OSCAR (opens in a new tab)" })).toBeVisible();
    await expect(professor).not.toContainText(/\/ 5|ratings/);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await lab.click();
    await expect(panel.getByRole("heading", { level: 2, name: "AE 2320" })).toBeVisible();
    await expect(lab).toHaveAttribute("aria-pressed", "true");
  });
}
