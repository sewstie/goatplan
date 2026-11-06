import { expect, test } from "./fixtures/test";
import type { Page } from "@playwright/test";
import { auditReady, openDegree, openHistory, panel, savedCourse, stored, storedCodes } from "./fixtures/degree";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

const WORKDAY_PASTE = `Registered Courses
CS 1101 - Introduction to Program Design  A Term 2026  Grade SecretGradeMarker
MA 1021 - Calculus I  A Term 2026  A
ma1022 - Calculus II  B Term 2026  B
PH 1110 General Physics  B Term 2026  NR
WR 1011 Writing  C Term 2027  In progress
CS-2102 Object-Oriented Design Concepts  C Term 2027  In Progress
Room 2005 08/21
`;

const paste = async (page: Page, text: string) => {
  await page.getByRole("tab", { name: "Add several" }).click();
  await page.getByRole("textbox", { name: "Workday course text" }).fill(text);
};

async function openPaste(page: Page) {
  await page.getByRole("button", { name: "Add several courses" }).click();
}

test("a student adds courses from a Workday paste, keeping only what counts", async ({ page }) => {
  await openDegree(page);
  await openPaste(page);
  await paste(page, WORKDAY_PASTE);
  await page.getByRole("button", { name: "Review 6 courses" }).click();
  const review = panel(page, "Review detected courses");
  await expect(review.getByText("6 detected")).toBeVisible();
  await expect(review.getByText("Nothing has been saved yet.", { exact: false })).toBeVisible();
  await review.getByRole("button", { name: "Add 6 courses" }).click();
  await auditReady(page);
  const history = await stored(page);
  expect(history.courses.map((course: { code: string }) => course.code)).toEqual(["CS 1101", "MA 1021", "MA 1022", "PH 1110", "WR 1011", "CS 2102"]);
  expect(history.courses.find((course: { code: string }) => course.code === "CS 2102")).toMatchObject({ term: "C Term 2027", status: "taken" });
  expect(history.courses.find((course: { code: string }) => course.code === "MA 1022")).toMatchObject({ term: "B Term 2026", status: "taken" });
  const text = JSON.stringify(history);
  for (const detail of ["SecretGradeMarker", "NR", "08/21", "Room"]) expect(text).not.toContain(detail);
});

test("the paste flow works by keyboard alone", async ({ page }) => {
  await openDegree(page);
  await page.getByRole("button", { name: "Add several courses" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("textbox", { name: "Workday course text" }).focus();
  await page.keyboard.insertText("CS 1101\nMA 1021");
  await page.getByRole("button", { name: "Review 2 courses" }).focus();
  await page.keyboard.press("Enter");
  const box = page.getByRole("checkbox", { name: "Add MA 1021" });
  await box.focus();
  await page.keyboard.press("Space");
  await expect(box).not.toBeChecked();
  await page.getByRole("button", { name: "Add 1 course" }).focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => storedCodes(page)).toEqual(["CS 1101"]);
});

test("closing the review adds nothing", async ({ page }) => {
  await openDegree(page);
  await openPaste(page);
  await paste(page, "CS 1101");
  await page.getByRole("button", { name: "Review 1 course" }).click();
  await page.keyboard.press("Escape");
  await expect(panel(page, "Review detected courses")).toHaveCount(0);
  expect(await storedCodes(page)).toEqual([]);
});

test("a course already in the history can't be added twice", async ({ page }) => {
  await openDegree(page, { courses: [savedCourse({ code: "CS 1101", credits: 3 })] });
  await page.getByRole("button", { name: "Add courses" }).click();
  await paste(page, "CS 1101\nMA 1021");
  await page.getByRole("button", { name: "Review 2 courses" }).click();
  const review = panel(page, "Review detected courses");
  await expect(review.getByRole("checkbox", { name: "Add CS 1101" })).toBeDisabled();
  await expect(review.getByText("Already in history · duplicate will not be added")).toBeVisible();
});

test("planned status, units and term stick after a reload, and reach the real audit", async ({ page }) => {
  await openDegree(page, { courses: [savedCourse({ code: "MA 1021", credits: 3 })] });
  const history = await openHistory(page);
  await history.getByRole("button", { name: "MA 1021 details" }).click();
  const details = panel(page, "Course details");
  await details.getByRole("textbox", { name: "Units" }).fill("1/6");
  await details.getByRole("combobox", { name: "Term" }).selectOption("A Term 2026");
  await details.getByRole("combobox", { name: "Status" }).selectOption("planned");
  await details.getByRole("button", { name: "Save changes" }).click();
  await auditReady(page);
  await page.reload();
  await auditReady(page);
  expect((await stored(page)).courses[0]).toMatchObject({ credits: 1.5, term: "A Term 2026", status: "planned" });
});

test("AP/IB goes to the engine with the audit request", async ({ page }) => {
  await openDegree(page);
  await page.getByRole("button", { name: "Add one course" }).click();
  await page.getByRole("button", { name: "Enter a course manually" }).click();
  const manual = panel(page, "Add a manual course");
  await manual.getByRole("textbox", { name: "Course code" }).fill("EN 1000");
  await manual.getByRole("checkbox", { name: /AP \/ IB credit/ }).check({ force: true });
  await manual.getByRole("button", { name: "Add to history" }).click();
  await auditReady(page);
  expect((await stored(page)).courses[0]).toMatchObject({ code: "EN 1000", apIb: true });
});

test("export then import brings back the same history, pins included", async ({ page, browser, baseURL }) => {
  const original = { courses: [savedCourse({ code: "CS 2022", credits: 3, term: "A Term 2026" }), savedCourse({ code: "MA 1021", credits: 3 })], manual: ["iqp-1"], pins: [{ code: "CS 2022", line: 38 }] };
  await openDegree(page, original);
  await page.getByRole("button", { name: "Sheet options" }).click();
  await page.getByRole("button", { name: "Import history" }).click();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download JSON" }).click()]);
  expect(download.suggestedFilename()).toBe("GoatPlan-history.json");
  const file = await download.path();

  const fresh = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 } });
  try {
    const other = await fresh.newPage();
    await openDegree(other);
    await other.getByRole("button", { name: "Sheet options" }).click();
    await other.getByRole("button", { name: "Import history" }).click();
    await other.getByLabel("History file").setInputFiles(file);
    const review = panel(other, "Review history import");
    await expect(review.getByText("Valid GoatPlan export · 2 courses")).toBeVisible();
    await review.getByRole("button", { name: "Import 2 courses" }).click();
    const pins = panel(other, "Review history & pins");
    await expect(pins.getByText("CS 2022 → Math 38")).toBeVisible();
    await expect(pins.getByText("Allowed")).toBeVisible();
    await pins.getByRole("button", { name: "Import history & pins" }).click();
    await auditReady(other);
    expect((await stored(other)).pins).toEqual(original.pins);
    expect((await stored(other)).courses).toEqual(JSON.parse(JSON.stringify(original.courses)));
  } finally {
    await fresh.close();
  }
});

test("importing merges with what's here, skipping duplicates", async ({ page }) => {
  await openDegree(page, { courses: [savedCourse({ code: "MA 1021", credits: 3 })] });
  await page.getByRole("button", { name: "Sheet options" }).click();
  await page.getByRole("button", { name: "Import history" }).click();
  const body = { version: 1, courses: [savedCourse({ code: "MA 1021", credits: 3 }), savedCourse({ code: "CS 1101", credits: 3 })], manual: [] };
  await page.getByLabel("History file").setInputFiles({ name: "history.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(body)) });
  const review = panel(page, "Review history import");
  await expect(review).toContainText("1 course is already on this device.");
  await review.getByRole("button", { name: "Import 1 course" }).click();
  await expect.poll(() => storedCodes(page)).toEqual(["MA 1021", "CS 1101"]);
});

test("a restored pin that isn't allowed is reported without losing the history", async ({ page }) => {
  await openDegree(page);
  await page.getByRole("button", { name: "Sheet options" }).click();
  await page.getByRole("button", { name: "Import history" }).click();
  const body = { version: 1, courses: [savedCourse({ code: "CS 2119", credits: 3 }), savedCourse({ code: "CS 2022", credits: 3 })], manual: [], pins: [{ code: "CS 2119", line: 18 }, { code: "CS 2022", line: 38 }] };
  await page.getByLabel("History file").setInputFiles({ name: "history.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(body)) });
  await panel(page, "Review history import").getByRole("button", { name: "Import 2 courses" }).click();
  await panel(page, "Review history & pins").getByRole("button", { name: "Import history & pins" }).click();
  const dialog = page.getByRole("dialog", { name: "Review a restored pin" });
  await expect(dialog).toContainText("CS 2119 is not allowed on Computer science, line 18.");
  await expect(dialog).toContainText("CS 2022 → Math 38");
  expect((await stored(page)).pins).toEqual([{ code: "CS 2022", line: 38 }]);
});

const badFiles: [string, string, string][] = [
  ["broken JSON", "{broken", "It isn’t a GoatPlan history."],
  ["wrong version", JSON.stringify({ version: 99, courses: [], manual: [] }), "It’s from a different version of GoatPlan."],
  ["hostile credits", JSON.stringify({ version: 1, courses: [{ code: "CS 1101", title: "", credits: 1e9, status: "taken", apIb: false, source: "found" }], manual: [] }), "One record has an invalid credit amount."],
  ["hostile code", JSON.stringify({ version: 1, courses: [{ code: "<img src=x>", title: "", credits: 3, status: "taken", apIb: false, source: "found" }], manual: [] }), "One record can’t be read."],
  ["hostile prototype", '{"version":1,"courses":[],"manual":[],"__proto__":{"polluted":true}}', ""],
];

for (const [name, text, message] of badFiles.filter(([, , reason]) => reason)) {
  test(`a ${name} file says why and changes nothing`, async ({ page }) => {
    await openDegree(page, { courses: [savedCourse({ code: "MA 1021", credits: 3 })] });
    await page.getByRole("button", { name: "Sheet options" }).click();
    await page.getByRole("button", { name: "Import history" }).click();
    await page.getByLabel("History file").setInputFiles({ name: "my-course-history.json", mimeType: "application/json", buffer: Buffer.from(text) });
    const error = panel(page, "Your history is unchanged");
    await expect(error).toContainText(message);
    await expect(error).toContainText("Nothing was imported; your 1 existing course is unchanged.");
    expect(await storedCodes(page)).toEqual(["MA 1021"]);
  });
}

test("a huge file is refused", async ({ page }) => {
  await openDegree(page);
  await page.getByRole("button", { name: "Sheet options" }).click();
  await page.getByRole("button", { name: "Import history" }).click();
  await page.getByLabel("History file").setInputFiles({ name: "huge.json", mimeType: "application/json", buffer: Buffer.alloc(300 * 1024, " ") });
  await expect(panel(page, "Your history is unchanged")).toBeVisible();
});

test("a removed course can come back, and Undo restores its pin", async ({ page }) => {
  await openDegree(page, { courses: [savedCourse({ code: "CS 2022", credits: 3 })], pins: [{ code: "CS 2022", line: 38 }] });
  const history = await openHistory(page);
  await history.getByRole("button", { name: "CS 2022 details" }).click();
  await page.getByRole("button", { name: "Remove course" }).click();
  await expect(page.getByText("CS 2022 removed from history.")).toBeVisible();
  expect(await storedCodes(page)).toEqual([]);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect.poll(() => storedCodes(page)).toEqual(["CS 2022"]);
  expect((await stored(page)).pins).toEqual([{ code: "CS 2022", line: 38 }]);
});

test("when storage is blocked it offers an export and doesn't pretend it saved", async ({ page }) => {
  await openDegree(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("full");
    };
  });
  await page.getByRole("checkbox", { name: "IQP, line 10" }).check({ force: true });
  const dialog = page.getByRole("dialog", { name: "Keep a copy of your changes" });
  await expect(dialog).toContainText("Not saved on this device");
  const [download] = await Promise.all([page.waitForEvent("download"), dialog.getByRole("button", { name: "Export history & pins" }).click()]);
  expect(download.suggestedFilename()).toBe("GoatPlan-history.json");
  await dialog.getByRole("button", { name: "Keep planning" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("1 of 45")).toBeVisible({ timeout: 30_000 });
});
