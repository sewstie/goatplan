import { expect, test } from "./fixtures/test";
import { fixtureHistory, openAllSections, openDegree } from "./fixtures/degree";

test.beforeEach(async ({ page }) => {
  await openDegree(page, fixtureHistory("degree-history-mid.json"));
});

test("the progress counts sit side by side without overlapping", async ({ page }) => {
  const boxes = await page.getByRole("button", { name: /Show only these lines on the sheet/ }).evaluateAll((items) => items.map((item) => item.getBoundingClientRect().toJSON() as DOMRect));
  expect(boxes).toHaveLength(4);
  for (const [index, box] of boxes.entries()) {
    expect(box.right).toBeLessThanOrEqual(375);
    if (index > 0) expect(box.left).toBeGreaterThanOrEqual(boxes[index - 1].right);
  }
});

test("project lines show their whole hint", async ({ page }) => {
  await openAllSections(page);
  const hints = page.getByRole("region", { name: "Your sheet" }).getByText("Tick when done", { exact: true }).filter({ visible: true });
  expect(await hints.count()).toBeGreaterThan(0);
  for (const cut of await hints.evaluateAll((items) => items.map((item) => item.scrollWidth > item.clientWidth))) expect(cut).toBe(false);
});

test("each plan year stays beside its terms while they scroll", async ({ page }) => {
  await page.getByRole("button", { name: "Plan ahead" }).click();
  const heading = page.getByRole("heading", { name: "Year 1" });
  const firstTerm = page.getByText("A 2026", { exact: true });
  const before = (await heading.boundingBox())!;
  expect(before.x + before.width).toBeLessThanOrEqual((await firstTerm.boundingBox())!.x);
  await page.getByRole("group", { name: "Four-year plan terms" }).evaluate((item) => item.scrollTo({ left: 300 }));
  expect((await heading.boundingBox())!.x).toBeCloseTo(before.x, 0);
});

test("the course map details sit above the map and show everything", async ({ page }) => {
  await page.getByRole("button", { name: "Course map" }).click();
  const details = page.getByRole("complementary", { name: "Selected course" });
  await page.getByRole("button", { name: /CS 3013/ }).filter({ visible: true }).first().click();
  expect(await details.evaluate((item) => getComputedStyle(item).position)).toBe("static");
  const box = (await details.boundingBox())!;
  const leadsTo = (await details.getByRole("region", { name: "What it leads to" }).boundingBox())!;
  expect(leadsTo.x + leadsTo.width).toBeLessThanOrEqual(box.x + box.width);
  expect(await details.evaluate((item) => item.scrollHeight <= item.clientHeight)).toBe(true);
});

test("the top bar holds the Planner and My degree links, with no bar at the bottom", async ({ page }) => {
  const main = page.getByRole("navigation", { name: "Main" });
  expect((await main.boundingBox())!.y).toBeLessThan(60);
  await expect(main.getByRole("link", { name: "My degree" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator("[data-phone-tabs]")).toHaveCount(0);
});

test("a panel fills the screen under the top bar", async ({ page }) => {
  await page.getByRole("button", { name: "Course history", exact: true }).click();
  const box = (await page.getByRole("region", { name: "Course history" }).boundingBox())!;
  const bar = (await page.locator("[data-phone-topbar]").boundingBox())!;
  expect(box.x).toBe(0);
  expect(box.width).toBe(375);
  expect(box.y).toBeCloseTo(bar.y + bar.height, 0);
});

test("choosing a major opens as a page that fits the screen", async ({ page }) => {
  await page.getByRole("button", { name: "Change major" }).click();
  const dialog = page.getByRole("dialog", { name: "Choose your major" });
  const box = (await dialog.boundingBox())!;
  expect(box.x).toBe(0);
  expect(box.width).toBe(375);
  expect(await dialog.evaluate((item) => item.scrollWidth <= item.clientWidth)).toBe(true);
  await expect(dialog.getByRole("button", { name: "Open my sheet" })).toBeInViewport({ ratio: 1 });
});
