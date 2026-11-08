import { expect, test } from "./fixtures/test";
import { openDegree, savedCourse, stored } from "./fixtures/degree";
import { COURSE_MAP_ON } from "../src/components/degree/degreeFeatures";

test.skip(!COURSE_MAP_ON, "The course map is paused");

for (const width of [1440, 834]) {
  for (const theme of ["light", "dark"]) {
    test(`RBE map uses the shared layout at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.addInitScript((theme) => localStorage.setItem("goatplan:theme:v1", theme), theme);
      await openDegree(page, JSON.stringify({ version: 1, sheetId: "rbe-2030", courses: [savedCourse({ code: "RBE 1001", credits: 3 }), savedCourse({ code: "ME 4322", credits: 3, term: "A Term 2027" }, true)], manual: [] }));
      const navigation = page.getByRole("navigation", { name: "Degree views" });
      await navigation.getByRole("button", { name: "Course map", exact: true }).click();
      const diagram = page.getByRole("region", { name: "Course map diagram" });
      const details = page.getByRole("complementary", { name: "Selected course" });
      await expect(diagram.getByRole("button")).toHaveCount(13);
      await expect(diagram.getByRole("button", { name: /^RBE 1001,/ })).toHaveClass(/flow-taken/);
      const manipulation = diagram.getByRole("button", { name: /^RBE 3001,/ });
      await manipulation.focus();
      await manipulation.press("Enter");
      await expect(details.getByRole("heading", { name: "RBE 3001" })).toBeVisible();
      await expect(page.locator('[data-edge="RBE 3001 → RBE 3002"]')).toHaveClass(/flow-line-lit/);
      await expect(details.getByRole("link", { name: "Open in WPI catalog" })).toHaveAttribute("href", "https://wpi.cleancatalog.net/robotics-engineering/rbe-3001");
      await page.screenshot({ path: `${__dirname}/screenshots/course-map-rbe-${width}-${theme}.png`, fullPage: true, animations: "disabled" });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.getByRole("button", { name: "List", exact: true }).click();
      await page.getByRole("button", { name: "RBE 4322 Modeling and Analysis of Mechatronic Systems", exact: true }).click();
      await details.getByRole("button", { name: "Change term" }).click();
      const dialog = page.getByRole("dialog", { name: "Plan RBE 4322" });
      await dialog.getByRole("button", { name: /^Plan for / }).click();
      const courses = (await stored(page)).courses;
      expect(courses.filter((course: { code: string }) => ["RBE 4322", "ME 4322"].includes(course.code))).toEqual([expect.objectContaining({ code: "ME 4322", status: "planned" })]);
      await page.reload();
      await navigation.getByRole("button", { name: "Course map", exact: true }).click();
      await expect(diagram.getByRole("button", { name: /^RBE 4322,/ })).toHaveClass(/flow-planned/);
    });
  }
}
