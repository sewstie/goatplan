import { expect, openMoreActions, test } from "./fixtures/test";
import { auditReady, fixtureHistory, openDegree, openHistory, panel } from "./fixtures/degree";

test("the degree phone menu changes the global theme with the keyboard", async ({ page }) => {
  await openDegree(page, fixtureHistory("degree-history-mid.json"));
  await openMoreActions(page);
  const theme = page.getByRole("switch", { name: "Dark theme" });
  await expect(theme).toBeVisible();
  await expect(theme).not.toBeChecked();
  await theme.focus();
  await page.keyboard.press("Space");
  await expect(theme).toBeChecked();
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "More actions" })).toBeFocused();
  await page.reload();
  await auditReady(page);
  await openMoreActions(page);
  await expect(theme).toBeChecked();
});

for (const theme of ["light", "dark"]) {
  test(`phone degree panels and confirmations work in ${theme}`, async ({ page }) => {
    await page.addInitScript((theme) => localStorage.setItem("goatplan:theme:v1", theme), theme);
    await openDegree(page, fixtureHistory("degree-history-mid.json"));
    await expect(page.getByText("Looking through this term’s courses…")).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    const capture = (name: string) => page.screenshot({ path: `e2e/screenshots/degree-theme-${name}-${theme}-375.png`, animations: "disabled", fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    await capture("sheet");
    await openHistory(page);
    await capture("history");
    await panel(page, "Course history").getByRole("button", { name: "CS 2022 details" }).click();
    await expect(panel(page, "Course details")).toBeVisible();
    await capture("details");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Sheet options" }).click();
    await page.getByRole("button", { name: "Your confirmations", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Your confirmations" })).toBeVisible();
    const iqp = page.getByRole("checkbox", { name: "IQP completed" });
    await iqp.focus();
    await page.keyboard.press("Space");
    await expect(iqp).toBeChecked();
    await capture("confirmations");
    await page.getByRole("button", { name: "Save confirmations" }).click();
    await auditReady(page);
    await page.getByRole("button", { name: "Sheet options" }).click();
    await page.getByRole("button", { name: "Your confirmations", exact: true }).click();
    await expect(iqp).toBeChecked();
    await openMoreActions(page);
    await expect(page.getByRole("switch", { name: "Dark theme" })).toHaveAttribute("aria-checked", String(theme === "dark"));
    await page.keyboard.press("Escape");
  });
}
