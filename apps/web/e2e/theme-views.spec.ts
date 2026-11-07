import { readFile } from "node:fs/promises";
import { expect, openMoreActions, test } from "./fixtures/test";
import { seedThemePlan, selectTheme } from "./fixtures/theme";

test("saved plans and registration retain the global theme and offer a keyboard toggle", async ({ page }) => {
  const plan = await seedThemePlan(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/plans");
  await expect(page.getByRole("heading", { name: "Your saved plans" })).toBeVisible();
  const dark = page.getByRole("button", { name: "Switch to dark theme" });
  await expect(dark).toBeVisible();
  await dark.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  await page.getByRole("link", { name: "Sections to register Plan 1", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/plans\\?plan=${plan.id}`));
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(5);
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.getByRole("link", { name: "Back to planner" }).click();
  await expect(dark).toBeVisible();
  await page.reload();
  await expect(dark).toBeVisible();
});

for (const width of [1440, 834, 375]) {
  test(`current planner views and exported data work in both themes at ${width}px`, async ({ page }) => {
    const plan = await seedThemePlan(page);
    await page.setViewportSize({ width, height: width === 834 ? 1112 : 900 });
    await page.clock.setFixedTime(new Date("2026-11-04T18:00:00Z"));
    const links: string[] = [];
    const calendars: string[] = [];
    const sectionLists: string[] = [];

    for (const theme of ["light", "dark"] as const) {
      await page.goto("/");
      await expect(page.locator("[data-planner-solve-status]").last()).toHaveAttribute("data-planner-solve-status", "done");
      await selectTheme(page, theme, width);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `e2e/screenshots/theme-release-planner-${theme}-${width}.png`, fullPage: true, animations: "disabled" });
      await openMoreActions(page);
      await page.getByRole("button", { name: "Share", exact: true }).click();
      const share = page.getByRole("dialog", { name: "Share this schedule" });
      const link = share.getByRole("textbox", { name: "Anyone with the link can view a snapshot" });
      links.push(await link.inputValue());
      await expect(share).toContainText("3 courses");
      await share.getByText("What’s included", { exact: true }).click();
      await expect(share).toContainText("Blocked-time names, My degree and course history stay private.");
      await page.screenshot({ path: `e2e/screenshots/theme-release-share-${theme}-${width}.png`, animations: "disabled" });
      await page.keyboard.press("Escape");
      await expect(share).toBeHidden();
      if (width < 768) await expect(page.getByRole("button", { name: "More actions" })).toHaveAttribute("aria-expanded", "false");
      await openMoreActions(page);
      await page.getByRole("button", { name: "Export", exact: true }).click();
      const calendar = page.getByRole("dialog", { name: "Export to calendar" });
      await expect(calendar).toContainText("4 classes");
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        calendar.getByRole("button", { name: "Download .ics" }).click(),
      ]);
      calendars.push(await readFile(await download.path(), "utf8"));
      await expect(calendar.getByRole("status")).toContainText("Downloaded");
      await page.screenshot({ path: `e2e/screenshots/theme-release-export-${theme}-${width}.png`, animations: "disabled" });
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: width < 768 ? "How to use GoatPlan" : "Guide", exact: true }).click();
      const guide = page.getByRole("dialog", { name: "Pick your term" });
      await expect(guide).toBeVisible();
      await page.screenshot({ path: `e2e/screenshots/theme-release-guide-${theme}-${width}.png`, animations: "disabled" });
      await guide.getByRole("button", { name: "Skip", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: "Guide closed · Replay it from How to use" })).toBeVisible();
      await page.screenshot({ path: `e2e/screenshots/theme-release-toast-${theme}-${width}.png`, animations: "disabled" });

      await page.goto("/plans");
      await expect(page.getByRole("heading", { name: "Your saved plans" })).toBeAttached();
      await expect(page.locator("[data-planner-term-status]").last()).toHaveAttribute("data-planner-term-status", "ready");
      await expect(page.getByRole("link", { name: "Sections to register Plan 1", exact: true })).toBeVisible();
      await expect(page.locator("html")).toHaveCSS("color-scheme", theme);
      await page.screenshot({ path: `e2e/screenshots/theme-release-saved-${theme}-${width}.png`, fullPage: true, animations: "disabled" });
      await page.getByRole("button", { name: "Rename Plan 1", exact: true }).click();
      const rename = page.getByRole("dialog", { name: "Rename plan" });
      await expect(rename.getByRole("textbox", { name: "Plan name" })).toHaveValue("Plan 1");
      await page.screenshot({ path: `e2e/screenshots/theme-release-rename-${theme}-${width}.png`, animations: "disabled" });
      await page.keyboard.press("Escape");
      await page.getByRole("link", { name: "Sections to register Plan 1", exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/plans\\?plan=${plan.id}`));
      await expect(page.getByRole("button", { name: "Copy section list", exact: true })).toBeVisible();
      await expect(page.locator("html")).toHaveCSS("color-scheme", theme);
      await page.screenshot({ path: `e2e/screenshots/theme-release-registration-${theme}-${width}.png`, fullPage: true, animations: "disabled" });
      await page.emulateMedia({ media: "print" });
      await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
      await expect(page.getByRole("heading", { name: "Sections to register", exact: true })).toBeVisible();
      await expect(page.getByRole("button")).toHaveCount(0);
      const list = page.locator("pre:visible");
      sectionLists.push(await list.innerText());
      await expect(list).toHaveCSS("color", "rgb(32, 35, 43)");
      await page.screenshot({ path: `e2e/screenshots/theme-release-print-${theme}-${width}.png`, fullPage: true, animations: "disabled" });
      await page.emulateMedia({ media: "screen" });
      await expect(page.locator("html")).toHaveCSS("color-scheme", theme);
      await page.goto(links.at(-1)!);
      await expect(page.getByRole("heading", { name: "Shared schedule" })).toBeVisible();
      await expect(page.locator("html")).toHaveCSS("color-scheme", theme);
      await page.screenshot({ path: `e2e/screenshots/theme-release-shared-${theme}-${width}.png`, fullPage: true, animations: "disabled" });
    }
    expect(links[1]).toBe(links[0]);
    expect(calendars[1]).toBe(calendars[0]);
    expect(calendars[0]).toContain("SUMMARY:AE 2410 Lecture C01");
    expect(sectionLists).toEqual([
      "AE 2320 — CL01 (lecture), CX02 (lab)\nAE 2410 — C01 (lecture)\nAE 2210 — C01 (lecture)",
      "AE 2320 — CL01 (lecture), CX02 (lab)\nAE 2410 — C01 (lecture)\nAE 2210 — C01 (lecture)",
    ]);
  });
}

