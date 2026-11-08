import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test as base, expect, type Locator, type Page } from "@playwright/test";
import type { TermFile } from "../../src/lib/data/types";

/** A copy of public/data from 2026-10-29, so the daily data update can't break e2e. */
const dataDir = path.join(__dirname, "data");

export function frozenTerm(id: string): TermFile {
  return JSON.parse(readFileSync(path.join(dataDir, `${id}.json`), "utf8"));
}

// A context route, so any page.route in a spec still wins over it.
export const test = base.extend<{ frozenData: void }>({
  frozenData: [async ({ context }, use) => {
    await context.route(/\/data\/[^/?]+\.json(\?.*)?$/, (route) => {
      const name = path.basename(new URL(route.request().url()).pathname);
      const file = name === "catalog.json" ? path.join(__dirname, "../../../../data/catalog.json") : path.join(dataDir, name);
      return existsSync(file) ? route.fulfill({ path: file }) : route.fulfill({ status: 404 });
    });
    await use();
  }, { auto: true }],
});

export { expect };

/** Shows a course from "Your courses" in the details sidebar. */
export async function openCourseDetails(page: Page, code: string) {
  await page.locator(`[data-course-row="${code}"]`).click();
  await expect(page.getByRole("complementary", { name: "Course details" }).getByRole("heading", { level: 2, name: code })).toBeVisible();
}

/** "Any time", or a time written like the list does, "9:00 AM". */
export function startsAfterLabel(minutes: number) {
  if (minutes === 0) return "Any time";
  const hour = Math.floor(minutes / 60);
  return `${((hour + 11) % 12) + 1}:${String(minutes % 60).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}

/** Picks a "Starts after" time from its list, like Sort. Phones use their own picker instead. */
export async function pickStartsAfter(scope: Page | Locator, minutes: number) {
  const page = "page" in scope ? scope.page() : scope;
  // By keyboard, since an open guide can sit over the field.
  await scope.getByRole("combobox", { name: "Starts after" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("listbox", { name: "Starts after" }).getByRole("option", { name: startsAfterLabel(minutes), exact: true }).click();
}

/** "Starts after" as it reads on screen, for checking which time is picked. */
export const startsAfterText = (minutes: number) => `Starts after${startsAfterLabel(minutes)}`;

/** On a phone, Share and Export are in the "⋯" menu. */
export async function openMoreActions(page: Page) {
  const more = page.getByRole("button", { name: "More actions" });
  if ((await more.isVisible()) && (await more.getAttribute("aria-expanded")) !== "true") await more.click();
}
