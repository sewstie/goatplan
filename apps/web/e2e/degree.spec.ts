import { expect, test } from "./fixtures/test";
import type { Page } from "@playwright/test";
import { auditReady, DEGREE_FLAG_KEY, fixtureHistory, HISTORY_KEY, openAllSections, openDegree, openHistory, panel, readFixture, savedCourse, stored, storedCodes } from "./fixtures/degree";
import { SUGGESTIONS_ON } from "../src/components/degree/degreeFeatures";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

const flagValue = (page: Page) => page.evaluate((key) => localStorage.getItem(key), DEGREE_FLAG_KEY);
const tile = (page: Page, name: RegExp) => page.getByRole("button", { name });

test.describe("who can reach it", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("goatplan:tutorial:v1", "dismissed");
      localStorage.setItem("goatplan:term:v1", "2027-C");
    });
  });

  test("the My degree tab is hidden until the flag is on", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "My degree" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Planner" })).toHaveCount(0);
  });

  test("/degree is not reachable without the flag and redirects to the planner", async ({ page }) => {
    await page.goto("/degree");
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { level: 1, name: "My degree" })).toHaveCount(0);
  });

  test("the tester link turns My degree on for this browser and opens the page", async ({ page }) => {
    await page.goto("/#enable-degree");
    await expect(page).toHaveURL("/degree");
    await expect(page.getByRole("heading", { level: 1, name: "What's your major?" })).toBeVisible();
    expect(await flagValue(page)).toBe("on");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Planner" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "My degree" })).toHaveAttribute("aria-current", "page");
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "What's your major?" })).toBeVisible();
  });

  test("the tabs switch between the planner and the degree page by keyboard", async ({ page }) => {
    await page.goto("/#enable-degree");
    await expect(page).toHaveURL("/degree");
    const nav = page.getByRole("navigation", { name: "Main" });
    await nav.getByRole("link", { name: "Planner" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/");
    await expect(nav.getByRole("link", { name: "Planner" })).toHaveAttribute("aria-current", "page");
  });

  test("a phone shows both tabs once the flag is on", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
    await page.goto("/#enable-degree");
    await expect(page).toHaveURL("/degree");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Planner" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "My degree" })).toBeInViewport();
  });

  test("without the flag, the screen and its data stay out of reach", async ({ page }) => {
    await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [HISTORY_KEY, JSON.stringify({ version: 1, courses: [savedCourse({ code: "MA 1021", credits: 3 })], manual: [] })]);
    await page.goto("/degree");
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Your sheet" })).toHaveCount(0);
  });
});

test.describe("the real audit", () => {
  for (const name of ["degree-history-mid.json", "degree-history-complete.json"]) {
    test(`the screen matches the worked-out answers of ${name}`, async ({ page }) => {
      const fixture = readFixture(name);
      await openDegree(page, fixtureHistory(name));
      await openAllSections(page);
      for (const [line, expected] of Object.entries(fixture.expectedLines)) {
        if (Number(line) === 7 || !expected.course) continue;
        await expect(page.getByRole("button", { name: new RegExp(`^${expected.course}, line ${line}, `) }), `line ${line}`).toBeVisible();
      }
      await page.getByRole("button", { name: "List", exact: true }).click();
      const titles = { hua: "Humanities & arts", "social-science": "Social science", iqp: "IQP", "free-electives": "Free electives", cs: "Computer science", math: "Mathematics", science: "Science & engineering" };
      for (const [id, title] of Object.entries(titles)) {
        if (id === "cs") continue;
        const { done, planned, total } = fixture.expectedSections[id];
        const bar = page.getByRole("progressbar", { name: `${title}: ${done} of ${total}`, exact: true });
        await expect(bar, title).toHaveAttribute("aria-valuetext", `${done} done, ${planned} planned, ${total - done - planned} to go`);
      }
      // Wider screens show MQP on a row of its own, so the two rows add up to the Computer science section.
      const row = async (name: string) => {
        const text = await page.getByRole("progressbar", { name: new RegExp(`^${name}: `) }).getAttribute("aria-valuetext");
        return text!.match(/\d+/g)!.map(Number);
      };
      const [cs, mqp] = [await row("Computer science"), await row("MQP")];
      const { done, planned, total } = fixture.expectedSections.cs;
      expect(cs.map((value, index) => value + mqp[index])).toEqual([done, planned, total - done - planned]);
    });
  }

  test("adding a course by hand fills a line, and the whole sheet updates", async ({ page }) => {
    await openDegree(page);
    await expect(page.getByText("0 of 45")).toBeVisible();
    await page.getByRole("button", { name: "Find your courses" }).click();
    const search = panel(page, "Add courses");
    await search.getByRole("combobox", { name: "Course code or title" }).fill("MA 1021");
    await search.getByRole("button", { name: "Add MA 1021" }).click();
    await page.keyboard.press("Escape");
    await expect(tile(page, /^MA 1021, line 34, done/)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("1 of 45")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Units per term" })).toBeVisible();
    expect(await storedCodes(page)).toEqual(["MA 1021"]);
  });

  test("the first steps work by keyboard", async ({ page }) => {
    await openDegree(page);
    await page.getByRole("button", { name: "Find your courses" }).focus();
    await page.keyboard.press("Enter");
    const search = panel(page, "Add courses");
    await search.getByRole("combobox", { name: "Course code or title" }).fill("MA 1021");
    await search.getByRole("button", { name: "Add MA 1021" }).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");
    await expect(panel(page, "Add courses")).toHaveCount(0);
    await expect(tile(page, /^MA 1021, line 34/)).toBeVisible({ timeout: 30_000 });
  });

  test("search uses the full course catalog without a planner term scope", async ({ page }) => {
    await openDegree(page);
    await page.getByRole("button", { name: "Find your courses" }).click();
    const search = panel(page, "Add courses");
    await search.getByRole("combobox", { name: "Course code or title" }).fill("CS 2102");
    await expect(search.getByRole("button", { name: "Add CS 2102" })).toBeVisible();
    await expect(search.getByRole("combobox", { name: "Search in" })).toHaveCount(0);
  });

  test("a typed code counts by its code and is flagged, and other text is refused", async ({ page }) => {
    await openDegree(page);
    await page.getByRole("button", { name: "Find your courses" }).click();
    await page.getByRole("button", { name: "Add manual credit" }).click();
    const manual = panel(page, "Add manual credit");
    await manual.getByRole("textbox", { name: "Course code" }).fill("nothing good");
    await manual.getByRole("button", { name: "Add to history" }).click();
    await expect(manual.getByRole("alert")).toContainText("doesn’t look like a course code");
    await manual.getByRole("textbox", { name: "Course code" }).fill("ma 1099");
    await manual.getByRole("button", { name: "Add to history" }).click();
    await page.keyboard.press("Escape");
    await expect(tile(page, /^MA 1099, line 34, check this yourself/)).toBeVisible({ timeout: 30_000 });
    expect((await stored(page)).courses[0]).toMatchObject({ code: "MA 1099", credits: 3, source: "typed" });
  });

  test("saved courses keep working when no term file has them", async ({ page }) => {
    await page.route(/\/data\/[^/?]+\.json(\?.*)?$/, (route) => route.fulfill({ status: 404 }));
    await openDegree(page, { courses: [savedCourse({ code: "MA 1021", credits: 3 }), { ...savedCourse({ code: "CS 1005", credits: 3 }), title: "A retired course" }] });
    await expect(tile(page, /^MA 1021, line 34/)).toBeVisible();
    const history = await openHistory(page);
    await expect(history.getByText("A retired course")).toBeVisible();
  });

  test("broken stored data doesn't break the screen", async ({ page }) => {
    await openDegree(page, "{not json");
    await expect(page.getByText("Some of your saved courses couldn’t be read, so they aren’t listed.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your sheet", exact: true })).toBeVisible();
  });

  test("tick boxes fill their lines by keyboard and survive a reload", async ({ page }) => {
    await openDegree(page);
    const iqp = page.getByRole("checkbox", { name: "IQP, line 10" });
    await iqp.focus();
    await page.keyboard.press("Space");
    await auditReady(page);
    await expect(page.getByText("1 of 45")).toBeVisible();
    await page.reload();
    await auditReady(page);
    await expect(iqp).toBeChecked();
    expect((await stored(page)).manual).toEqual(["iqp-1"]);
  });

  test("the checks are shown apart, and humanities depth stays open until it's ticked", async ({ page }) => {
    await openDegree(page, { courses: ["EN 1001", "EN 1002", "EN 2201"].map((code) => savedCourse({ code, credits: 3 })) });
    await page.getByRole("button", { name: /^HUA theme: Review/ }).click();
    const checks = panel(page, "Requirement checks");
    await expect(checks.getByText("Confirm the relationship between the humanities courses with your advisor.")).toBeVisible();
    await checks.getByRole("checkbox", { name: "My humanities depth courses are thematically related" }).click();
    await auditReady(page);
    await expect(checks.getByText("You confirmed these courses are related.")).toBeVisible();
  });

});

test.describe("the plan", () => {
  const draft = (courses: string[]) => JSON.stringify({ version: 1, courses, preferences: { startsAfter: 0, blocked: [], onlyOpen: true }, locks: {}, professorByCourse: {}, sortPreset: "bestOverall", alternatives: {} });

  test("the open term's plan does not count as planned", async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem("goatplan:draft:v1:2027-C", value), draft(["CS 3043"]));
    await openDegree(page);
    await expect(tile(page, /^CS 3043, line \d+, planned/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^0 Planned/ })).toBeVisible();
  });

  test("a course both taken and in the plan counts as taken, and other terms' plans don't count", async ({ page }) => {
    await page.addInitScript(([open, other]) => {
      localStorage.setItem("goatplan:draft:v1:2027-C", open);
      localStorage.setItem("goatplan:draft:v1:2027-D", other);
    }, [draft(["CS 2303"]), draft(["CS 3041"])]);
    await openDegree(page, { courses: [savedCourse({ code: "CS 2303", credits: 3 })] });
    await expect(tile(page, /^CS 2303, line \d+, done/)).toBeVisible();
    await expect(page.getByRole("button", { name: /^0 Planned/ })).toBeVisible();
  });

  test("suggestions are added explicitly as planned without changing the planner", async ({ page }) => {
    test.skip(!SUGGESTIONS_ON, "Suggestions are paused");
    await openDegree(page, { courses: [savedCourse({ code: "CS 1101", credits: 3 })] });
    await page.getByRole("button", { name: "Sheet options" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Suggest courses", exact: true }).click();
    const suggestions = panel(page, "Suggest courses");
    await suggestions.getByRole("combobox", { name: "Term to plan for" }).selectOption("C Term 2027");
    const add = suggestions.getByRole("button", { name: /^Plan .* for C Term 2027$/ }).first();
    await expect(add).toBeVisible({ timeout: 60_000 });
    const code = (await add.getAttribute("aria-label"))!.replace(/^Plan /, "").replace(/ for C Term 2027$/, "");
    await add.click();
    await page.keyboard.press("Escape");
    await auditReady(page);
    await openAllSections(page);
    await expect(tile(page, new RegExp(`^${code}, line \\d+, planned`))).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("goatplan:draft:v1:2027-C"))).toBeNull();
  });
});

test.describe("pins", () => {
  const moveTo = async (page: Page, code: RegExp, line: RegExp) => {
    await tile(page, code).click();
    await page.getByRole("button", { name: /Move to line/ }).click();
    const move = panel(page, "Move to line…");
    await move.getByRole("radio", { name: line }).check({ force: true });
    await move.getByRole("button", { name: "Move & pin" }).click();
  };

  test("a course moves to an allowed line and stays pinned through a reload, and Undo takes it back", async ({ page }) => {
    await openDegree(page, { courses: [savedCourse({ code: "CS 2022", credits: 3 })] });
    await moveTo(page, /^CS 2022, line \d+/, /Mathematics · 38/);
    await expect(page.getByText("CS 2022 moved to Math 38 and pinned.")).toBeVisible();
    await expect(tile(page, /^CS 2022, line 38, done, pinned/)).toBeVisible();
    await page.reload();
    await auditReady(page);
    await expect(tile(page, /^CS 2022, line 38, done, pinned/)).toBeVisible();
    await moveTo(page, /^CS 2022, line 38/, /Computer science · 17/);
    await expect(tile(page, /^CS 2022, line 17, done, pinned/)).toBeVisible();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(tile(page, /^CS 2022, line 38, done, pinned/)).toBeVisible();
  });

  test("a pin that fills fewer lines asks first", async ({ page }) => {
    const math = ["MA 1021", "MA 1022", "MA 1023", "MA 1024", "MA 2071"];
    await openDegree(page, { courses: [savedCourse({ code: "CS 2022", credits: 3 }), ...math.map((code) => savedCourse({ code, credits: 3 }))] });
    await moveTo(page, /^CS 2022, line \d+/, /Mathematics · 38/);
    const dialog = page.getByRole("dialog", { name: "Keep this pin?" });
    await expect(dialog).toContainText("it fills one fewer line");
    await expect(dialog).toContainText("MA 2071");
    expect((await stored(page)).pins).toBeUndefined();
    await dialog.getByRole("button", { name: "Keep pin" }).click();
    await expect(tile(page, /^CS 2022, line 38, done, pinned/)).toBeVisible();
    expect((await stored(page)).pins).toEqual([{ code: "CS 2022", line: 38 }]);
  });

  test("an empty line offers what fits", async ({ page }) => {
    await openDegree(page, { courses: [savedCourse({ code: "CS 2022", credits: 3 })], pins: [{ code: "CS 2022", line: 38 }] });
    await tile(page, /^CS 2000\+, 5 lines left/).click();
    await tile(page, /^CS 2000\+, line 18, empty/).click();
    const fill = panel(page, "Courses that fit line 18");
    await expect(fill.getByText("Currently pinned to Mathematics, line 38")).toBeVisible();
    await expect(fill.getByRole("button", { name: "Suggest courses for this line" })).toHaveCount(SUGGESTIONS_ON ? 1 : 0);
    await fill.getByRole("button", { name: "Move CS 2022 here" }).click();
    await expect(tile(page, /^CS 2022, line 18, done, pinned/)).toBeVisible();
  });

  test("the phone moves a course without dragging", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await openDegree(page, { courses: [savedCourse({ code: "CS 2022", credits: 3 })] });
    await openAllSections(page);
    await moveTo(page, /^CS 2022, line \d+/, /Mathematics · 38/);
    await expect(tile(page, /^CS 2022, line 38, done, pinned/)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});

test.describe("insights", () => {
  const dated = { courses: [savedCourse({ code: "CS 1101", credits: 3, term: "A Term 2026" }), savedCourse({ code: "MA 1021", credits: 3, term: "B Term 2026" }), savedCourse({ code: "MA 1022", credits: 3 })] };

  test("asks for terms until there's enough to estimate", async ({ page }) => {
    await openDegree(page, { courses: [savedCourse({ code: "CS 1101", credits: 3 })] });
    await expect(page.getByRole("button", { name: "Add course terms" })).toBeVisible();
    await expect(page.getByText("Average unavailable · add completed-course terms")).toBeVisible();
  });

  test("a heavier semester load changes the estimate", async ({ page }) => {
    await openDegree(page, dated);
    const summary = page.getByRole("article").filter({ hasText: "Pace & what-if" });
    await expect(summary).toContainText("Estimated graduation");
    const slider = page.getByRole("slider", { name: "Credits per semester" });
    await expect(slider).toHaveValue("6");
    const before = await summary.textContent();
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await expect(summary).toContainText("At 21 credits a semester");
    expect(await summary.textContent()).not.toBe(before);
    await expect(summary.getByText(/semesters? earlier than 18 credits|Same graduation as 18 credits/)).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "I plan a BS/MS" })).toHaveCount(0);
  });

  test("selecting a term lights up its courses, and the chart has a table", async ({ page }) => {
    await openDegree(page, dated);
    const bar = page.getByRole("button", { name: /^A Term 2026: / });
    await bar.click();
    await expect(bar).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Show as table" }).click();
    await expect(page.getByRole("table").getByRole("rowheader", { name: "A Term 2026" })).toBeVisible();
  });
});

test.describe("keyboard focus", () => {
  test("tick boxes show a focus ring", async ({ page }) => {
    await openDegree(page);
    const iqp = page.getByRole("checkbox", { name: "IQP, line 10" });
    await page.getByRole("button", { name: /^Humanities|^HUA depth, / }).first().focus();
    await page.keyboard.press("Tab");
    await iqp.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    expect(await iqp.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("solid");
  });

  test("closing Share and Export puts focus back on their button", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("goatplan:tutorial:v1", "dismissed");
      localStorage.setItem("goatplan:term:v1", "2027-C");
      localStorage.setItem("goatplan:draft:v1:2027-C", JSON.stringify({ version: 1, courses: ["AE 2410"], preferences: { startsAfter: 0, blocked: [], onlyOpen: true }, locks: {}, professorByCourse: {}, sortPreset: "bestOverall", alternatives: {} }));
    });
    await page.goto("/");
    await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done", { timeout: 30_000 });
    const share = page.getByRole("button", { name: "Share", exact: true });
    await share.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Copy link" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(share).toBeFocused();
    const exportButton = page.getByRole("button", { name: "Export", exact: true });
    await exportButton.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Download .ics" })).toBeFocused();
    await exportButton.click();
    await expect(page.getByRole("dialog", { name: "Export to calendar" })).toBeHidden();
    await expect(exportButton).toBeFocused();
  });
});
