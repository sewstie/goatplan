import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

export const HISTORY_KEY = "goatplan:history:v1";
export const DEGREE_FLAG_KEY = "goatplan:degree:v1";

const fixtures = path.join(__dirname, "../../../../data/fixtures");

export type FixtureCourse = { code: string; credits: number; term?: string; apIb?: boolean };

export const savedCourse = (course: FixtureCourse, inProgress = false) => ({ title: "", apIb: false, source: "found", ...course, inProgress });

export function readFixture(name: string) {
  return JSON.parse(readFileSync(path.join(fixtures, name), "utf8")) as {
    takenCourses: FixtureCourse[];
    plannedCourses: FixtureCourse[];
    confirmedManualItems: string[];
    expectedLines: Record<string, { course?: string | null; state: string }>;
    expectedSections: Record<string, { done: number; planned: number; total: number }>;
  };
}

export function fixtureHistory(name: string) {
  const fixture = readFixture(name);
  return {
    courses: [...fixture.takenCourses.map((course) => savedCourse(course)), ...fixture.plannedCourses.map((course) => savedCourse(course, true))],
    manual: fixture.confirmedManualItems,
  };
}

/** Opens My degree with this history already stored, once per test, so a reload shows what the app saved. */
export async function openDegree(page: Page, history: { courses: object[]; manual?: string[]; pins?: object[] } | string = { courses: [] }) {
  const text = typeof history === "string" ? history : JSON.stringify({ version: 1, manual: [], ...history });
  await page.addInitScript(
    ([key, flagKey, value]) => {
      localStorage.setItem("goatplan:tutorial:v1", "dismissed");
      localStorage.setItem("goatplan:term:v1", "2027-C");
      localStorage.setItem(flagKey, "on");
      if (!sessionStorage.getItem("seeded")) localStorage.setItem(key, value);
      sessionStorage.setItem("seeded", "yes");
    },
    [HISTORY_KEY, DEGREE_FLAG_KEY, text],
  );
  await page.goto("/degree");
  await auditReady(page);
}

export const auditReady = (page: Page) =>
  expect(page.locator("[data-degree-audit-status]")).toHaveAttribute("data-degree-audit-status", "ready", { timeout: 30_000 });

export const stored = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{"courses":[],"manual":[]}'), HISTORY_KEY);

export const storedCodes = async (page: Page) => ((await stored(page)).courses as { code: string }[]).map((course) => course.code);

/** The sheet folds into cards on a phone, so tiles and ticks only show after opening a section. */
export async function openAllSections(page: Page) {
  if ((page.viewportSize()?.width ?? 1440) >= 768) return;
  const closed = page.locator('h3 button[aria-expanded="false"]');
  while ((await closed.count()) > 0) await closed.first().click();
}

export const panel = (page: Page, name: string) => page.getByRole("region", { name, exact: true });

export async function openHistory(page: Page) {
  await page.getByRole("button", { name: "Sheet options" }).click();
  await page.getByRole("button", { name: "Course history" }).click();
  return panel(page, "Course history");
}
