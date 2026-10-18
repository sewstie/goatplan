import { expect, test, type Page } from "@playwright/test";

const screenshotDir = "e2e/screenshots";

type Seed = { term: string; courses?: string[]; locks?: Record<string, string[]> };

/** Opens the planner on a term, with these courses already planned. */
async function open(page: Page, { term, courses = [], locks = {} }: Seed) {
  await page.addInitScript(
    ([termId, draft]) => {
      if (sessionStorage.getItem("seeded")) return;
      sessionStorage.setItem("seeded", "1");
      localStorage.clear();
      localStorage.setItem("goatplan:term:v1", termId);
      localStorage.setItem(`goatplan:draft:v1:${termId}`, draft);
    },
    [
      term,
      JSON.stringify({
        version: 1,
        courses,
        preferences: { startsAfter: 540, blocked: [], onlyOpen: true },
        locks,
        sortPreset: "fewestEarly",
        alternatives: {},
      }),
    ] as const,
  );
  await page.goto("/");
  await expect(page.locator("[data-planner-term-status]")).toHaveAttribute("data-planner-term-status", "ready", {
    timeout: 30_000,
  });
}

const sidebar = (page: Page) => page.getByRole("complementary", { name: "Term and courses" });
const searchBox = (page: Page) => page.getByRole("searchbox", { name: "Search courses" });
const results = (page: Page) => page.getByRole("region", { name: "Search results" });
const yourCourses = (page: Page) => page.getByRole("region", { name: "Your courses" });
/** The row's own button, not its "Remove" button. */
const courseRow = (page: Page, code: string) =>
  yourCourses(page).getByRole("button", { name: new RegExp(`^${code}`) });

test("the term picker switches terms and the breadcrumbs follow", async ({ page }) => {
  await open(page, { term: "2027-C" });
  const term = page.getByRole("combobox", { name: "Term" });
  await expect(term).toHaveValue("2027-C");
  await expect(term.locator("option")).toContainText(["C Term · Spring 2027", "D Term · Spring 2027"]);
  await expect(sidebar(page).getByText("All courses and sections in C Term")).toBeVisible();
  const header = page.locator("header");
  await expect(header.getByText("Spring 2027", { exact: true })).toBeVisible();
  await expect(header.getByText("C Term", { exact: true })).toBeVisible();

  await term.selectOption("2027-D");
  await expect(sidebar(page).getByText("All courses and sections in D Term")).toBeVisible();
  await expect(header.getByText("D Term", { exact: true })).toBeVisible();
});

test("“cs2102” finds CS 2102, and Enter adds it with its credits", async ({ page }) => {
  await open(page, { term: "2027-D" });
  await searchBox(page).fill("cs2102");
  await expect(results(page).getByRole("heading", { level: 3 }).first()).toHaveText("CS 2102");

  await searchBox(page).press("Enter");
  await expect(searchBox(page)).toHaveValue("");
  await expect(searchBox(page)).toBeFocused();
  await expect(courseRow(page, "CS 2102")).toBeVisible();
  await expect(yourCourses(page).getByText("1 selected · 3 credits")).toBeVisible();
});

test("Enter on a course that's already planned says so and keeps the search", async ({ page }) => {
  await open(page, { term: "2027-C", courses: ["AE 2320"] });
  await searchBox(page).fill("ae2320");
  await searchBox(page).press("Enter");
  await expect(searchBox(page)).toHaveValue("ae2320");
  await expect(sidebar(page).locator('[aria-live="polite"]')).toContainText("AE 2320 is already in your courses.");
  await expect(yourCourses(page).getByText("1 selected · 3 credits")).toBeVisible();
});

test("search finds titles and instructors", async ({ page }) => {
  await open(page, { term: "2027-C" });
  await searchBox(page).fill("orbital mechanics");
  await expect(results(page).getByRole("heading", { level: 3 })).toHaveText(["AE 2320"]);

  await searchBox(page).fill("Hamzaoui");
  await expect(results(page).getByRole("heading", { level: 3 }).first()).toHaveText("AB 1533");
  await expect(results(page).getByText("1 lecture · Mohammed El Hamzaoui").first()).toBeVisible();
});

test("arrow keys move through the results, Escape goes back and clears", async ({ page }) => {
  await open(page, { term: "2027-C" });
  await searchBox(page).fill("ae 2");
  const add = (code: string) => results(page).getByRole("button", { name: `Add ${code}` });
  await expect(add("AE 2210")).toBeVisible();

  await searchBox(page).press("ArrowDown");
  await expect(add("AE 2210")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(add("AE 2320")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(add("AE 2210")).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(searchBox(page)).toBeFocused();

  await searchBox(page).press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(results(page).getByRole("button", { name: "AE 2210 added" })).toBeFocused();
  await expect(courseRow(page, "AE 2210")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(searchBox(page)).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(searchBox(page)).toHaveValue("");
  await expect(results(page)).toHaveCount(0);
});

test("results say whether the course fits the plan", async ({ page }) => {
  await open(page, { term: "2027-C", courses: ["AE 2320"] });
  await searchBox(page).fill("ab 1533");
  await expect(results(page).getByText("Clashes with AE 2320 lecture")).toBeVisible();

  await searchBox(page).fill("ae 2210");
  await expect(results(page).getByText("Fits", { exact: true })).toBeVisible();
});

test("a typo in a code suggests a real one", async ({ page }) => {
  await open(page, { term: "2027-C" });
  await searchBox(page).fill("AE 23200");
  await expect(sidebar(page).getByRole("heading", { name: "No course matches ‘AE 23200’." })).toBeVisible();
  await expect(sidebar(page).getByText("Try a code like AE 2320 or a professor’s name.")).toBeVisible();
});

test("a course from another term offers to switch, keeping the search", async ({ page }) => {
  await open(page, { term: "2027-D" });
  await searchBox(page).fill("AE 2320");
  await expect(sidebar(page).getByRole("heading", { name: "AE 2320 isn’t offered in D Term." })).toBeVisible();
  await expect(sidebar(page).getByText("It runs in C Term.", { exact: true })).toBeVisible();

  await sidebar(page).getByRole("button", { name: "Switch to C Term" }).click();
  await expect(page.getByRole("combobox", { name: "Term" })).toHaveValue("2027-C");
  await expect(searchBox(page)).toBeFocused();
  await expect(searchBox(page)).toHaveValue("AE 2320");
  await expect(results(page).getByRole("heading", { level: 3 })).toHaveText(["AE 2320"]);
});

test("course details list sections with times, seats, instructors and Rate My Professors", async ({ page }) => {
  await open(page, { term: "2027-C" });
  await searchBox(page).fill("ae2320");
  const toggle = results(page).getByRole("button", { name: /Sections/ });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  const sections = results(page).getByRole("list", { name: "Sections of AE 2320" });
  await expect(sections.getByRole("heading", { name: "Lecture CL01" })).toBeVisible();
  await expect(sections.getByText("Mon–Fri · 9:00 AM–9:50 AM")).toBeVisible();
  await expect(sections.getByText(/^\d+ of 120 seats open$/)).toBeVisible();
  await expect(sections.getByText("Ye Lu").first()).toBeVisible();

  const link = results(page).getByRole("link", { name: /Rate My Professors/ });
  await expect(link).toHaveAttribute("href", "https://www.ratemyprofessors.com/search/professors/1220?q=Ye%20Lu");
  await expect(link).toHaveAttribute("target", "_blank");

  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(sections).toHaveCount(0);
});

test("removing courses keeps focus in the list, then returns to the search box", async ({ page }) => {
  await open(page, { term: "2027-C", courses: ["AE 2320", "AE 2210"], locks: { "AE 2320": ["AE 2320-CX02"] } });
  await expect(yourCourses(page).getByText("2 selected · 6 credits")).toBeVisible();
  const row = (code: string) => courseRow(page, code);
  await expect(row("AE 2320")).toHaveAttribute("aria-current", "true");
  await expect(row("AE 2320")).toContainText("Lab CX02");
  await expect(row("AE 2320")).toHaveAccessibleName(/has a locked section/);

  await row("AE 2210").click();
  await expect(row("AE 2210")).toHaveAttribute("aria-current", "true");

  // The × hides at rest and shows on hover, inside its row.
  await expect(yourCourses(page).getByRole("button", { name: "Remove AE 2320" }).locator("..")).toHaveCSS("opacity", "0");
  const remove = yourCourses(page).getByRole("button", { name: "Remove AE 2210" });
  await row("AE 2210").hover();
  await expect(remove.locator("..")).toHaveCSS("opacity", "1");
  const rowBox = (await row("AE 2210").boundingBox())!;
  const removeBox = (await remove.boundingBox())!;
  expect(removeBox.x).toBeGreaterThan(rowBox.x);
  expect(removeBox.x + removeBox.width).toBeLessThan(rowBox.x + rowBox.width);
  expect(removeBox.y).toBeGreaterThan(rowBox.y);
  expect(removeBox.y + removeBox.height).toBeLessThan(rowBox.y + rowBox.height);
  await page.mouse.move(0, 0);

  await row("AE 2320").focus();
  await page.keyboard.press("Tab");
  await expect(yourCourses(page).getByRole("button", { name: "Remove AE 2320" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(row("AE 2210")).toBeFocused();
  await expect(yourCourses(page).getByText("1 selected · 3 credits")).toBeVisible();

  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(searchBox(page)).toBeFocused();
  await expect(yourCourses(page).getByText("0 selected")).toBeVisible();
  await expect(yourCourses(page).getByText("Search above to get started.")).toBeVisible();
});

test("search waits for sections when the term file fails to load", async ({ page }) => {
  await page.route("**/data/2027-C.json", (route) => route.abort());
  await page.addInitScript(() => localStorage.setItem("goatplan:term:v1", "2027-C"));
  await page.goto("/");
  await expect(searchBox(page)).toBeDisabled();
  await expect(sidebar(page).getByText("Search works once sections load.")).toBeVisible();
  await expect(yourCourses(page)).toContainText("Your courses will appear hereonce sections load.");
});

test("the term field says when there are no terms", async ({ page }) => {
  await page.route("**/data/index.json", (route) => route.abort());
  await page.goto("/");
  const term = page.getByRole("combobox", { name: "Term" });
  await expect(term).toBeDisabled();
  await expect(term.locator("option")).toHaveText(["No terms available"]);
});

test("the no-match card shows while other terms are still being checked", async ({ page }) => {
  // C Term never answers, so the lookup from D Term can't finish.
  await page.route("**/data/2027-C.json", () => {});
  await open(page, { term: "2027-D" });
  await searchBox(page).fill("AE 2320");
  await expect(sidebar(page).getByRole("heading", { name: "No course matches ‘AE 2320’." })).toBeVisible();
});

test.describe("screenshots", () => {
  for (const [width, height] of [
    [1440, 900],
    [834, 1194],
  ] as const) {
    test(`search screens at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await open(page, { term: "2027-C", courses: ["AE 2320"] });
      await page.screenshot({ path: `${screenshotDir}/search-planned-${width}.png`, fullPage: true });

      await searchBox(page).fill("ae 2");
      await expect(results(page)).toBeVisible();
      await page.screenshot({ path: `${screenshotDir}/search-results-${width}.png`, fullPage: true });

      await searchBox(page).fill("AE 23200");
      await expect(sidebar(page).getByRole("heading", { name: /No course matches/ })).toBeVisible();
      await page.screenshot({ path: `${screenshotDir}/search-no-match-${width}.png`, fullPage: true });

      await searchBox(page).fill("ae2320");
      await results(page).getByRole("button", { name: /Sections/ }).click();
      await page.screenshot({ path: `${screenshotDir}/search-details-${width}.png`, fullPage: true });

      await page.getByRole("combobox", { name: "Term" }).selectOption("2027-D");
      await expect(sidebar(page).getByRole("heading", { name: /isn’t offered in D Term/ })).toBeVisible();
      await page.screenshot({ path: `${screenshotDir}/search-not-offered-${width}.png`, fullPage: true });
    });
  }
});
