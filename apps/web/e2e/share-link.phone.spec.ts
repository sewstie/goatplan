import { expect, test, openMoreActions } from "./fixtures/test";
import type { Page } from "@playwright/test";
import { designPlan } from "../src/lib/plans/testing";

const plan = designPlan();

declare global {
  interface Window {
    sharedWith?: ShareData[];
  }
}

async function seedDraft(page: Page) {
  await page.addInitScript((plan) => {
    localStorage.setItem("goatplan:tutorial:v1", "completed");
    localStorage.setItem("goatplan:term:v1", plan.termId);
    localStorage.setItem(`goatplan:draft:v1:${plan.termId}`, JSON.stringify({ version: 1, courses: plan.courses, locks: plan.locks, professorByCourse: plan.professorByCourse, preferences: plan.preferences, sortPreset: plan.sortPreset, alternatives: {} }));
  }, plan);
}

async function pressShare(page: Page) {
  await expect(page.locator("[data-planner-solve-status]")).toHaveAttribute("data-planner-solve-status", "done");
  await openMoreActions(page);
  await page.getByRole("button", { name: "Share", exact: true }).click();
}

async function copied(page: Page) {
  return page.evaluate(() => navigator.clipboard.readText());
}

test("Share opens the phone's share sheet with the plan link", async ({ page }) => {
  await seedDraft(page);
  await page.addInitScript(() => {
    window.sharedWith = [];
    Object.defineProperty(navigator, "share", { configurable: true, value: async (data: ShareData) => { window.sharedWith?.push(data); } });
  });
  await page.goto("/");
  await pressShare(page);
  await page.getByRole("button", { name: "Share…" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Link shared." })).toBeVisible();
  const shared = await page.evaluate(() => window.sharedWith);
  expect(shared).toHaveLength(1);
  expect(shared?.[0].url).toContain("#p=");
});

test("Share copies the link on a phone with no share sheet", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await seedDraft(page);
  await page.addInitScript(() => Object.defineProperty(navigator, "share", { configurable: true, value: undefined }));
  await page.goto("/");
  await pressShare(page);
  await expect(page.getByRole("button", { name: "Share…" })).toHaveCount(0);
  await page.getByRole("button", { name: "Copy link" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Link copied." })).toBeVisible();
  expect(await copied(page)).toContain("#p=");
});

test("Share copies the link when the share sheet can't open", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await seedDraft(page);
  await page.addInitScript(() => Object.defineProperty(navigator, "share", { configurable: true, value: async () => { throw new DOMException("blocked", "NotAllowedError"); } }));
  await page.goto("/");
  await pressShare(page);
  await page.getByRole("button", { name: "Share…" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Link copied." })).toBeVisible();
  expect(await copied(page)).toContain("#p=");
});

test("closing the share sheet doesn't copy anything", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await seedDraft(page);
  await page.addInitScript(() => Object.defineProperty(navigator, "share", { configurable: true, value: async () => { throw new DOMException("closed", "AbortError"); } }));
  await page.goto("/");
  await page.evaluate(() => navigator.clipboard.writeText("before"));
  await pressShare(page);
  await expect(page.getByRole("button", { name: "Share", exact: true })).toBeEnabled();
  await expect(page.getByRole("status").filter({ hasText: "Link copied." })).toHaveCount(0);
  expect(await copied(page)).toBe("before");
});

test("the share sheet closes with a tap on the backdrop or a swipe down", async ({ page }) => {
  await seedDraft(page);
  await page.goto("/");
  await pressShare(page);
  const sheet = page.getByRole("dialog", { name: "Share this schedule" });
  await expect(sheet).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/share-sheet-375.png" });
  await page.mouse.click(180, 40);
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("button", { name: "More actions" })).toHaveAttribute("aria-expanded", "false");

  await pressShare(page);
  await expect(sheet).toBeVisible();
  const top = sheet.getByRole("heading", { name: "Share this schedule" });
  await expect(top).toBeFocused();
  const box = (await top.boundingBox())!;
  const at = (y: number) => ({ pointerId: 7, pointerType: "touch", isPrimary: true, clientX: box.x + 20, clientY: y, bubbles: true });
  await top.dispatchEvent("pointerdown", at(box.y));
  await top.dispatchEvent("pointermove", at(box.y + 60));
  await top.dispatchEvent("pointermove", at(box.y + 120));
  await top.dispatchEvent("pointerup", at(box.y + 120));
  await expect(sheet).toBeHidden();
});

