import { expect, test } from "./fixtures/test";
import { fixtureHistory, openDegree, openHistory, panel } from "./fixtures/degree";

for (const width of [1440, 834, 375]) {
  test(`the restored degree sheet fits at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 834 ? 1112 : 900 });
    const history = fixtureHistory("degree-history-mid.json");
    await openDegree(page, {
      ...history,
      courses: history.courses.map((course, index) => ({ ...course, term: index % 2 === 0 ? "A Term 2026" : "B Term 2026" })),
    });
    await expect(page.getByRole("region", { name: "Your sheet" })).toBeVisible();
    await expect(page.getByText("Looking through this term’s courses…")).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `e2e/screenshots/degree-restored-${width}.png`, animations: "disabled", fullPage: true });
    await openHistory(page);
    await expect(panel(page, "Course history")).toBeVisible();
    await page.screenshot({ path: `e2e/screenshots/degree-history-restored-${width}.png`, animations: "disabled" });
  });
}
