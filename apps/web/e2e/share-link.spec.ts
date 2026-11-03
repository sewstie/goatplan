import path from "node:path";
import { expect, frozenTerm, test, openMoreActions } from "./fixtures/test";
import type { Page } from "@playwright/test";
import { designPlan } from "../src/lib/plans/testing";

const sender = designPlan();

async function ready(page: Page) {
  await expect(page.locator("[data-planner-term-status]")).toHaveAttribute("data-planner-term-status", "ready");
  await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");
}

async function blockLabels(page: Page) {
  return page.locator("[data-block]:not([data-preview])").evaluateAll((blocks) => blocks.map((block) => block.getAttribute("aria-label")).sort());
}

for (const width of [1440, 834, 375]) {
  test(`Share opens the same read-only schedule in a fresh browser at ${width}px`, async ({ page, context, browser, baseURL }) => {
    await page.setViewportSize({ width, height: 900 });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.addInitScript((plan) => {
      if (sessionStorage.getItem("share-sender-seeded")) return;
      sessionStorage.setItem("share-sender-seeded", "true");
      localStorage.setItem("goatplan:tutorial:v1", "completed");
      localStorage.setItem("goatplan:term:v1", plan.termId);
      localStorage.setItem(`goatplan:draft:v1:${plan.termId}`, JSON.stringify({ version: 1, courses: plan.courses, locks: plan.locks, professorByCourse: plan.professorByCourse, preferences: { ...plan.preferences, blocked: plan.preferences.blocked.map((block) => ({ ...block, label: "Private appointment" })) }, sortPreset: plan.sortPreset, alternatives: {} }));
      Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    }, sender);
    await page.goto("/");
    await ready(page);
    const expected = await blockLabels(page);
    expect(expected.length).toBeGreaterThan(0);
    await openMoreActions(page);
    const share = page.getByRole("button", { name: "Share", exact: true });
    await expect(share).toBeVisible();
    await share.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Share this schedule" });
    await expect(dialog).toContainText("Blocked-time names, My degree and course history stay private.");
    await page.screenshot({ path: `e2e/screenshots/share-popover-${width}.png` });
    await dialog.getByRole("button", { name: "Copy link", exact: true }).click();
    await expect(dialog.getByRole("status")).toHaveText("Link copied.");
    const link = await page.evaluate(() => navigator.clipboard.readText());
    expect(link).toContain("#p=");
    expect(link.length).toBeLessThan(1500);
    const fresh = await browser.newContext({ baseURL, viewport: { width, height: 900 } });
    try {
      await fresh.route(/\/data\/[^/?]+\.json(\?.*)?$/, (route) => route.fulfill({ path: path.join(__dirname, "fixtures/data", path.basename(new URL(route.request().url()).pathname)) }));
      const viewer = await fresh.newPage();
      await viewer.goto(link);
      const bar = viewer.getByRole("region", { name: "Shared plan", exact: true });
      await expect(bar).toContainText("Viewing a shared plan");
      await expect(viewer.getByRole("button", { name: "Save a copy" })).toBeEnabled();
      await expect(viewer.locator("[data-block]:not([data-preview])")).toHaveCount(expected.length);
      expect(await blockLabels(viewer)).toEqual(expected);
      await expect(viewer.getByText("Private appointment", { exact: true })).toHaveCount(0);
      await expect(viewer.getByRole("button", { name: /^Remove/ })).toHaveCount(0);
      await expect(viewer.getByText("Fewest early classes").first()).toBeVisible();
      expect(await viewer.evaluate(() => Object.keys(localStorage).filter((key) => key.includes(":draft:") || key.includes(":plans:")))).toEqual([]);
      expect(await viewer.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await viewer.screenshot({ path: `e2e/screenshots/shared-plan-${width}.png`, fullPage: true });
      const close = viewer.getByRole("button", { name: "Close preview" });
      await close.focus();
      await viewer.keyboard.press("Enter");
      await expect(bar).toHaveCount(0);
      expect(new URL(viewer.url()).hash).toBe("");
      await viewer.reload();
      await expect(viewer.getByRole("region", { name: "Shared plan", exact: true })).toHaveCount(0);
    } finally {
      await fresh.close();
    }
  });
}

test("viewing and closing another term's link keeps every existing draft unchanged after reload", async ({ page }) => {
  const encoded = Buffer.from(JSON.stringify({ v: 1, t: "2027-D", c: [["CS 2223", [], []]], a: 600, b: [["Fri", 720, 780]], o: false, s: "latestStart" })).toString("base64url");
  await page.addInitScript(() => {
    if (sessionStorage.getItem("share-viewer-seeded")) return;
    sessionStorage.setItem("share-viewer-seeded", "true");
    localStorage.setItem("goatplan:tutorial:v1", "completed");
    localStorage.setItem("goatplan:term:v1", "2027-C");
    for (const term of ["2027-C", "2027-D"]) localStorage.setItem(`goatplan:draft:v1:${term}`, JSON.stringify({ version: 1, courses: ["AE 2320"], locks: {}, professorByCourse: {}, preferences: { startsAfter: 0, blocked: [], onlyOpen: true }, sortPreset: "fewestEarly", alternatives: {} }));
  });
  await page.goto("/");
  await ready(page);
  const before = await page.evaluate(() => ({ ...localStorage }));
  const draftBlocks = await blockLabels(page);
  await page.goto(`/?share=reserved#schedule&p=${encoded}`);
  const bar = page.getByRole("region", { name: "Shared plan", exact: true });
  await expect(bar).toContainText("Viewing a shared plan");
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(before);
  await page.reload();
  await expect(bar).toContainText("Viewing a shared plan");
  await page.getByRole("button", { name: "Close preview" }).click();
  await expect(bar).toHaveCount(0);
  await expect(page).toHaveURL("/?share=reserved#schedule");
  await ready(page);
  expect(await blockLabels(page)).toEqual(draftBlocks);
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(before);
  await page.reload();
  await ready(page);
  await expect(bar).toHaveCount(0);
  expect(await blockLabels(page)).toEqual(draftBlocks);
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(before);
});

const term = frozenTerm("2027-C");
const sectionsOf = (code: string) => term.courses.find((course) => course.code === code)!.options[0];
const linkTo = (courses: string[]) => `/#p=${Buffer.from(JSON.stringify({ v: 1, t: "2027-C", c: courses.map((code) => [code, sectionsOf(code), []]), a: 0, b: [], o: false, s: "fewestEarly" })).toString("base64url")}`;
const draftKey = "goatplan:draft:v1:2027-C";

async function seedDraft(page: Page, courses: string[]) {
  await page.addInitScript(({ courses, draftKey }) => {
    if (sessionStorage.getItem("share-copy-seeded")) return;
    sessionStorage.setItem("share-copy-seeded", "true");
    localStorage.setItem("goatplan:tutorial:v1", "completed");
    localStorage.setItem("goatplan:term:v1", "2027-C");
    localStorage.setItem(draftKey, JSON.stringify({ version: 1, courses, locks: {}, professorByCourse: {}, preferences: { startsAfter: 0, blocked: [], onlyOpen: false }, sortPreset: "fewestEarly", alternatives: {} }));
  }, { courses, draftKey });
}

const savedPlans = (page: Page) => page.evaluate(() => Object.entries(localStorage).filter(([key]) => key.startsWith("goatplan:plans:v1:plan:")).map(([, value]) => JSON.parse(value)));
const storedDraft = (page: Page) => page.evaluate((key) => localStorage.getItem(key), draftKey);
const sharedBar = (page: Page) => page.getByRole("region", { name: "Shared plan", exact: true });
const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
const copySaved = (page: Page) => page.getByRole("dialog", { name: "A copy is saved" });
const NAME = "C Term · Shared copy";

for (const width of [1440, 375]) {
  test(`Save a copy adds the plan to Saved plans and leaves the draft alone at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await seedDraft(page, ["AE 2410"]);
    await page.goto("/");
    await ready(page);
    const draftBlocks = await blockLabels(page);
    const draft = await storedDraft(page);
    await page.goto(linkTo(["AE 2320", "AE 2210"]));
    await page.reload();
    await button(page, "Save a copy").click();
    await expect(copySaved(page)).toContainText("Saved separately from your own draft.");
    await page.screenshot({ path: `e2e/screenshots/shared-plan-saved-${width}.png` });
    expect(await storedDraft(page)).toBe(draft);
    const [copy] = await savedPlans(page);
    expect(copy).toMatchObject({ name: NAME, termId: "2027-C", courses: ["AE 2320", "AE 2210"] });
    expect(copy.schedule.map((course: { sections: { id: string }[] }) => course.sections.map((section) => section.id))).toEqual([sectionsOf("AE 2320"), sectionsOf("AE 2210")]);
    await copySaved(page).getByRole("button", { name: "Back to my draft" }).click();
    await expect(sharedBar(page)).toHaveCount(0);
    await ready(page);
    expect(await blockLabels(page)).toEqual(draftBlocks);
    expect(await storedDraft(page)).toBe(draft);
    await page.goto("/plans");
    await expect(page.getByRole("heading", { name: NAME, exact: true })).toBeVisible();
  });
}

test("a saved copy can be renamed as it's saved, and saving again gets a new name", async ({ page }) => {
  await seedDraft(page, ["AE 2410"]);
  const link = linkTo(["AE 2320"]);
  await page.goto(link);
  await button(page, "Save a copy").click();
  await copySaved(page).getByRole("button", { name: "Close" }).click();
  await page.goto("about:blank");
  await page.goto(link);
  await button(page, "Save a copy").click();
  await expect(copySaved(page).getByRole("textbox", { name: "Saved plan name" })).toHaveValue(`${NAME} 2`);
  await copySaved(page).getByRole("textbox", { name: "Saved plan name" }).fill("Friend’s plan");
  await copySaved(page).getByRole("button", { name: "Back to my draft" }).click();
  await expect(sharedBar(page)).toHaveCount(0);
  expect((await savedPlans(page)).map((plan: { name: string }) => plan.name).sort()).toEqual([NAME, "Friend’s plan"].sort());
});

test("Open for editing warns about unsaved changes before it replaces the draft", async ({ page }) => {
  await seedDraft(page, ["AE 2410"]);
  await page.goto(linkTo(["AE 2320", "AE 2210"]));
  const open = button(page, "Open for editing");
  await open.click();
  const draft = await storedDraft(page);
  const warning = page.getByRole("dialog", { name: `Open “${NAME}”?` });
  await expect(warning).toContainText("Your unsaved changes to the C Term schedule will be lost.");
  await warning.getByRole("button", { name: "Cancel" }).click();
  await expect(warning).toHaveCount(0);
  await expect(sharedBar(page)).toContainText("Viewing a shared plan");
  expect(await storedDraft(page)).toBe(draft);
  await open.click();
  await warning.getByRole("button", { name: "Open plan" }).click();
  await expect(sharedBar(page)).toHaveCount(0);
  expect(new URL(page.url()).hash).toBe("");
  await ready(page);
  await expect(page.getByRole("button", { name: "Schedule saved", exact: true })).toBeVisible();
  expect(JSON.parse((await storedDraft(page))!).courses).toEqual(["AE 2320", "AE 2210"]);
  await page.reload();
  await ready(page);
  await expect(sharedBar(page)).toHaveCount(0);
  expect(JSON.parse((await storedDraft(page))!).courses).toEqual(["AE 2320", "AE 2210"]);
});

test("Edit this copy doesn't warn when the draft is empty", async ({ page }) => {
  await seedDraft(page, []);
  await page.goto(linkTo(["AE 2320"]));
  await button(page, "Save a copy").click();
  await copySaved(page).getByRole("button", { name: "Edit this copy" }).click();
  await expect(sharedBar(page)).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await ready(page);
  expect(JSON.parse((await storedDraft(page))!).courses).toEqual(["AE 2320"]);
});

const fresh = (page: Page) => page.getByRole("dialog", { name: "This plan needs a fresh look" });

for (const width of [1440, 375]) {
  test(`a link says what's missing and still shows the rest of the plan at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const [keptSection, removedSection] = sectionsOf("AE 2320").length > 1 ? sectionsOf("AE 2320") : [sectionsOf("AE 2320")[0], "AE 2320-GONE"];
    const link = `/#p=${Buffer.from(JSON.stringify({ v: 1, t: "2027-C", c: [["AE 2210", sectionsOf("AE 2210"), []], ["AE 2320", [keptSection, removedSection], []], ["AE 2410", sectionsOf("AE 2410"), []]], a: 0, b: [], o: false, s: "fewestEarly" })).toString("base64url")}`;
    const changed = { ...term, courses: term.courses.filter((course) => course.code !== "AE 2210").map((course) => ({ ...course, sections: course.sections.filter((section) => section.id !== removedSection) })) };
    await page.route("**/data/2027-C.json", (route) => route.fulfill({ json: changed }));
    await seedDraft(page, ["AE 2410"]);
    await page.goto(link);
    await expect(fresh(page)).toContainText("The original choices are preserved");
    await expect(fresh(page)).toContainText("AE 2210");
    await page.screenshot({ path: `e2e/screenshots/shared-plan-fresh-look-${width}.png` });
    await fresh(page).getByRole("button", { name: "Review a copy" }).click();
    const bar = sharedBar(page);
    await expect(bar.getByText("AE 2210 is no longer offered.")).toBeVisible();
    await expect(bar.getByText(`AE 2320 ${removedSection.slice("AE 2320-".length)} is no longer offered.`)).toBeVisible();
    const kept = page.locator("[data-block]:not([data-preview])");
    await expect(kept.filter({ hasText: "AE 2320" }).first()).toBeAttached();
    await expect(kept.filter({ hasText: "AE 2410" }).first()).toBeAttached();
    await expect(kept.filter({ hasText: "AE 2210" })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `e2e/screenshots/shared-plan-removed-${width}.png`, fullPage: true });
    await button(page, "Save a copy").click();
    const [copy] = await savedPlans(page);
    expect(copy.courses).toEqual(["AE 2320", "AE 2410"]);
  });
}

test("a course whose only chosen section was removed stays in the plan and can be saved and opened", async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  const link = `/#p=${Buffer.from(JSON.stringify({ v: 1, t: "2027-C", c: [["AE 2320", ["AE 2320-GONE"], []], ["AE 2410", sectionsOf("AE 2410"), []]], a: 0, b: [], o: false, s: "fewestEarly" })).toString("base64url")}`;
  await seedDraft(page, []);
  await page.goto(link);
  await fresh(page).getByRole("button", { name: "Review a copy" }).click();
  await expect(sharedBar(page).getByText("AE 2320 GONE is no longer offered.")).toBeVisible();
  const kept = page.locator("[data-block]:not([data-preview])");
  await expect(kept.filter({ hasText: "AE 2410" }).first()).toBeAttached();
  await expect(kept.filter({ hasText: "AE 2320" })).toHaveCount(0);
  await button(page, "Save a copy").click();
  const [copy] = await savedPlans(page);
  expect(copy.courses).toEqual(["AE 2320", "AE 2410"]);
  expect(copy.schedule.map((course: { code: string }) => course.code)).toEqual(["AE 2410"]);
  await copySaved(page).getByRole("button", { name: "Edit this copy" }).click();
  await expect(sharedBar(page)).toHaveCount(0);
  await ready(page);
  expect(JSON.parse((await storedDraft(page))!).courses).toEqual(["AE 2320", "AE 2410"]);
  expect(errors).toEqual([]);
});

test("a link with nothing left to save still explains what happened", async ({ page }) => {
  await page.route("**/data/2027-C.json", (route) => route.fulfill({ json: { ...term, courses: term.courses.filter((course) => course.code !== "AE 2320") } }));
  await seedDraft(page, ["AE 2410"]);
  await page.goto(linkTo(["AE 2320"]));
  await fresh(page).getByRole("button", { name: "Review a copy" }).click();
  await expect(sharedBar(page).getByText("AE 2320 is no longer offered.")).toBeVisible();
  await expect(button(page, "Save a copy")).toBeDisabled();
  await button(page, "Close preview").click();
  await expect(sharedBar(page)).toHaveCount(0);
});

for (const { name, data } of [
  { name: "broken", data: "broken" },
  { name: "old-format", data: Buffer.from(JSON.stringify({ v: 0 })).toString("base64url") },
  { name: "unpublished-term", data: Buffer.from(JSON.stringify({ v: 1, t: "1999-A", c: [["CS 2223", [], []]], a: 0, b: [], o: true, s: "fewestEarly" })).toString("base64url") },
]) {
  test(`${name} share links show a friendly error and can be closed`, async ({ page }) => {
    await page.goto(`/#p=${data}`);
    const dialog = page.getByRole("dialog", { name: "We couldn’t open this plan" });
    await expect(dialog).toContainText("Your draft hasn’t changed.");
    await expect(page.getByRole("dialog").filter({ hasText: "Getting started" })).toHaveCount(0);
    await dialog.getByRole("button", { name: "Return to my planner" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL("/");
  });
}
