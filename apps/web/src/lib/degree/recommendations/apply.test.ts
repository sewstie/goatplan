import { beforeEach, expect, it, vi } from "vitest";
import { createDegreeSource, type AuditEngine } from "../degreeSource";
import { typedCourse, writeHistory, type DegreeHistory, type HistoryStorage } from "../history";
import { MemoryPlanStorage } from "@/lib/plans/testing";
import { loadSheet } from "../sheets";
import { applyRecommendation } from "./apply";

const engine = { audit: vi.fn() } as unknown as AuditEngine;
const addition = (code: string) => ({ ...typedCourse(code), status: "planned" as const, term: "A Term 2027" });
let history: DegreeHistory;
beforeEach(() => { history = { sheetId: "cs-2030", courses: [], manual: ["iqp-1"], pins: [], huaPath: "depth-breadth" }; });
async function setup(storage: HistoryStorage = new MemoryPlanStorage()) {
  writeHistory(storage, history);
  const source = createDegreeSource({ getStorage: () => storage, engine });
  const sheet = await loadSheet("cs-2030");
  const originalGet = source.getSnapshot;
  source.getSnapshot = () => ({ ...originalGet(), sheet });
  return source;
}
it("adds selected records as planned without altering confirmations or pins", async () => {
  const source = await setup();
  const expected = source.getSnapshot().history;
  expect(applyRecommendation(source, expected, [addition("CS 1101")])).toBe("1 course added to your plan.");
  expect(source.getSnapshot().history).toMatchObject({ courses: [addition("CS 1101")], manual: ["iqp-1"], huaPath: "depth-breadth" });
  expect(applyRecommendation(source, expected, [addition("CS 1101")])).toContain("changed");
  expect(source.getSnapshot().history.courses).toHaveLength(1);
});
it("reports skipped equivalents and only-one conflicts in a partial batch", async () => {
  history.courses = [typedCourse("CS 1102")];
  const source = await setup();
  expect(applyRecommendation(source, source.getSnapshot().history, [addition("CS 1101"), addition("CS 2022"), addition("MA 2201")])).toBe("1 course added to your plan. 2 courses skipped because you already have them.");
  expect(source.getSnapshot().history.courses.map((course) => course.code)).toEqual(["CS 1102", "CS 2022"]);
});
it("rejects a different major without writing", async () => {
  const source = await setup();
  const expected = source.getSnapshot().history;
  source.selectSheet("rbe-2030");
  expect(applyRecommendation(source, expected, [addition("CS 1101")])).toContain("changed");
  expect(source.getSnapshot().history.courses).toHaveLength(0);
});
it("reports session-only additions when storage writes fail", async () => {
  const memory = new MemoryPlanStorage();
  const source = await setup(memory);
  const expected = source.getSnapshot().history;
  memory.setItem = () => { throw new Error("blocked"); };
  expect(applyRecommendation(source, expected, [addition("CS 1101")])).toContain("for this visit only");
  expect(source.getSnapshot().history.courses).toHaveLength(1);
  expect(source.getSnapshot().unsaved).toBe(true);
});
