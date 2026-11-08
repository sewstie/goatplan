import { expect, test } from "@playwright/test";
import { fixtureHistory, openDegree, stored } from "./fixtures/degree";
import { COURSE_MAP_ON, SUGGESTIONS_ON } from "../src/components/degree/degreeFeatures";
import { pickTerm } from "./fixtures/pickers";

for (const width of [1440, 834]) {
  test(`degree reference layouts at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await openDegree(page, fixtureHistory("degree-history-mid.json"));
    const navigation = page.getByRole("navigation", { name: "Degree views" });
    await expect(navigation.getByRole("button")).toHaveCount(2 + Number(SUGGESTIONS_ON) + Number(COURSE_MAP_ON));
    await page.screenshot({ path: `${__dirname}/screenshots/degree-reference-sheet-${width}.png`, fullPage: true });
    await navigation.getByRole("button", { name: "Plan ahead", exact: true }).click();
    await expect(page.getByRole("region", { name: "Four-year plan", exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "A Term 2026", exact: true })).toBeVisible();
    await page.screenshot({ path: `${__dirname}/screenshots/degree-reference-plan-${width}.png`, fullPage: true });
    if (COURSE_MAP_ON) {
      await navigation.getByRole("button", { name: "Course map", exact: true }).click();
      await page.getByRole("region", { name: "Course map diagram" }).getByRole("button", { name: /^CS 2103,/ }).click();
      await expect(page.getByRole("complementary", { name: "Selected course" }).getByRole("heading", { name: "CS 2103" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Open in WPI catalog" })).toBeVisible();
      await page.screenshot({ path: `${__dirname}/screenshots/degree-reference-map-${width}.png`, fullPage: true });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test("plan course edits persist in the existing history", async ({ page }) => {
  await openDegree(page, fixtureHistory("degree-history-mid.json"));
  await page.getByRole("navigation", { name: "Degree views" }).getByRole("button", { name: "Plan ahead" }).click();
  await page.getByRole("button", { name: /^Edit CS 1102,/ }).click();
  await page.getByRole("button", { name: /^Term \(optional\)/ }).click();
  await page.getByRole("button", { name: "D Term 2027", exact: true }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  expect((await stored(page)).courses.find((course: { code: string }) => course.code === "CS 1102").term).toBe("D Term 2027");
  await expect(page.getByRole("region", { name: "D Term 2027", exact: true }).getByRole("button", { name: /^Edit CS 1102,/ })).toBeVisible();
});

test("project blocks reserve a term without changing degree credit", async ({ page }) => {
  await openDegree(page, fixtureHistory("degree-history-mid.json"));
  const before = await stored(page);
  await page.getByRole("navigation", { name: "Degree views" }).getByRole("button", { name: "Plan ahead" }).click();
  await page.getByRole("button", { name: "Add project block", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Add project block" });
  await dialog.getByRole("button", { name: "Add project block", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove IQP project block from B Term 2028" })).toBeVisible();
  expect(await stored(page)).toEqual(before);
  await page.reload();
  await page.getByRole("navigation", { name: "Degree views" }).getByRole("button", { name: "Plan ahead" }).click();
  await expect(page.getByRole("button", { name: "Remove IQP project block from B Term 2028" })).toBeVisible();
});

test("project and start term dialogs work from the keyboard and return focus", async ({ page }) => {
  await openDegree(page, fixtureHistory("degree-history-mid.json"));
  await page.getByRole("navigation", { name: "Degree views" }).getByRole("button", { name: "Plan ahead" }).click();
  const opener = page.getByRole("button", { name: "Add project block", exact: true });
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Add project block" });
  await expect(dialog.getByRole("heading", { name: "Add project block" })).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "IQP", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(dialog.getByRole("button", { name: "MQP", exact: true })).toHaveAttribute("aria-pressed", "true");
  await pickTerm(dialog, "Term", "C Term 2029");
  await expect(dialog.getByRole("button", { name: /^Term C Term 2029/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog.getByRole("grid")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog.getByRole("grid")).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Add project block", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove MQP project block from C Term 2029" })).toBeVisible();
  await expect(opener).toBeFocused();

  const start = page.getByRole("button", { name: /^Start:/ });
  await start.focus();
  await page.keyboard.press("Enter");
  const startDialog = page.getByRole("dialog", { name: "When did you start?" });
  const first = startDialog.getByRole("combobox", { name: "First term" });
  await expect(startDialog.getByRole("heading", { name: "When did you start?" })).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(first).toBeFocused();
  await expect(first).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(first).toHaveText("A Term 2027");
  await expect(first).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(startDialog).toBeHidden();
  await expect(start).toHaveText("Start: A 2027");
  await expect(start).toBeFocused();
});

test("phone keeps a readable plan", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openDegree(page, fixtureHistory("degree-history-mid.json"));
  await page.getByRole("navigation", { name: "Degree views" }).getByRole("button", { name: "Plan ahead" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `${__dirname}/screenshots/degree-reference-plan-375.png`, fullPage: true });
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.screenshot({ path: `${__dirname}/screenshots/degree-reference-plan-dark-375.png`, fullPage: true });
});
