import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test as base, expect, type Page } from "@playwright/test";
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
      const file = path.join(dataDir, path.basename(new URL(route.request().url()).pathname));
      return existsSync(file) ? route.fulfill({ path: file }) : route.fulfill({ status: 404 });
    });
    await use();
  }, { auto: true }],
});

export { expect };

/** Opens the course details drawer for a course in "Your courses". */
export async function openCourseDetails(page: Page, code: string) {
  await page.locator(`[data-course-row="${code}"]`).click();
  await expect(page.getByRole("complementary", { name: "Course details" }).getByRole("heading", { level: 2, name: code })).toBeVisible();
}

/** Below 1100 px, Share, Export and Saved plans are in the top bar's "⋯" menu. */
export async function openMoreActions(page: Page) {
  const more = page.getByRole("button", { name: "More actions" });
  if ((await more.isVisible()) && (await more.getAttribute("aria-expanded")) !== "true") await more.click();
}
