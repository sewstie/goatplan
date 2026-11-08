import type { Page } from "@playwright/test";

/** "MA 1022 CL01" for every class block the shown schedule puts on the calendar. */
export async function blockSections(page: Page): Promise<string[]> {
  const labels = await page.locator("[data-block]:not([data-preview])").evaluateAll((blocks) =>
    blocks.map((block) => block.getAttribute("aria-label") ?? block.querySelector("[aria-label]")?.getAttribute("aria-label") ?? ""),
  );
  return [...new Set(labels.map((label) => label.split(",")[0]).filter(Boolean))].sort();
}

/** The lecture each course in "Your courses" takes in the shown schedule, like "L01", read from the calendar. */
export async function lecturesByCourse(page: Page): Promise<string[]> {
  const codes = await page.locator("[data-course-row]").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-course-row") ?? ""));
  const sections = await blockSections(page);
  return codes.map((code) => sections.find((section) => section.startsWith(`${code} L0`))?.slice(code.length + 1) ?? "");
}
