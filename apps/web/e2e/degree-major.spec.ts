import { expect, test } from "./fixtures/test";
import { auditReady, DEGREE_FLAG_KEY } from "./fixtures/degree";

for (const width of [1440, 834, 375]) {
  test(`first visit chooses a major before entering history at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript((flag) => {
      localStorage.setItem(flag, "on");
      localStorage.setItem("goatplan:tutorial:v1", "dismissed");
      localStorage.setItem("goatplan:term:v1", "2027-C");
    }, DEGREE_FLAG_KEY);
    await page.goto("/degree");
    if (width === 375) await page.getByRole("button", { name: "Choose your major" }).click();
    await expect(page.getByRole("heading", { name: "What's your major?" })).toBeVisible();
    await expect(page.getByText("Class of 2030", { exact: true })).toBeVisible();
    await expect(page.getByText("Minors and double majors aren't supported yet")).toBeVisible();
    await expect(page.getByRole("button", { name: "Find your courses" })).toHaveCount(0);
    await page.screenshot({ path: `e2e/screenshots/degree-major-picker-${width}.png`, fullPage: true, animations: "disabled" });
    const picker = page.getByRole("combobox", { name: "Major", exact: true });
    await picker.focus();
    await picker.press("c");
    await picker.press("Enter");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await auditReady(page);
    await expect(page.getByText("Computer Science · Class of 2030 · Beta", { exact: true })).toBeVisible();
    await expect(page.getByText("Not yet checked by a CS student. Tell us if something looks wrong.")).toBeVisible();
    await page.reload();
    await auditReady(page);
    await expect(page.getByRole("heading", { name: "What's your major?" })).toHaveCount(0);
    await page.getByRole("button", { name: "Change major" }).click();
    await expect(page.getByRole("dialog", { name: "What's your major?" })).toBeVisible();
    await page.getByRole("combobox", { name: "Major", exact: true }).click();
    await page.getByRole("option", { name: "Another major · Coming soon", exact: true }).click();
    await expect(page.getByRole("button", { name: "Request this major" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue", exact: true })).toHaveCount(0);
    await page.screenshot({ path: `e2e/screenshots/degree-major-change-${width}.png`, fullPage: true, animations: "disabled" });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Change major" })).toBeFocused();
    await page.screenshot({ path: `e2e/screenshots/degree-major-${width}.png`, fullPage: true });
  });
}

test("unchecked degree sheets remain behind the invitation", async ({ page }) => {
  await page.goto("/degree");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("combobox", { name: "Major", exact: true })).toHaveCount(0);
});
