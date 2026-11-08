import { expect, test, openMoreActions } from "./fixtures/test";
import { encodePlan } from "../src/lib/share/codec";
import { plan } from "../src/lib/share/testing";
import { designPlan, termWith } from "../src/lib/plans/testing";

test("the phone menu offers a keyboard-operated Dark theme switch", async ({ page }) => {
  const draft = designPlan();
  await page.route("**/data/2027-C.json", (route) => route.fulfill({ json: termWith(draft) }));
  await page.addInitScript((draft) => {
    localStorage.setItem("goatplan:tutorial:v1", "dismissed");
    localStorage.setItem("goatplan:term:v1", draft.termId);
    localStorage.setItem(`goatplan:draft:v1:${draft.termId}`, JSON.stringify({ version: 1, ...draft, alternatives: {} }));
  }, draft);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "More actions" })).toBeVisible();
  await openMoreActions(page);
  const theme = page.getByRole("switch", { name: "Dark theme" });
  await expect(theme).toBeVisible();
  await expect(theme).not.toBeChecked();
  await theme.focus();
  await page.keyboard.press("Space");
  await expect(theme).toBeChecked();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "More actions" })).toBeFocused();
  await page.reload();
  await expect(page.getByRole("button", { name: "More actions" })).toBeVisible();
  await openMoreActions(page);
  await expect(theme).toBeChecked();
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");
  await page.screenshot({ path: "e2e/screenshots/theme-planner-dark-375.png", fullPage: true, animations: "disabled" });
});

test("shared schedules retain the viewer's theme and phone switch", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("goatplan:tutorial:v1", "dismissed");
    localStorage.setItem("goatplan:theme:v1", "dark");
  });
  await page.goto(`/#p=${encodePlan(plan)}`);
  await expect(page.getByRole("heading", { name: "Shared schedule" })).toBeVisible();
  await expect(page.getByRole("button", { name: "More actions" })).toBeVisible();
  await openMoreActions(page);
  const theme = page.getByRole("switch", { name: "Dark theme" });
  await expect(theme).toBeChecked();
  await theme.click();
  await expect(theme).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Share", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Export", exact: true })).toHaveCount(0);
  await theme.click();
  await page.keyboard.press("Escape");
  await page.screenshot({ path: "e2e/screenshots/theme-shared-dark-375.png", fullPage: true, animations: "disabled" });
});
