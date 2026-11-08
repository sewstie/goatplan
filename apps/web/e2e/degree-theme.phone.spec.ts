import { expect, test } from "./fixtures/test";
import { auditReady, fixtureHistory, openDegree, openHistory, panel } from "./fixtures/degree";

test("the degree phone theme button changes the global theme with the keyboard", async ({ page }) => {
  await openDegree(page, fixtureHistory("degree-history-mid.json"));
  const toDark = page.getByRole("button", { name: "Switch to dark theme" });
  await toDark.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeFocused();
  await page.reload();
  await auditReady(page);
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
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
    await panel(page, "Course history").getByRole("button", { name: "Edit CS 2022" }).click();
    await expect(panel(page, "Edit course")).toBeVisible();
    await capture("details");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: theme === "dark" ? "Switch to light theme" : "Switch to dark theme" })).toBeVisible();
  });
}
