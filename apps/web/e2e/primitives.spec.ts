import { expect, test } from "@playwright/test";

const screenshotDir = "e2e/screenshots";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dev/ui");
});

test("dev page shows every primitive", async ({ page }) => {
  for (const name of [
    "Button",
    "Icon button",
    "Badge",
    "Chip",
    "Toggle",
    "Select",
    "Text input",
    "Card",
    "Dialog and sheet",
    "Toast",
    "Tooltip",
  ]) {
    await expect(page.getByRole("region", { name, exact: true })).toBeVisible();
  }
  await page.screenshot({ path: `${screenshotDir}/dev-ui-1440.png`, fullPage: true });
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.screenshot({ path: `${screenshotDir}/dev-ui-834.png`, fullPage: true });
});

test("toggle works with the keyboard", async ({ page }) => {
  const toggle = page.getByRole("switch", { name: "Only open sections" }).first();
  await expect(toggle).toBeChecked();
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).not.toBeChecked();
});

test("dialog keeps focus off the page behind, closes with Escape and returns focus", async ({ page }) => {
  const opener = page.getByRole("button", { name: "Open dialog" });
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Example dialog" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();
  await page.screenshot({ path: `${screenshotDir}/dev-ui-dialog.png` });

  // A native modal dialog lets Tab leave to the browser UI (body), but never to the inert page.
  for (let step = 0; step < 6; step += 1) {
    await page.keyboard.press("Tab");
    const focusOnPageBehind = await dialog.evaluate(
      (element) => document.activeElement !== document.body && !element.contains(document.activeElement),
    );
    expect(focusOnPageBehind).toBe(false);
  }

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("sheet opens from the right and closes with its close button", async ({ page }) => {
  const opener = page.getByRole("button", { name: "Open sheet" });
  await opener.click();
  const sheet = page.getByRole("dialog", { name: "Example sheet" });
  await expect(sheet).toBeVisible();
  const box = await sheet.boundingBox();
  expect(Math.round(box!.x + box!.width)).toBe(1440);
  await page.screenshot({ path: `${screenshotDir}/dev-ui-sheet.png` });
  await sheet.getByRole("button", { name: "Close" }).click();
  await expect(sheet).toBeHidden();
  await expect(opener).toBeFocused();
});

test("bottom sheet: full width at the bottom, focus on the heading and kept inside, Escape and the backdrop close it", async ({ page }) => {
  for (const [width, height] of [[375, 812], [1440, 900]] as const) {
    await page.setViewportSize({ width, height });
    const opener = page.getByRole("button", { name: "Open bottom sheet" });
    await opener.focus();
    await page.keyboard.press("Enter");
    const sheet = page.getByRole("dialog", { name: "Example bottom sheet" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("heading", { name: "Example bottom sheet" })).toBeFocused();
    // Wait for the slide-up to finish before measuring.
    await expect.poll(() => sheet.evaluate((element) => element.getAnimations().length)).toBe(0);
    const box = (await sheet.boundingBox())!;
    expect(box.x).toBe(0);
    expect(Math.round(box.width)).toBe(width);
    expect(Math.round(box.y + box.height)).toBe(height);
    expect(box.height).toBeLessThanOrEqual(height * 0.85 + 0.5);
    const look = await sheet.evaluate((element) => {
      const style = getComputedStyle(element);
      const body = getComputedStyle(element.firstElementChild!);
      return { top: style.borderTopLeftRadius, bottom: style.borderBottomLeftRadius, overflow: body.overflowY, transition: style.transitionProperty };
    });
    expect(look).toEqual({ top: "18px", bottom: "0px", overflow: "auto", transition: "translate" });
    if (width === 375) await page.screenshot({ path: `${screenshotDir}/dev-ui-bottom-sheet-375.png` });

    // Tab and Shift+Tab never leave the sheet, not even to the browser.
    for (let step = 0; step < 8; step += 1) {
      await page.keyboard.press(step % 3 === 2 ? "Shift+Tab" : "Tab");
      expect(await sheet.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(opener).toBeFocused();

    await opener.click();
    await expect(sheet).toBeVisible();
    await page.mouse.click(width / 2, 8);
    await expect(sheet).toBeHidden();
    await expect(opener).toBeFocused();
  }
});

test("bottom sheet and toast don't move with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Open bottom sheet" }).click();
  const sheet = page.getByRole("dialog", { name: "Example bottom sheet" });
  await expect(sheet).toBeVisible();
  expect(await sheet.evaluate((element) => getComputedStyle(element).transitionProperty)).toBe("none");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Remove MA 1024" }).click();
  const toast = page.getByRole("status").filter({ hasText: "Removed MA 1024" });
  expect(await toast.evaluate((element) => getComputedStyle(element.firstElementChild!).transitionProperty)).toBe("none");
});

test("toast: one message and Undo, bottom centre or full width on phone, never takes focus, times out", async ({ page }) => {
  const toast = page.getByRole("status").filter({ hasText: "Removed" });
  for (const [width, height] of [[1440, 900], [834, 1194], [375, 812]] as const) {
    await page.setViewportSize({ width, height });
    const remove = page.getByRole("button", { name: "Remove MA 1024" });
    await remove.click();
    await expect(toast).toHaveText("Removed MA 1024 · Undo");
    await expect(remove).toBeFocused();
    const box = toast.locator(":scope > div");
    await expect.poll(() => box.evaluate((element) => element.getAnimations().length)).toBe(0);
    const rect = (await box.boundingBox())!;
    expect(Math.round(height - rect.y - rect.height)).toBe(16);
    if (width === 375) {
      expect(Math.round(rect.x)).toBe(16);
      expect(Math.round(rect.width)).toBe(width - 32);
    } else {
      expect(Math.abs(rect.x + rect.width / 2 - width / 2)).toBeLessThanOrEqual(1);
      expect(rect.width).toBeLessThan(width - 32);
    }
    const look = await box.evaluate((element) => {
      const style = getComputedStyle(element);
      const undo = getComputedStyle(element.querySelector("button")!);
      return { size: style.fontSize, weight: style.fontWeight, radius: style.borderTopLeftRadius, padding: style.padding, gap: style.columnGap, undo: undo.fontWeight,
        dmSans: style.fontFamily.includes(getComputedStyle(document.documentElement).getPropertyValue("--font-dm-sans").split(",")[0].trim()) };
    });
    expect(look).toEqual({ size: "11px", weight: "570", radius: "10px", padding: "10px 14px", gap: "12px", undo: "650", dmSans: true });
    await page.screenshot({ path: `${screenshotDir}/dev-ui-toast-${width}.png` });

    // Undo with the keyboard.
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(toast.getByRole("button", { name: "Undo" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByText("MA 1024 is back.")).toBeVisible();
    await expect(toast).toHaveCount(0);
  }

  await page.getByRole("button", { name: "Remove CS 2022" }).click();
  await expect(toast).toHaveText("Removed CS 2022 · Undo");
  await page.mouse.move(0, 0);
  await expect(toast).toHaveCount(0, { timeout: 9_000 });
  await expect(page.getByText("The toast for CS 2022 timed out.")).toBeVisible();
});

test("tooltip opens on focus and Escape hides it", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Hover or focus me" });
  await trigger.focus();
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText("AE 2410 · C01");
  await page.screenshot({ path: `${screenshotDir}/dev-ui-tooltip.png` });
  await page.keyboard.press("Escape");
  await expect(tooltip).toBeHidden();
});

test("chip remove button and add chip work with the keyboard", async ({ page }) => {
  const remove = page.getByRole("button", { name: "Remove Work block" });
  await remove.focus();
  await page.keyboard.press("Enter");
  await expect(remove).toHaveCount(0);
  await page.getByRole("button", { name: "Block a time" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Remove Work block" })).toHaveCount(1);
});
