import { expect, test } from "./fixtures/test";
import type { Page } from "@playwright/test";
import { openDegree, savedCourse } from "./fixtures/degree";

const FILTER = /Only courses that fill something I still need/;

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

const sidebarSearch = (page: Page) => page.getByRole("searchbox", { name: "Search courses" });
const card = (page: Page, code: string) => page.getByRole("region", { name: "Search results" }).getByRole("listitem").filter({ has: page.getByRole("heading", { level: 3, name: code, exact: true }) });
const nav = (page: Page, name: string) => page.getByRole("navigation", { name: "Main" }).getByRole("link", { name });
const ready = (page: Page) => expect(page.locator('[data-planner-term="2027-C"][data-planner-term-status="ready"]')).toBeAttached({ timeout: 30_000 });

test("history, progress and search badges use the same degree audit", async ({ page }) => {
  await openDegree(page, { courses: [savedCourse({ code: "CS 1102", credits: 3 })] });
  await expect(page.getByRole("button", { name: /^CS 1102, line 16, done/ })).toBeVisible();
  await nav(page, "Planner").click();
  await ready(page);

  await sidebarSearch(page).fill("cs 1");
  await expect(card(page, "CS 1101")).toBeVisible();
  await sidebarSearch(page).fill("cs 3013");
  await expect(card(page, "CS 3013")).toContainText("Counts toward: Systems", { timeout: 30_000 });
  await sidebarSearch(page).fill("cs 1");
  await expect(card(page, "CS 1101")).not.toContainText("Counts toward");
  await sidebarSearch(page).fill("cs 3013");
  await card(page, "CS 3013").getByRole("button", { name: "Add CS 3013" }).click();
  await expect(page.getByRole("dialog", { name: "Find a course" })).toHaveCount(0);
  await expect(page.locator('[data-course-row="CS 3013"]')).toBeVisible();
  await expect(page.getByRole("checkbox", { name: FILTER })).toHaveCount(0);
  await nav(page, "My degree").click();
  await expect(page.getByRole("button", { name: /^CS 3013, line \d+, planned/ })).toHaveCount(0);
});

test("without the flag, search stays in the sidebar with no badges or filter", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("goatplan:tutorial:v1", "dismissed");
    localStorage.setItem("goatplan:term:v1", "2027-C");
  });
  await page.goto("/");
  await ready(page);
  await sidebarSearch(page).fill("cs 30");
  await expect(page.getByRole("region", { name: "Search results" }).getByRole("heading", { level: 3, name: "CS 3013", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Find a course" })).toHaveCount(0);
  await expect(page.getByText(/Counts toward/)).toHaveCount(0);
  await expect(page.getByText(FILTER)).toHaveCount(0);
});

test("badges work in the existing phone search", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openDegree(page, { courses: [savedCourse({ code: "CS 1102", credits: 3 })] });
  await nav(page, "Planner").click();
  await ready(page);
  await page.getByRole("button", { name: /Course code or professor/ }).click();
  await sidebarSearch(page).fill("cs 3013");
  await expect(card(page, "CS 3013")).toContainText("Counts toward: Systems", { timeout: 30_000 });
  await expect(page.getByRole("checkbox", { name: FILTER })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
