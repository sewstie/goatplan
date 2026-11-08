import { expect, test } from "./fixtures/test";
import type { Page } from "@playwright/test";
import { designPlan, section, termWith } from "../src/lib/plans/testing";

declare global {
  interface Window {
    themeFrames: { theme?: string; scheme: string; canvas: string }[];
  }
}

async function openPalette(page: Page, width: number) {
  const plan = designPlan();
  plan.courses.push("CS 1004");
  plan.schedule.push({ code: "CS 1004", title: "Seminar", sections: [
    section("CS 1004", "C01", { meetings: [{ days: ["Mon", "Wed", "Fri"], start: 780, end: 830, location: "Unity Hall 400" }] }),
    section("CS 1004", "C02", { meetings: [] }),
  ] });
  await page.setViewportSize({ width, height: 1000 });
  await page.route("**/data/2027-C.json", (route) => route.fulfill({ json: termWith(plan) }));
  await page.addInitScript((plan) => {
    localStorage.setItem("goatplan:tutorial:v1", "dismissed");
    localStorage.setItem("goatplan:term:v1", plan.termId);
    localStorage.setItem(`goatplan:draft:v1:${plan.termId}`, JSON.stringify({ version: 1, ...plan, alternatives: {} }));
  }, plan);
  await page.goto("/");
  await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");
}

test("Light is the default on a dark device and keyboard choices survive reloads", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => localStorage.setItem("goatplan:tutorial:v1", "dismissed"));
  await page.goto("/");
  const dark = page.getByRole("button", { name: "Switch to dark theme" });
  await expect(dark).toBeVisible();
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await dark.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeFocused();
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  await page.reload();
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.reload();
  await expect(dark).toBeVisible();
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
});

for (const storage of ["invalid", "read blocked", "write blocked"]) {
  test(`${storage} storage keeps Light as the default and permits an in-memory change`, async ({ page }) => {
    await page.addInitScript((storage) => {
      localStorage.setItem("goatplan:tutorial:v1", "dismissed");
      localStorage.setItem("goatplan:theme:v1", "system");
      const get = Storage.prototype.getItem;
      const set = Storage.prototype.setItem;
      Storage.prototype.getItem = function (key) {
        if (key === "goatplan:theme:v1" && storage === "read blocked") throw new DOMException("Blocked", "SecurityError");
        return get.call(this, key);
      };
      Storage.prototype.setItem = function (key, value) {
        if (key === "goatplan:theme:v1" && storage === "write blocked") throw new DOMException("Full", "QuotaExceededError");
        set.call(this, key, value);
      };
    }, storage);
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
    await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  });
}

test("saved Dark is applied before painted frames without hydration, including a hard reload", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("goatplan:theme:v1", "dark");
    window.themeFrames = [];
    const record = () => {
      if (document.body) {
        const style = getComputedStyle(document.documentElement);
        window.themeFrames.push({ theme: document.documentElement.dataset.theme, scheme: style.colorScheme, canvas: style.backgroundColor });
      }
      requestAnimationFrame(record);
    };
    requestAnimationFrame(record);
  });
  await page.route(/\/_next\/static\/.*\.js(?:\?.*)?$/, (route) => route.abort());
  const session = await page.context().newCDPSession(page);
  await session.send("Network.enable");
  await session.send("Network.setCacheDisabled", { cacheDisabled: true });
  await page.goto("/");
  for (let visit = 0; visit < 2; visit++) {
    await expect.poll(() => page.evaluate(() => window.themeFrames.length)).toBeGreaterThan(2);
    const frames = await page.evaluate(() => window.themeFrames);
    for (const frame of frames) expect(frame).toEqual({ theme: "dark", scheme: "dark", canvas: "rgb(15, 17, 21)" });
    if (visit === 0) await page.reload();
  }
  expect(errors).toEqual([]);
});

test("Dark uses the existing light colors for print without losing the browser choice", async ({ page }) => {
  await openPalette(page, 1440);
  const light = await page.locator("html").evaluate((root) => {
    const style = getComputedStyle(root);
    return [style.backgroundColor, style.color, style.colorScheme, style.getPropertyValue("--color-course-2")];
  });
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.emulateMedia({ media: "print" });
  expect(await page.locator("html").evaluate((root) => {
    const style = getComputedStyle(root);
    return [style.backgroundColor, style.color, style.colorScheme, style.getPropertyValue("--color-course-2")];
  })).toEqual(light);
  await page.emulateMedia({ media: "screen" });
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
});

for (const width of [1440, 834]) {
  test(`the planner palette and drawing controls work at ${width}px`, async ({ page }) => {
    await openPalette(page, width);
    await page.screenshot({ path: `e2e/screenshots/theme-planner-light-${width}.png`, fullPage: true, animations: "disabled" });
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(page.locator("html")).toHaveCSS("background-color", "rgb(15, 17, 21)");
    await expect(page.getByRole("heading", { name: "No set time", exact: true })).toBeVisible();
    await expect(page.getByLabel("Tuesday 2:00 to 4:00 PM, blocked", { exact: true })).toBeVisible();
    await page.screenshot({ path: `e2e/screenshots/theme-planner-dark-${width}.png`, fullPage: true, animations: "disabled" });
    await page.getByRole("button", { name: "Block a time" }).click();
    await expect(page.getByRole("button", { name: "Drawing busy times" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("group", { name: "Drawing mode" })).toBeVisible();
    await expect(page.locator("[data-block]").first()).toHaveCSS("opacity", "0.85");
    await page.screenshot({ path: `e2e/screenshots/theme-drawing-dark-${width}.png`, fullPage: true, animations: "disabled" });
    await page.getByRole("button", { name: "Drawing busy times" }).click();
    const course = page.getByRole("button", { name: /^AE 2410 C01, .*Tuesday/ });
    await page.getByRole("button", { name: /^AE 2320 CL01, .*Tuesday/ }).focus();
    await page.keyboard.press("Tab");
    await expect(course).toBeFocused();
    await expect(course).toHaveCSS("outline-style", "solid");
    await page.screenshot({ path: `e2e/screenshots/theme-focus-dark-${width}.png`, animations: "disabled" });
    await page.getByRole("button", { name: "Guide", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Pick your term" })).toBeVisible();
    await page.screenshot({ path: `e2e/screenshots/theme-guide-dark-${width}.png`, animations: "disabled" });
  });
}
