import { expect, test } from "./fixtures/test";
import { auditReady } from "./fixtures/degree";

for (const width of [1440, 834, 375]) {
  test(`first visit chooses a major before entering history at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem("goatplan:tutorial:v1", "dismissed");
      localStorage.setItem("goatplan:term:v1", "2027-C");
    });
    await page.goto("/degree");
    await expect(page.getByRole("heading", { name: "Choose your major" })).toBeVisible();
    await expect(page.getByText("For the Class of 2030, starting A Term 2026.")).toBeVisible();
    await expect(page.getByText("Other class years, minors and double majors aren’t supported yet.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Find your courses" })).toHaveCount(0);
    await page.screenshot({ path: `e2e/screenshots/degree-major-picker-${width}.png`, fullPage: true, animations: "disabled" });
    await expect(page.getByRole("radio", { name: "Computer Science" })).toBeChecked();
    await page.getByRole("button", { name: "Open my sheet" }).click();
    await auditReady(page);
    await expect(page.locator(".degree-major")).toContainText("Computer Science");
    await expect(page.locator(".degree-major")).toContainText("Class of 2030");
    await page.reload();
    await auditReady(page);
    await expect(page.getByRole("heading", { name: "Choose your major" })).toHaveCount(0);
    await page.getByRole("button", { name: "Change major" }).click();
    const change = page.getByRole("dialog", { name: "Choose your major" });
    await expect(change).toBeVisible();
    await change.getByRole("button", { name: "My major isn’t listed" }).click();
    await expect(change.getByRole("button", { name: "Request this major" })).toBeVisible();
    await expect(change.getByRole("button", { name: "Open my sheet" })).toHaveCount(0);
    await page.screenshot({ path: `e2e/screenshots/degree-major-change-${width}.png`, fullPage: true, animations: "disabled" });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Change major" })).toBeFocused();
    await page.screenshot({ path: `e2e/screenshots/degree-major-${width}.png`, fullPage: true });
  });
}
