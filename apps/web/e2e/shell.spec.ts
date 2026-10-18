import { expect, test, type Locator } from "@playwright/test";

const screenshotDir = "e2e/screenshots";

// Boxes of the shell regions in the Figma frame "div.app" (1680 × 800), see docs/design/screens/div.app.md.
const figma = {
  sidebar: { x: 14, y: 14, width: 224, height: 772 },
  main: { x: 250, y: 14, width: 1416, height: 772 },
  schedule: { x: 250, y: 156.5, width: 1134, height: 629.5 },
  details: { x: 1396, y: 156.5, width: 270, height: 629.5 },
};

async function expectBox(locator: Locator, expected: (typeof figma)["main"]) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  for (const key of ["x", "y", "width", "height"] as const) {
    expect(Math.abs(box![key] - expected[key]), `${key}: ${box![key]} vs ${expected[key]}`).toBeLessThanOrEqual(1.5);
  }
}

test("shell regions line up with the Figma frame at 1680 × 800", async ({ page }) => {
  await page.setViewportSize({ width: 1680, height: 800 });
  await page.goto("/");
  await expectBox(page.getByRole("complementary", { name: "Term and courses" }), figma.sidebar);
  await expectBox(page.getByRole("main"), figma.main);
  await expectBox(page.getByRole("region", { name: "Weekly schedule" }), figma.schedule);
  await expectBox(page.getByRole("complementary", { name: "Course details" }), figma.details);
  await page.screenshot({ path: `${screenshotDir}/shell-1680.png` });
});

test("shell at 1440 keeps the desktop layout", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const schedule = await page.getByRole("region", { name: "Weekly schedule" }).boundingBox();
  const details = await page.getByRole("complementary", { name: "Course details" }).boundingBox();
  expect(details!.x).toBeGreaterThan(schedule!.x + schedule!.width);
  expect(details!.width).toBe(270);
  await page.screenshot({ path: `${screenshotDir}/shell-1440.png` });
});

test("shell at 1194 (iPad landscape) keeps the panels side by side", async ({ page }) => {
  await page.setViewportSize({ width: 1194, height: 834 });
  await page.goto("/");
  const schedule = await page.getByRole("region", { name: "Weekly schedule" }).boundingBox();
  const details = await page.getByRole("complementary", { name: "Course details" }).boundingBox();
  expect(details!.x).toBeGreaterThan(schedule!.x + schedule!.width);
});

test("short screens keep a usable calendar and scroll the page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 520 });
  await page.goto("/");
  const schedule = await page.getByRole("region", { name: "Weekly schedule" }).boundingBox();
  expect(schedule!.height).toBeGreaterThan(500);
  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(scrollHeight).toBe(720);
});

test("shell at 834 stacks the details under the calendar", async ({ page }) => {
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.goto("/");
  const schedule = await page.getByRole("region", { name: "Weekly schedule" }).boundingBox();
  const details = await page.getByRole("complementary", { name: "Course details" }).boundingBox();
  expect(details!.y).toBeGreaterThan(schedule!.y + schedule!.height);
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(834);
  await page.screenshot({ path: `${screenshotDir}/shell-834.png`, fullPage: true });
});

test("the planner downloads its term file once, for both the page and the engine", async ({ page }) => {
  const requested: string[] = [];
  page.on("request", (request) => requested.push(new URL(request.url()).pathname));

  await page.goto("/");
  const status = page.locator("[data-planner-term-status]");
  await expect(status).toHaveAttribute("data-planner-term-status", "ready", { timeout: 30_000 });
  // Give a late download from the worker time to show up.
  await page.waitForTimeout(500);

  const termId = await status.getAttribute("data-planner-term");
  expect(termId).toMatch(/^\d{4}-[A-Z]$/);
  expect(requested.filter((path) => path === `/data/${termId}.json`)).toHaveLength(1);
  expect(requested.filter((path) => path === "/data/index.json")).toHaveLength(1);
  expect(requested.filter((path) => path === "/engine/goatplan.wasm")).toHaveLength(1);
});

test("/plans has the Sections to register page", async ({ page }) => {
  await page.goto("/plans");
  await expect(page.getByRole("heading", { level: 1, name: "Sections to register" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Term and courses" })).toBeVisible();
});

test("dev pages return 404 in production", async ({ request }) => {
  expect((await request.get("/dev/ui")).status()).toBe(404);
  expect((await request.get("/dev/engine")).status()).toBe(404);
});

test("the first Tab reaches the skip link, which moves focus to the main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});
