import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures/test";
import { fixtureHistory, openDegree, stored } from "./fixtures/degree";
import { COURSE_MAP_ON } from "../src/components/degree/degreeFeatures";

test.skip(!COURSE_MAP_ON, "The course map is paused");

const card = (page: Page, code: string) => page.getByRole("region", { name: "Course map diagram" }).getByRole("button", { name: new RegExp(`^${code},`) });
const details = (page: Page) => page.getByRole("complementary", { name: "Selected course" });

async function openMap(page: Page) {
  await page.getByRole("navigation", { name: "Degree views" }).getByRole("button", { name: "Course map", exact: true }).click();
  await expect(page.getByRole("region", { name: "Course map diagram" })).toBeVisible();
}

test("selecting a course lights up the chain before and after it without changing the degree", async ({ page }) => {
  await openDegree(page, fixtureHistory("degree-history-mid.json"));
  const history = await stored(page);
  await openMap(page);
  for (const band of [1000, 2000, 3000, 4000]) await expect(page.getByText(`${band} level`, { exact: true })).toBeVisible();
  await card(page, "CS 2223").click();
  await expect(card(page, "CS 2223")).toHaveAttribute("aria-pressed", "true");
  await expect(details(page).getByRole("heading", { name: "CS 2223" })).toBeVisible();
  await expect(details(page).getByText("CS 2102 or CS 2103, and CS 2022.", { exact: true })).toBeVisible();
  await expect(details(page).getByRole("link", { name: "Open in WPI catalog" })).toHaveAttribute("href", "https://wpi.cleancatalog.net/computer-science/cs-2223");
  await expect(page.locator('[data-edge="CS 2022 → CS 2223"]')).toHaveClass(/flow-line-lit/);
  await expect(page.locator('[data-edge="CS 2223 → CS 3133"]')).toHaveClass(/flow-line-lit/);
  await expect(page.locator('[data-edge="CS 3013 → CS 4401"]')).toHaveClass(/flow-dimmed/);
  await expect(card(page, "CS 4401")).toHaveClass(/flow-dimmed/);
  await expect(card(page, "CS 1101")).not.toHaveClass(/flow-dimmed/);
  expect(await stored(page)).toEqual(history);
});

test("the map works with the keyboard and follows links from the details", async ({ page }) => {
  await openDegree(page);
  await openMap(page);
  const algorithms = card(page, "CS 2223");
  await algorithms.focus();
  await algorithms.press("Enter");
  const next = details(page).getByRole("region", { name: "What it leads to" }).getByRole("button", { name: "CS 3133", exact: true });
  await next.focus();
  await next.press("Enter");
  await expect(details(page).getByRole("heading", { name: "CS 3133" })).toBeFocused();
  await expect(card(page, "CS 3133")).toHaveAttribute("aria-pressed", "true");
  await card(page, "CS 3133").focus();
  await page.keyboard.press("Escape");
  await expect(details(page).getByRole("heading", { name: "Pick a course" })).toBeVisible();
  await expect(card(page, "CS 4401")).not.toHaveClass(/flow-dimmed/);
});

test("the list shows the same background and planning a course marks it on the map", async ({ page }) => {
  await openDegree(page, fixtureHistory("degree-history-mid.json"));
  await openMap(page);
  await page.getByRole("button", { name: "List", exact: true }).click();
  await page.getByRole("button", { name: "CS 4342 Machine Learning", exact: true }).click();
  await expect(details(page).getByText("Other background: + MA 1024/1034, MA 2071, MA 2621/2631")).toBeVisible();
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await card(page, "CS 4123").click();
  await details(page).getByRole("button", { name: "Plan this" }).click();
  const dialog = page.getByRole("dialog", { name: "Plan CS 4123" });
  await dialog.getByRole("button", { name: /^Term / }).click();
  await page.getByRole("button", { name: /^D Term 2028/ }).click();
  await dialog.getByRole("button", { name: "Plan for D Term 2028" }).click();
  await expect(card(page, "CS 4123")).toHaveClass(/flow-planned/);
  expect((await stored(page)).courses).toContainEqual(expect.objectContaining({ code: "CS 4123", status: "planned", term: "D Term 2028" }));
});

for (const width of [1440, 834]) {
  for (const theme of ["light", "dark"]) {
    test(`course map fits the page at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.addInitScript((value) => localStorage.setItem("goatplan:theme:v1", value), theme);
      await openDegree(page, fixtureHistory("degree-history-mid.json"));
      await openMap(page);
      const diagram = page.getByRole("region", { name: "Course map diagram" });
      await expect(page.getByText("Ctrl + scroll to zoom")).toBeVisible();
      const box = (await diagram.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + 200);
      await page.keyboard.down("Control");
      await page.mouse.wheel(0, -200);
      await page.keyboard.up("Control");
      await expect(page.getByRole("button", { name: "Fit", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Fit", exact: true }).click();
      await expect(page.getByText("Ctrl + scroll to zoom")).toBeVisible();
      await card(page, "CS 3133").click();
      await page.screenshot({ path: `${__dirname}/screenshots/course-map-${width}-${theme}.png`, fullPage: true, animations: "disabled" });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
}
