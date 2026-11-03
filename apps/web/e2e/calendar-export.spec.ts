import { readFile } from "node:fs/promises";
import { expect, test, openMoreActions } from "./fixtures/test";

for (const width of [1440, 834, 375]) {
  test(`Export downloads the classes by keyboard at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem("goatplan:tutorial:v1", "completed");
      localStorage.setItem("goatplan:term:v1", "2027-C");
      localStorage.setItem("goatplan:draft:v1:2027-C", JSON.stringify({ version: 1, courses: ["AE 2410", "AE 5131"], locks: {}, professorByCourse: {}, preferences: { startsAfter: 0, blocked: [{ day: "Sat", start: 600, end: 660, label: "Private appointment" }], onlyOpen: false }, sortPreset: "fewestEarly", alternatives: {} }));
    });
    await page.goto("/");
    await expect(page.locator("[data-planner-term-status]")).toHaveAttribute("data-planner-term-status", "ready");
    await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");

    await openMoreActions(page);
    const button = page.getByRole("button", { name: "Export", exact: true });
    await expect(button).toBeVisible();
    const save = page.getByRole("button", { name: /^Save( schedule)?$/ });
    await expect(save).toBeEnabled();
    const saveBox = (await save.boundingBox())!;
    expect(saveBox.x + saveBox.width).toBeLessThanOrEqual(width - 12);
    await button.focus();
    await page.keyboard.press("Enter");
    const review = page.getByRole("dialog", { name: "Export to calendar" });
    await expect(review).toContainText("1 class · Jan 13–Mar 5, 2027 · 1 left out");
    await expect(review.getByText("Feb 25 · Academic Advising Day")).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `e2e/screenshots/calendar-export-review-${width}.png` });
    await review.getByText("Details", { exact: true }).click();
    await expect(review.getByText("Feb 25 · Academic Advising Day")).toBeVisible();
    await expect(review).toContainText("No set time, so left out: AE 5131 · C01");
    await page.screenshot({ path: `e2e/screenshots/calendar-export-details-${width}.png` });
    await review.getByRole("button", { name: "Download .ics" }).focus();
    const [download] = await Promise.all([page.waitForEvent("download"), page.keyboard.press("Enter")]);

    expect(download.suggestedFilename()).toBe("GoatPlan-C-Term-2027.ics");
    const text = await readFile(await download.path(), "utf8");
    expect(text.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(text.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(text).toContain("TZID:America/New_York");
    expect(text).toMatch(/SUMMARY:AE 2410 Lecture \w+\r\n/);
    expect(text).toMatch(/DTSTART;TZID=America\/New_York:202701\d\dT\d{6}\r\n/);
    expect(text).toMatch(/RRULE:FREQ=WEEKLY;BYDAY=[A-Z,]+;UNTIL=20270306T045959Z\r\n/);
    expect(text).not.toContain("AE 5131");
    expect(text).not.toContain("Private appointment");
    expect(text).not.toContain("BYDAY=SA");

    const dialog = review;
    await expect(dialog.getByRole("status")).toHaveText("Downloaded ✓ GoatPlan-C-Term-2027.ics");
    await expect(dialog.getByRole("button", { name: "Download again" })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `e2e/screenshots/calendar-export-dialog-${width}.png` });

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    // On a phone, Export sits in the "⋯" menu, which closes with the sheet.
    await expect(width < 768 ? page.getByRole("button", { name: "More actions" }) : button).toBeFocused();
    await page.screenshot({ path: `e2e/screenshots/calendar-export-header-${width}.png` });
  });
}

test("the button is disabled until there is a schedule", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("goatplan:tutorial:v1", "completed");
    localStorage.setItem("goatplan:term:v1", "2027-C");
  });
  await page.goto("/");
  await expect(page.locator("[data-planner-term-status]")).toHaveAttribute("data-planner-term-status", "ready");
  await expect(page.getByRole("button", { name: "Export", exact: true })).toBeDisabled();
});

test("Export is a popover under its button that a click outside closes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    localStorage.setItem("goatplan:tutorial:v1", "completed");
    localStorage.setItem("goatplan:term:v1", "2027-C");
    localStorage.setItem("goatplan:draft:v1:2027-C", JSON.stringify({ version: 1, courses: ["AE 2410"], locks: {}, professorByCourse: {}, preferences: { startsAfter: 0, blocked: [], onlyOpen: false }, sortPreset: "fewestEarly", alternatives: {} }));
  });
  await page.goto("/");
  await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");
  const button = page.getByRole("button", { name: "Export", exact: true });
  await button.click();
  const popover = page.getByRole("dialog", { name: "Export to calendar" });
  await expect(popover).toBeVisible();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  const anchor = (await button.boundingBox())!;
  const box = (await popover.boundingBox())!;
  expect(box.width).toBe(360);
  expect(box.y).toBeGreaterThan(anchor.y + anchor.height);
  expect(Math.round(box.x + box.width)).toBe(Math.round(anchor.x + anchor.width));
  // No backdrop: the page behind stays clickable.
  await page.mouse.click(700, 600);
  await expect(popover).toBeHidden();
  await expect(button).toHaveAttribute("aria-expanded", "false");
});

