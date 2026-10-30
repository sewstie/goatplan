import { expect, test } from "./fixtures/test";
import type { Page } from "@playwright/test";
import type { Day, TermFile } from "../src/lib/data/types";

const screenshotDir = "e2e/screenshots";

function parseMs(text: string): number {
  const value = Number.parseFloat(text);
  return text.trim().endsWith(" s") ? value * 1000 : value;
}

async function valueOf(page: Page, label: string): Promise<string> {
  const term = page.getByRole("region", { name: "Response" }).getByText(label, { exact: true });
  return (await term.locator("xpath=following-sibling::dd[1]").textContent()) ?? "";
}

function stressTerm(term: TermFile): TermFile {
  const days: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const template = term.courses[0];
  const courses = days.map((day, index) => {
    const code = `TEST ${index + 1}`;
    const sections = Array.from({ length: 10 }, (_, option) => ({
      ...template.sections[0],
      id: `${code}-C${option + 1}`,
      code: `C${option + 1}`,
      meetings: [{ days: [day], start: 480 + option * 60, end: 530 + option * 60, location: "Test room" }],
    }));
    return { ...template, code, sections, options: sections.map((section) => [section.id]) };
  });
  return { ...term, courses };
}

let requested: string[] = [];

test.beforeEach(async ({ page }) => {
  requested = [];
  page.on("request", (request) => requested.push(new URL(request.url()).pathname));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/dev/engine");
  await expect(page.getByText(/^Loaded \d{4}-[A-Z] · \d+ courses/)).toBeVisible({ timeout: 60_000 });
});

test("loads a term with a single download", async ({ page }) => {
  const termId = (await page.getByText(/^Loaded \d{4}-[A-Z]/).textContent())!.match(/\d{4}-[A-Z]/)![0];
  await page.waitForTimeout(500);
  expect(requested.filter((path) => path === `/data/${termId}.json`)).toHaveLength(1);
});

test("sends a request and shows the response and the time it took", async ({ page }) => {
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("region", { name: "Response" }).getByText("Round trip")).toBeVisible();
  expect(parseMs(await valueOf(page, "Round trip"))).toBeGreaterThan(0);
  expect(parseMs(await valueOf(page, "Engine time"))).toBeGreaterThan(0);
  expect(Number(await valueOf(page, "Schedules sent back"))).toBeGreaterThan(0);
  await page.screenshot({ path: `${screenshotDir}/dev-engine-1440.png`, fullPage: true });
});

test("latest wins: of five requests sent at once, only the last is answered", async ({ page }) => {
  await page.getByRole("button", { name: "Send 5 at once" }).click();
  await expect(page.getByText("5 sent · 4 superseded · 1 answered")).toBeVisible();
});

test("ten large requests don't freeze the page", async ({ page }) => {
  test.setTimeout(120_000);
  await page.route(/\/data\/\d{4}-[A-Z]\.json$/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({ json: stressTerm(await response.json() as TermFile) });
  });
  await page.reload();
  await expect(page.getByText(/^Loaded \d{4}-[A-Z] · 7 courses/)).toBeVisible();
  const runButton = page.getByRole("button", { name: "Run 10 large requests" });
  const counter = page.getByRole("button", { name: /^Clicks: \d+$/ });

  await runButton.click();
  await expect(runButton).toBeDisabled();

  for (let clicks = 1; clicks <= 5; clicks += 1) {
    const started = Date.now();
    await counter.click();
    await expect(counter).toHaveText(`Clicks: ${clicks}`, { timeout: 1000 });
    expect(Date.now() - started, "a click while the engine works").toBeLessThan(250);
    await page.waitForTimeout(100);
  }
  // Every click above landed while the requests were still running.
  await expect(runButton).toBeDisabled();

  await expect(runButton).toBeEnabled({ timeout: 120_000 });
  const engineMs = parseMs(await valueOf(page, "Engine time, all requests"));
  const longestFrame = parseMs((await page.getByRole("status", { name: "Longest frame" }).textContent()) ?? "");
  test.info().annotations.push({ type: "timing", description: `engine ${engineMs} ms, longest frame ${longestFrame} ms` });

  expect(engineMs, "the engine really worked for a while").toBeGreaterThan(1000);
  expect(longestFrame, "the page kept drawing frames").toBeLessThan(100);
  await page.screenshot({ path: `${screenshotDir}/dev-engine-stress.png`, fullPage: true });
});
