import { expect, test } from "./fixtures/test";
import { openDegree, openHistory, panel, savedCourse } from "./fixtures/degree";
import { pickTerm } from "./fixtures/pickers";

const spanish = ["SP 1523", "SP 1524"].map((code, index) => savedCourse({ code, credits: 3, term: index === 0 ? "A Term 2025" : "B Term 2025" }));

for (const width of [1440, 834]) {
  test(`the term picker marks the published terms that offer a course at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openDegree(page, { courses: [...spanish, savedCourse({ code: "CS 2102", credits: 3, term: "C Term 2027" }, true)] });
    const history = await openHistory(page);
    await history.getByRole("button", { name: "Edit CS 2102" }).click();
    const details = panel(page, "Edit course");
    await expect(details.getByText("CS 2102 isn’t offered in C Term 2027. It’s offered in B Term 2026 and D Term 2027.")).toBeVisible();
    await details.getByRole("button", { name: /^Term \(optional\) / }).click();
    const grid = page.getByRole("grid", { name: "Terms by school year" });
    await expect(grid.getByRole("button", { name: "D Term 2027, offered" })).toBeVisible();
    await expect(grid.getByRole("button", { name: "C Term 2027, not offered" })).toBeVisible();
    await expect(grid.getByRole("button", { name: "A Term 2027", exact: true })).toBeVisible();
    await page.screenshot({ path: `e2e/screenshots/degree-offerings-picker-${width}.png`, animations: "disabled" });
    await grid.getByRole("button", { name: "D Term 2027, offered" }).click();
    await expect(details.getByText("CS 2102 is offered in D Term 2027.")).toBeVisible();
  });
}

test("search results say whether a course runs in the term it's added to", async ({ page }) => {
  await openDegree(page);
  await page.getByRole("button", { name: "Find your courses" }).click();
  const search = panel(page, "Add courses");
  await pickTerm(search, "Adding to", "C Term 2027");
  await search.getByRole("combobox", { name: "Course code or title" }).fill("CS 2102");
  await expect(search.getByText("CS 2102 isn’t offered in C Term 2027. It’s offered in B Term 2026 and D Term 2027.")).toBeVisible();
  await search.getByRole("combobox", { name: "Course code or title" }).fill("MA 2071");
  await expect(search.getByText("MA 2071 is offered in C Term 2027.")).toBeVisible();
});

test("the humanities note explains the language path", async ({ page }) => {
  await openDegree(page, { courses: spanish });
  await expect(page.getByText(/^Language path: all 6 humanities courses in Spanish\./).first()).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/degree-offerings-hua-1440.png", animations: "disabled" });
});

