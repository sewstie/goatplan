import { expect, type Page } from "@playwright/test";
import { designPlan, termWith } from "../../src/lib/plans/testing";

export async function seedThemePlan(page: Page) {
  const plan = designPlan();
  await page.route("**/data/2027-C.json", (route) => route.fulfill({ json: termWith(plan) }));
  await page.addInitScript((plan) => {
    if (sessionStorage.getItem("theme-plan-seeded")) return;
    sessionStorage.setItem("theme-plan-seeded", "yes");
    localStorage.setItem("goatplan:tutorial:v1", "dismissed");
    localStorage.setItem("goatplan:term:v1", plan.termId);
    localStorage.setItem(`goatplan:plans:v1:plan:${plan.id}`, JSON.stringify({ version: 1, ...plan }));
    localStorage.setItem(`goatplan:draft:v1:${plan.termId}`, JSON.stringify({ version: 1, ...plan, alternatives: {} }));
  }, plan);
  return plan;
}

export async function selectTheme(page: Page, theme: "light" | "dark", width: number) {
  if (width < 768) {
    const menu = page.getByRole("button", { name: "More actions" });
    await expect(menu).toBeVisible();
    await menu.click();
    const control = page.getByRole("switch", { name: "Dark theme" });
    await control.setChecked(theme === "dark");
    await page.keyboard.press("Escape");
  } else {
    const change = page.getByRole("button", { name: `Switch to ${theme} theme` });
    if (await change.isVisible()) await change.click();
  }
  await expect(page.locator("html")).toHaveCSS("color-scheme", theme);
}
