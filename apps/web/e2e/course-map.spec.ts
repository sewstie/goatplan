import { expect, frozenTerm, test } from "./fixtures/test";
import { openDegree, stored } from "./fixtures/degree";

test("students explore sourced CS background by map and keyboard list without changing their degree", async ({ page }) => {
  await openDegree(page);
  const history = await stored(page);
  await page.getByRole("button", { name: "Course map", exact: true }).click();
  await expect(page.getByRole("heading", { name: "CS course background" })).toBeVisible();
  await page.getByRole("button", { name: "CS 2223", exact: true }).click();
  const details = page.getByRole("dialog", { name: "CS 2223" });
  await expect(details.getByText("CS 2102 or CS 2103, and CS 2022.", { exact: true })).toBeVisible();
  await expect(details.getByRole("link", { name: "Catalog source" })).toHaveAttribute("href", "https://wpi.cleancatalog.net/computer-science/cs-2223");
  await expect(details.getByRole("button", { name: "CS 2022", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "CS 2223", exact: true })).toBeFocused();
  await expect(page.getByRole("img", { name: "CS 2102 → CS 2223" })).toBeVisible();
  await page.getByRole("button", { name: "List view", exact: true }).click();
  const course = page.getByRole("button", { name: "CS 2011", exact: true });
  await course.focus();
  await course.press("Enter");
  await expect(page.getByRole("dialog", { name: "CS 2011" }).getByText("CS 2301 or CS 2303, or a significant knowledge of C/C++.", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(course).toBeFocused();
  expect(await stored(page)).toEqual(history);
});

test("following a background connection announces the new course and keeps keyboard focus", async ({ page }) => {
  await openDegree(page);
  await page.getByRole("button", { name: "Course map", exact: true }).click();
  const trigger = page.getByRole("button", { name: "CS 2223", exact: true });
  await trigger.click();
  const related = page.getByRole("dialog", { name: "CS 2223" }).getByRole("button", { name: "CS 2022", exact: true });
  await related.focus();
  await related.press("Enter");
  await expect(page.getByRole("dialog", { name: "CS 2022" }).getByRole("heading", { name: "CS 2022", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

for (const width of [1440, 834]) {
  for (const theme of ["light", "dark"]) {
    test(`CS map and list preserve missing courses at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.addInitScript((value) => localStorage.setItem("goatplan:theme:v1", value), theme);
      await page.route(/\/data\/\d{4}-[^/]+\.json$/, async (route) => {
        const term = frozenTerm(new URL(route.request().url()).pathname.split("/").pop()!.replace(".json", ""));
        await route.fulfill({ json: { ...term, courses: term.courses.filter((course) => course.code !== "MA 2071") } });
      });
      await openDegree(page);
      await page.getByRole("button", { name: "Course map", exact: true }).click();
      const map = page.getByRole("region", { name: "Course-number map" });
      for (const band of [1000, 2000, 3000, 4000]) await expect(map.getByRole("region", { name: `${band}-level courses` })).toBeAttached();
      await page.getByRole("button", { name: "CS 2011", exact: true }).click();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("img", { name: "CS 2303 → CS 2011" })).toBeAttached();
      await expect(page.getByRole("img", { name: "CS 2011 → CS 3013" })).toBeAttached();
      await page.screenshot({ path: `${__dirname}/screenshots/course-map-${width}-${theme}.png`, fullPage: true });
      await page.getByRole("button", { name: "MA 2071", exact: true }).click();
      const details = page.getByRole("dialog", { name: "MA 2071", exact: true });
      await expect(details.getByText(/Offering details are unavailable/)).toBeVisible();
      await expect(details.getByText(/does not mean the course has no background or will not be offered/)).toBeVisible();
      await expect(details.getByRole("button", { name: "CS 4032", exact: true })).toBeVisible();
      await page.screenshot({ path: `${__dirname}/screenshots/course-map-details-${width}-${theme}.png`, fullPage: true });
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "List view", exact: true }).click();
      const cs = page.getByRole("button", { name: "CS 4342", exact: true });
      await cs.focus();
      await cs.press("Enter");
      await expect(page.getByRole("dialog", { name: "CS 4342" }).getByRole("region", { name: "Recommended background" }).getByText(/Multivariate Calculus/)).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(cs).toBeFocused();
      await page.screenshot({ path: `${__dirname}/screenshots/course-map-list-${width}-${theme}.png` });
      await page.getByRole("button", { name: "Back to degree", exact: true }).click();
      await expect(page.getByRole("region", { name: "Your sheet", exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
}
