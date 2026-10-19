import { describe, expect, it } from "vitest";
import { term } from "@/components/schedule/testing/plannerFixtures";
import { diagnosticPreview } from "./diagnosticPreview";
import { diagnosisText } from "./diagnosisText";

const context = { preferences: { startsAfter: 0, blocked: [], onlyOpen: true }, locks: {} };
const issues = diagnosisText({ unsure: false, emptyCourses: [], clashingPairs: [["AE 2320", "AE 2410"]], minimalClash: [], fixes: [] }, { ...context, term }).issues;

describe("diagnosticPreview", () => {
  it("does not retain a preview taught by the previous professor", () => {
    const data = structuredClone(term);
    const course = data.courses[1];
    const original = course.sections[0];
    original.instructors = ["Previous Professor"];
    const next = { ...original, id: "AE 2410-C02", code: "C02", instructors: ["Next Professor"] };
    course.sections.push(next);
    course.options.push([next.id]);
    const result = diagnosticPreview(data, [course.code], {
      ...context, professorByCourse: { [course.code]: "Next Professor" },
    }, { [course.code]: [original.id] }, issues);
    expect(result[course.code]).toEqual([next.id]);
  });
  it("shows only known mandatory sections on a fresh no-fit answer", () => {
    expect(diagnosticPreview(term, ["AE 2320", "AE 2410"], context, {}, issues)).toEqual({ "AE 2320": ["AE 2320-CL01"], "AE 2410": ["AE 2410-C01"] });
  });
  it("retains the last shown lab, leaves out removed courses, and respects new locks", () => {
    const last = { "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"], "AE 2410": ["AE 2410-C01"] };
    expect(diagnosticPreview(term, ["AE 2320"], context, last, issues)["AE 2320"]).toEqual(last["AE 2320"]);
    expect(diagnosticPreview(term, ["AE 2320"], { ...context, locks: { "AE 2320": ["AE 2320-CX03"] } }, last, issues)["AE 2320"])
      .toEqual(["AE 2320-CL01", "AE 2320-CX03"]);
  });
  it("hides excluded early meetings, and makes no preview without a proven diagnosis", () => {
    const last = { "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"] };
    expect(diagnosticPreview(term, ["AE 2320"], { ...context, preferences: { ...context.preferences, startsAfter: 600 } }, last, issues)["AE 2320"])
      .toEqual(["AE 2320-CX02"]);
    expect(diagnosticPreview(term, ["AE 2320"], context, last, [])).toEqual({});
  });
});
