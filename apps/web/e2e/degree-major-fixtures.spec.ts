import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "./fixtures/test";
import { auditReady, openAllSections, openDegree, panel, savedCourse, stored } from "./fixtures/degree";

test.skip(process.env.GOATPLAN_MAJOR_FIXTURES !== "1", "Uses the isolated fixture production build.");

test("validates imported pins against the backup's selected sheet", async ({ page }) => {
  await openDegree(page);
  await page.getByRole("button", { name: "Sheet options" }).click();
  await page.getByRole("button", { name: "Import history", exact: true }).click();
  const state = { manual: ["project"], pins: [{ code: "CS 1101", line: 34 }] };
  const backup = { version: 1, sheetId: "fixture-2030", courses: [savedCourse({ code: "CS 1101", credits: 3 })], ...state, sheets: { "fixture-2030": state } };
  await page.getByLabel("History file", { exact: true }).setInputFiles({ name: "fixture.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await panel(page, "Review history import").getByRole("button", { name: "Import 1 course", exact: true }).click();
  await expect(panel(page, "Review history & pins").getByText("Allowed", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Import history & pins", exact: true }).click();
  await auditReady(page);
  await expect(page.getByText("Fixture Engineering · Class of 2030 · Beta", { exact: true })).toBeVisible();
  expect((await stored(page)).pins).toEqual([{ code: "CS 1101", line: 34 }]);
});

test("requesting a major sends one event containing only its name", async ({ page }) => {
  await page.addInitScript(() => {
    const events: { name: string; data: unknown }[] = [];
    Object.assign(window, { degreeEvents: events });
    window.umami = { track: (name, data) => { events.push({ name, data }); } };
  });
  await openDegree(page);
  await page.getByRole("button", { name: "Change major" }).click();
  await page.getByRole("combobox", { name: "Major", exact: true }).click();
  await page.getByRole("option", { name: "Robotics Engineering · Coming soon", exact: true }).click();
  await page.getByRole("button", { name: "Request this major" }).click();
  await expect(page.getByRole("button", { name: "Request this major" })).toBeDisabled();
  expect(await page.evaluate(() => (window as unknown as { degreeEvents: { name: string; data: unknown }[] }).degreeEvents.filter((event) => event.name === "degree_major_requested"))).toEqual([{ name: "degree_major_requested", data: { major: "Robotics Engineering" } }]);
});

test("switches sheets by pointer and keyboard, retaining independent state and loading only the selected sheet", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const directory = path.join(readFileSync(path.resolve("../../.cache/degree-major/build-path"), "utf8"), ".next/static/chunks");
  const fixtureChunks = readdirSync(directory).filter((name) => name.endsWith(".js") && readFileSync(path.join(directory, name), "utf8").includes("Independent test fixture."));
  expect(fixtureChunks).toHaveLength(1);
  const downloads: string[] = [];
  page.on("request", (request) => { if (fixtureChunks.some((name) => request.url().endsWith(`/${name}`))) downloads.push(request.url()); });
  await openDegree(page, { courses: [savedCourse({ code: "MA 1021", credits: 3 })], manual: ["iqp-1"], pins: [{ code: "MA 1021", line: 34 }] });
  expect(downloads).toHaveLength(0);
  const change = page.getByRole("button", { name: "Change major" });
  if (testInfo.project.name === "touch") await change.tap();
  else await change.click();
  const picker = page.getByRole("combobox", { name: "Major", exact: true });
  if (testInfo.project.name === "touch") {
    await picker.tap();
    await page.getByRole("option", { name: "Fixture Engineering", exact: true }).tap();
    await page.getByRole("button", { name: "Continue", exact: true }).tap();
  } else {
    await picker.focus();
    await picker.press("f");
    await picker.press("Enter");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  }
  await auditReady(page);
  await expect(page.getByText("Fixture Engineering · Class of 2030 · Beta", { exact: true })).toBeVisible();
  expect(downloads).toHaveLength(1);
  await openAllSections(page);
  const project = page.getByRole("checkbox", { name: "Fixture project, line 36" });
  await expect(project).not.toBeChecked();
  await project.check();
  await auditReady(page);
  await page.reload();
  await auditReady(page);
  await openAllSections(page);
  await expect(page.getByRole("checkbox", { name: "Fixture project, line 36" })).toBeChecked();
  await page.getByRole("button", { name: "Sheet options" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export history & pins" }).click();
  const file = await download;
  const backup = readFileSync((await file.path())!, "utf8");
  expect(JSON.parse(backup)).toMatchObject({ sheetId: "fixture-2030", courses: [{ code: "MA 1021" }], sheets: { "cs-2030": { manual: ["iqp-1"], pins: [{ code: "MA 1021", line: 34 }] }, "fixture-2030": { manual: ["project"] } } });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await change.click();
  await picker.click();
  await page.getByRole("option", { name: "Computer Science", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await auditReady(page);
  await openAllSections(page);
  await expect(page.getByRole("checkbox", { name: "IQP, line 10" })).toBeChecked();
  expect((await stored(page)).pins).toEqual([{ code: "MA 1021", line: 34 }]);
  await page.getByRole("button", { name: "Sheet options" }).click();
  await page.getByRole("button", { name: "Import history", exact: true }).click();
  await page.getByLabel("History file", { exact: true }).setInputFiles({ name: "all-sheets.json", mimeType: "application/json", buffer: Buffer.from(backup) });
  await panel(page, "Review history import").getByRole("button", { name: "Import 0 courses" }).click();
  await auditReady(page);
  await expect(page.getByText("Fixture Engineering · Class of 2030 · Beta", { exact: true })).toBeVisible();
  await openAllSections(page);
  await expect(page.getByRole("checkbox", { name: "Fixture project, line 36" })).toBeChecked();
  expect(errors).toEqual([]);
});
