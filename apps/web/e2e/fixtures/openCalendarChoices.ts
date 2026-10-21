import type { Page } from "@playwright/test";

export async function openCalendarChoices(page: Page, name: RegExp) {
  const block = page.locator("button[data-block]").and(page.getByRole("button", { name })).first();
  if (await block.getAttribute("aria-pressed") !== "true") await block.click();
  await block.click();
}
