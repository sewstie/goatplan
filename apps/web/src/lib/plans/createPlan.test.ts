import { describe, expect, it } from "vitest";
import { buildRequest, type PlannerState } from "@/lib/store";
import { solved, termFile } from "@/lib/store/testing/fixtures";
import { cleanPlanName, createPlan, defaultPlanName, updatePlan, type PlanSource } from "./createPlan";
import { designPlan } from "./testing";

const SAVED_AT = new Date("2026-10-17T12:00:00Z");

function plannerState(changes: Partial<PlannerState> = {}): PlanSource {
  const base: PlanSource = {
    termId: "2027-C",
    term: termFile("2027-C"),
    courses: ["AE 2320", "AE 2410"],
    locks: { "AE 2320": ["AE 2320-CX02"] },
    preferences: { startsAfter: 540, blocked: [], onlyOpen: true },
    sortPreset: "fewestEarly",
    response: null,
    scheduleIndex: 0,
    alternatives: {},
  };
  const state = { ...base, ...changes };
  return { ...state, response: changes.response ?? solved(buildRequest(state)!) };
}

describe("createPlan", () => {
  it("copies the shown schedule's sections, the courses, locks and preferences", () => {
    const plan = createPlan(plannerState({ scheduleIndex: 1 }), { id: "p1", name: "Plan 1", savedAt: SAVED_AT })!;
    expect(plan).toMatchObject({
      id: "p1",
      name: "Plan 1",
      termId: "2027-C",
      term: { name: "2027-C", season: "Spring", year: 2027 },
      savedAt: "2026-10-17T12:00:00.000Z",
      courses: ["AE 2320", "AE 2410"],
      locks: { "AE 2320": ["AE 2320-CX02"] },
      preferences: { startsAfter: 540, blocked: [], onlyOpen: true },
      sortPreset: "fewestEarly",
    });
    expect(plan.schedule.map((course) => [course.code, course.sections.map((item) => item.id)])).toEqual([
      ["AE 2320", ["AE 2320-CL01", "AE 2320-CX02"]],
      ["AE 2410", ["AE 2410-C01"]],
    ]);
  });

  it("keeps its own copy, so later changes to the term data don't touch it", () => {
    const state = plannerState();
    const plan = createPlan(state, { id: "p1", name: "Plan 1", savedAt: SAVED_AT })!;
    state.term!.courses[0].sections[0].enrolled = 999;
    state.preferences.blocked.push({ day: "Mon", start: 600, end: 660 });
    expect(plan.schedule[0].sections[0].enrolled).toBe(10);
    expect(plan.preferences.blocked).toEqual([]);
  });

  it("saves the same-time alternative the student picked", () => {
    const state = plannerState();
    const key = "AE 2320-CL01+AE 2320-CX01|AE 2410-C01";
    const plan = createPlan(
      { ...state, alternatives: { [key]: { "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"] } } },
      { id: "p1", name: "Plan 1", savedAt: SAVED_AT },
    )!;
    expect(plan.schedule[0].sections.map((item) => item.code)).toEqual(["CL01", "CX02"]);
  });

  it("returns null when there's no schedule or no loaded term", () => {
    const details = { id: "p1", name: "Plan 1", savedAt: SAVED_AT };
    expect(createPlan({ ...plannerState(), response: null }, details)).toBeNull();
    expect(createPlan({ ...plannerState(), term: null }, details)).toBeNull();
    expect(createPlan({ ...plannerState(), termId: "2027-D" }, details)).toBeNull();
  });

  it("updates a plan in place, keeping its id and name", () => {
    const plan = designPlan({ termId: "2027-C" });
    const updated = updatePlan(plan, plannerState(), SAVED_AT)!;
    expect(updated).toMatchObject({ id: plan.id, name: plan.name, courses: ["AE 2320", "AE 2410"] });
    expect(updatePlan(designPlan({ termId: "2027-D" }), plannerState(), SAVED_AT)).toBeNull();
  });
});

describe("plan names", () => {
  it("suggests the first free Plan number in the term", () => {
    expect(defaultPlanName([], "2027-C")).toBe("Plan 1");
    const plans = [
      { name: "Plan 1", termId: "2027-C" },
      { name: "plan 2", termId: "2027-C" },
      { name: "Plan 3", termId: "2027-D" },
    ];
    expect(defaultPlanName(plans, "2027-C")).toBe("Plan 3");
    expect(defaultPlanName(plans, "2027-D")).toBe("Plan 1");
  });

  it("trims names, folds spaces, and refuses empty ones", () => {
    expect(cleanPlanName("  Mornings   free ")).toBe("Mornings free");
    expect(cleanPlanName("   ")).toBeNull();
    expect(cleanPlanName("x".repeat(80))).toHaveLength(60);
  });
});
