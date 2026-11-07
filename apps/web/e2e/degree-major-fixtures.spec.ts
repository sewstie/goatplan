import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "./fixtures/test";
import { auditReady, openAllSections, openDegree, savedCourse, stored } from "./fixtures/degree";

test.skip(process.env.GOATPLAN_MAJOR_FIXTURES !== "1", "Uses the isolated fixture production build.");

test("requesting a major sends one event containing only its name", async ({ page }) => {
  await page.addInitScript(() => {
    const events: { name: string; data: unknown }[] = [];
    Object.assign(window, { degreeEvents: events });
    window.umami = { track: (name, data) => { events.push({ name, data }); } };
  });
  await openDegree(page);
  await page.getByRole("button", { name: "Change major" }).click();
  await page.getByRole("combobox", { name: "Major", exact: true }).click();
  await page.getByRole("option", { name: "Mechanical Engineering · Coming soon", exact: true }).click();
  await page.getByRole("button", { name: "Request this major" }).click();
  await expect(page.getByRole("button", { name: "Request this major" })).toBeDisabled();
  expect(await page.evaluate(() => (window as unknown as { degreeEvents: { name: string; data: unknown }[] }).degreeEvents.filter((event) => event.name === "degree_major_requested"))).toEqual([{ name: "degree_major_requested", data: { major: "Mechanical Engineering" } }]);
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
  await change.click();
  await picker.click();
  await page.getByRole("option", { name: "Computer Science", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await auditReady(page);
  await openAllSections(page);
  await expect(page.getByRole("checkbox", { name: "IQP, line 10" })).toBeChecked();
  expect((await stored(page)).pins).toEqual([{ code: "MA 1021", line: 34 }]);
  expect(errors).toEqual([]);
});
