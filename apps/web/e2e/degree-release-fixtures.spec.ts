import { expect, test } from "./fixtures/test";
import { HISTORY_KEY } from "./fixtures/degree";

test.skip(process.env.GOATPLAN_RELEASE_FIXTURES !== "1", "Uses synthetic verification in an isolated production build.");

test("all five checked majors open My degree without a tester invitation", async ({ page }) => {
  await page.goto("/degree");
  await expect(page.getByRole("heading", { name: "What's your major?" })).toBeVisible();
  await page.getByRole("combobox", { name: "Major", exact: true }).click();
  for (const major of ["Computer Science", "Robotics Engineering", "Mechanical Engineering", "Electrical and Computer Engineering", "Data Science"]) {
    await expect(page.getByRole("option", { name: major, exact: true })).toBeVisible();
  }
});

test("public visitors cannot reopen a future beta sheet from saved history", async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({ version: 1, sheetId: "fixture-2030", courses: [], manual: [] }));
  }, HISTORY_KEY);
  await page.goto("/degree");
  await expect(page.getByRole("heading", { name: "What's your major?" })).toBeVisible();
  await page.getByRole("combobox", { name: "Major", exact: true }).click();
  await expect(page.getByRole("option", { name: "Fixture Engineering", exact: true })).toHaveCount(0);
});
