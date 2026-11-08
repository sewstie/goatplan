import { expect, test } from "./fixtures/test";
import { openDegree, savedCourse, stored } from "./fixtures/degree";
import { COURSE_MAP_ON } from "../src/components/degree/degreeFeatures";

test.skip(!COURSE_MAP_ON, "The course map is paused");

const majors = [
  { sheet: "me-2030", major: "Mechanical Engineering", count: 41, course: "ME 4322", alias: "RBE 4322", first: "ES 2501", edge: "ES 2501 → ES 2502" },
  { sheet: "ece-2030", major: "Electrical and Computer Engineering", count: 34, course: "ECE 4011", alias: "BME 4011", first: "ECE 2019", edge: "ECE 2019 → ECE 2201" },
  { sheet: "ds-2030", major: "Data Science", count: 27, course: "DS 4343", alias: "CS 4343", first: "MA 2611", edge: "MA 2611 → MA 2612" },
];

for (const major of majors) {
  for (const width of [1440, 834]) {
    for (const theme of ["light", "dark"]) {
      test(`${major.major} map at ${width}px in ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.addInitScript((theme) => localStorage.setItem("goatplan:theme:v1", theme), theme);
        await openDegree(page, JSON.stringify({ version: 1, sheetId: major.sheet, courses: [savedCourse({ code: major.first, credits: 3 }), savedCourse({ code: major.alias, credits: 3, term: "A Term 2027" }, true)], manual: [] }));
        await page.getByRole("navigation", { name: "Degree views" }).getByRole("button", { name: "Course map", exact: true }).click();
        const diagram = page.getByRole("region", { name: "Course map diagram" });
        const details = page.getByRole("complementary", { name: "Selected course" });
        await expect(diagram.getByRole("button")).toHaveCount(major.count);
        const first = diagram.getByRole("button", { name: new RegExp(`^${major.first},`) });
        await expect(first).toHaveClass(/flow-taken/);
        await first.focus();
        await first.press("Enter");
        await expect(first).toHaveAttribute("aria-pressed", "true");
        await expect(page.locator(`[data-edge="${major.edge}"]`)).toHaveClass(/flow-line-lit/);
        await page.screenshot({ path: `${__dirname}/screenshots/course-map-${major.sheet}-${width}-${theme}.png`, fullPage: true, animations: "disabled" });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await diagram.getByRole("button", { name: new RegExp(`^${major.course},`) }).click();
        await expect(details.getByRole("link", { name: "Open in WPI catalog" })).toHaveAttribute("href", /^https:\/\/wpi\.cleancatalog\.net\//);
        await details.getByRole("button", { name: "Change term" }).click();
        await page.getByRole("dialog", { name: `Plan ${major.course}` }).getByRole("button", { name: /^Plan for / }).click();
        const courses = (await stored(page)).courses;
        expect(courses.filter((course: { code: string }) => [major.course, major.alias].includes(course.code))).toEqual([expect.objectContaining({ code: major.alias, status: "planned" })]);
        await page.getByRole("button", { name: "List", exact: true }).click();
        await expect(page.getByRole("region", { name: "1000-level courses" })).toBeVisible();
        await expect(page.getByRole("region", { name: "Course map diagram" })).toHaveCount(0);
      });
    }
  }
}

test("changing majors resets the selected map course and keeps history", async ({ page }) => {
  await openDegree(page, JSON.stringify({ version: 1, sheetId: "me-2030", courses: [savedCourse({ code: "ES 2501", credits: 3 })], manual: [] }));
  await page.getByRole("navigation", { name: "Degree views" }).getByRole("button", { name: "Course map", exact: true }).click();
  const diagram = page.getByRole("region", { name: "Course map diagram" });
  await diagram.getByRole("button", { name: /^ES 2501,/ }).click();
  for (const major of [majors[1], majors[2], majors[0]]) {
    await page.getByRole("button", { name: "Change major" }).click();
    await page.getByRole("radio", { name: major.major, exact: true }).check();
    await page.getByRole("button", { name: "Open my sheet", exact: true }).click();
    await expect(diagram.getByRole("button")).toHaveCount(major.count);
    await expect(page.getByRole("heading", { name: "Pick a course", exact: true })).toBeVisible();
    expect((await stored(page)).courses).toEqual([expect.objectContaining({ code: "ES 2501" })]);
  }
});
