import { expect, test } from "./fixtures/test";
import { auditReady, openDegree, openHistory, panel, savedCourse, stored, storedCodes } from "./fixtures/degree";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

test("planned status, units and term stick after a reload, and reach the real audit", async ({ page }) => {
  await openDegree(page, { courses: [savedCourse({ code: "MA 1021", credits: 3 })] });
  const history = await openHistory(page);
  await history.getByRole("button", { name: "Edit MA 1021" }).click();
  const details = panel(page, "Edit course");
  await details.getByRole("radio", { name: "⅙" }).click();
  await details.getByRole("button", { name: /^Term \(optional\)/ }).click();
  await page.getByRole("button", { name: "D Term 2027", exact: true }).click();
  await expect(details.getByRole("button", { name: "Planned", exact: true })).toHaveAttribute("aria-pressed", "true");
  await details.getByRole("button", { name: "Save changes" }).click();
  await auditReady(page);
  await page.reload();
  await auditReady(page);
  expect((await stored(page)).courses[0]).toMatchObject({ credits: 1.5, term: "D Term 2027", status: "planned" });
});

test("manual WPI credit isn't marked AP/IB", async ({ page }) => {
  await openDegree(page);
  await page.getByRole("button", { name: "Find your courses" }).click();
  await page.getByRole("button", { name: "Add manual credit" }).click();
  const manual = panel(page, "Add manual credit");
  await expect(manual.getByRole("checkbox", { name: /AP \/ IB/ })).toHaveCount(0);
  await manual.getByRole("textbox", { name: "Course code" }).fill("EN 1000");
  await manual.getByRole("button", { name: "Add to history" }).click();
  await auditReady(page);
  expect((await stored(page)).courses[0]).toMatchObject({ code: "EN 1000", apIb: false });
});

test("saved AP/IB marks stay through a reload and the audit", async ({ page }) => {
  await openDegree(page, { courses: [savedCourse({ code: "EN 1100", credits: 3, apIb: true })] });
  await auditReady(page);
  await page.reload();
  await auditReady(page);
  expect((await stored(page)).courses[0]).toMatchObject({ code: "EN 1100", apIb: true });
});

test("a removed course can come back, and Undo restores its pin", async ({ page }) => {
  await openDegree(page, { courses: [savedCourse({ code: "CS 2022", credits: 3 })], pins: [{ code: "CS 2022", line: 38 }] });
  const history = await openHistory(page);
  await history.getByRole("button", { name: "Edit CS 2022" }).click();
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
