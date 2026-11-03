import { expect, it } from "vitest";
import { termFile } from "@/lib/store/testing/fixtures";
import { buildSharedPlan } from "./buildSharedPlan";
import { plan } from "./testing";

it("uses today's sections and reports removed sections while keeping the remaining schedule", () => {
  const term = termFile(plan.termId);
  const result = buildSharedPlan({ ...plan, chosen: { ...plan.chosen, "AE 2320": ["AE 2320-CL01", "AE 2320-REMOVED"] } }, term);
  expect(result.view.schedule[0].sections).toEqual([term.courses[0].sections[0]]);
  expect(result.view.schedule[1].sections).toEqual(term.courses[1].sections);
  expect(result.warnings).toEqual(["AE 2320 REMOVED is no longer offered."]);
  expect(result.view.preferences).toEqual(plan.preferences);
});

it("leaves a removed course out of the shared plan and keeps the courses still offered", () => {
  const term = termFile(plan.termId);
  const shared = { ...plan, courses: ["CS 2022", ...plan.courses], chosen: { ...plan.chosen, "CS 2022": ["CS 2022-CL02"] }, locks: { ...plan.locks, "CS 2022": ["CS 2022-CL02"] }, professorByCourse: { ...plan.professorByCourse, "CS 2022": "Ada Lovelace" } };
  const result = buildSharedPlan(shared, term);
  expect(result.warnings).toEqual(["CS 2022 is no longer offered."]);
  for (const view of [result, result.view]) {
    expect(view.courses).toEqual(plan.courses);
    expect(view.locks).toEqual(plan.locks);
    expect(view.professorByCourse).toEqual(plan.professorByCourse);
  }
  expect(result.view.schedule.map((course) => course.code)).toEqual(plan.courses);
});

it("forgets a lock on a removed section", () => {
  const result = buildSharedPlan({ ...plan, chosen: { ...plan.chosen, "AE 2320": ["AE 2320-CL01", "AE 2320-CL02"] }, locks: { "AE 2320": ["AE 2320-CL02"] } }, termFile(plan.termId));
  expect(result.warnings).toEqual(["AE 2320 CL02 is no longer offered."]);
  expect(result.view.locks).toEqual({});
});
