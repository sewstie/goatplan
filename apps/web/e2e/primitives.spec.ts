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
