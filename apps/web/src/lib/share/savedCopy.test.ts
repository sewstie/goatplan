import { expect, it } from "vitest";
import { createPlansSource, readPlans } from "@/lib/plans";
import { MemoryPlanStorage } from "@/lib/plans/testing";
import { termFile } from "@/lib/store/testing/fixtures";
import { buildSharedPlan } from "./buildSharedPlan";
import { savedCopy } from "./savedCopy";
import { plan } from "./testing";

const details = { id: "copy-1", savedAt: new Date("2026-10-31T12:00:00Z") };
const term = { ...termFile(plan.termId), term: { ...termFile(plan.termId).term, name: "C Term" } };
const view = buildSharedPlan(plan, term).view;

it("names the copy after its term and gives it its own id and date", () => {
  expect(savedCopy(view, [], details)).toEqual({ ...view, id: "copy-1", name: "C Term · Shared copy", savedAt: "2026-10-31T12:00:00.000Z" });
});

it("doesn't share any data with the plan it was copied from", () => {
  const copy = savedCopy(view, [], details)!;
  expect(copy.schedule).not.toBe(view.schedule);
  expect(copy.preferences).not.toBe(view.preferences);
});

it("picks the next free name in the term, ignoring other terms", () => {
  const taken = (name: string, termId = plan.termId) => ({ name, termId });
  expect(savedCopy(view, [taken("c term · shared copy"), taken("C Term · Shared copy 2")], details)?.name).toBe("C Term · Shared copy 3");
  expect(savedCopy(view, [taken("C Term · Shared copy", "2027-D")], details)?.name).toBe("C Term · Shared copy");
});

it("keeps a copy readable when every chosen section of a course was removed", () => {
  const changed = buildSharedPlan({ ...plan, chosen: { ...plan.chosen, "AE 2410": ["AE 2410-C99"] } }, term).view;
  const copy = savedCopy(changed, [], details)!;
  expect(copy.courses).toEqual(plan.courses);
  expect(copy.schedule.map((course) => course.code)).toEqual(["AE 2320"]);
  const storage = new MemoryPlanStorage();
  expect(createPlansSource(() => storage).save(copy)).toBe(true);
  expect(readPlans(storage)).toEqual([copy]);
});

it("has nothing to save when no chosen section is left", () => {
  const empty = buildSharedPlan({ ...plan, courses: ["CS 2022"], chosen: { "CS 2022": ["CS 2022-CL02"] }, locks: {}, professorByCourse: {} }, term).view;
  expect(savedCopy(empty, [], details)).toBeNull();
});
