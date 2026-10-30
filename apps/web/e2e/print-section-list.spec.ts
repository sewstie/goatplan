import { expect, test } from "./fixtures/test";
import { designPlan, termWith } from "../src/lib/plans/testing";

test("state 23 offers Print beside Copy section list and prints the registration list", async ({ page }) => {
  const plan = designPlan({
    preferences: {
      startsAfter: 540,
      blocked: [
        { day: "Tue", start: 840, end: 960, label: "Work" },
        { day: "Fri", start: 840, end: 960, label: "Work" },
      ],
      onlyOpen: true,
    },
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/data/2027-C.json", (route) => route.fulfill({ json: termWith(plan) }));
  await page.addInitScript((plan) => {
    localStorage.setItem("goatplan:term:v1", plan.termId);
    localStorage.setItem(`goatplan:plans:v1:plan:${plan.id}`, JSON.stringify({ version: 1, ...plan }));
    localStorage.setItem(`goatplan:plans:v1:current:${plan.termId}`, plan.id);
    localStorage.setItem(`goatplan:draft:v1:${plan.termId}`, JSON.stringify({
      version: 1,
      courses: plan.courses,
      preferences: plan.preferences,
      locks: plan.locks,
      professorByCourse: plan.professorByCourse,
      sortPreset: plan.sortPreset,
      alternatives: {},
    }));
  }, plan);
  await page.goto(`/plans?plan=${plan.id}`);

  const print = page.getByRole("button", { name: "Print", exact: true });
  const copy = page.getByRole("button", { name: "Copy section list", exact: true });
  await expect(print).toBeVisible();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(5);
  const printBox = (await print.boundingBox())!;
  const copyBox = (await copy.boundingBox())!;
  expect(printBox.width).toBe(70);
  expect(printBox.height).toBe(36);
  expect(printBox.y).toBe(copyBox.y);
  expect(copyBox.x - printBox.x - printBox.width).toBe(7);
  expect(await print.evaluate((button) => getComputedStyle(button).borderColor)).toBe(
    "rgb(225, 229, 237)",
  );
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "e2e/screenshots/print-section-list-state-23-1440.png", animations: "disabled" });

  let printRequests = 0;
  await page.exposeFunction("onPrint", () => { printRequests += 1; });
  await page.evaluate(() => {
    window.print = () => { void (window as unknown as { onPrint: () => Promise<void> }).onPrint(); };
  });
  await print.focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => printRequests).toBe(1);
  await page.keyboard.press("Tab");
  await expect(copy).toBeFocused();

  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("main")).toBeHidden();
  await expect(page.getByRole("complementary", { name: "Term and courses" })).toBeHidden();
  await expect(page.getByRole("heading", { level: 1, name: "Sections to register" })).toBeVisible();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(5);
  await expect(page.getByRole("button")).toHaveCount(0);
  await expect(page.locator("pre:visible")).toHaveText(
    "AE 2320 — CL01 (lecture), CX02 (lab)\nAE 2410 — C01 (lecture)\nAE 2210 — C01 (lecture)",
  );
  await page.screenshot({ path: "e2e/screenshots/print-section-list-print-1440.png", fullPage: true });
});
