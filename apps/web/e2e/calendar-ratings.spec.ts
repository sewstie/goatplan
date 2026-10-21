import { expect, test } from "@playwright/test";
import { coursePanelTerm } from "./fixtures/coursePanel";

test.use({ viewport: { width: 1440, height: 800 } });

test("lecture ratings appear in matching hover and keyboard focus details at 1440", async ({ page }) => {
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

  const tooltip = page.getByRole("tooltip");
  const row = tooltip.getByRole("group");
  await expect(row).toContainText("Mark Richman");
  await expect(row).toContainText("4.4 / 5");
  await expect(row).toContainText("27 ratings");
  await expect(lecture).toHaveAccessibleDescription(/4\.4 \/ 5.*27 ratings/);
  await expect(lecture).not.toContainText(/\/ 5|ratings/);
  const hoveredDetails = await tooltip.innerText();
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot("calendar-rating-hover-1440.png", { animations: "disabled" });
  await page.screenshot({ path: "e2e/screenshots/calendar-rating-hover-1440.png", animations: "disabled" });

  await page.mouse.move(0, 0);
  await expect(tooltip).toHaveCount(0);
  const precedingLecture = page.getByRole("button", { name: /^AE 2320 CL01, .*Tuesday/ });
  await precedingLecture.focus();
  await page.keyboard.press("Tab");
  await expect(lecture).toBeFocused();
  await expect(tooltip).toHaveText(hoveredDetails, { useInnerText: true });
  await expect(lecture).toHaveAccessibleDescription(/4\.4 \/ 5.*27 ratings/);
  await expect(page).toHaveScreenshot("calendar-rating-focus-1440.png", { animations: "disabled" });
  await page.screenshot({ path: "e2e/screenshots/calendar-rating-focus-1440.png", animations: "disabled" });
  await page.keyboard.press("Escape");
  await expect(tooltip).toHaveCount(0);
});
