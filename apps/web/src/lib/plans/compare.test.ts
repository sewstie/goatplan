import { describe, expect, it } from "vitest";
import { hasUnsavedChanges, wouldDiscardWork, type WorkingPlan } from "./compare";
import { getSaveState } from "./saveState";
import { designPlan } from "./testing";

function workingFrom(plan = designPlan()): WorkingPlan {
  return {
    courses: [...plan.courses],
    locks: structuredClone(plan.locks),
    preferences: structuredClone(plan.preferences),
    chosen: Object.fromEntries(plan.schedule.map((course) => [course.code, course.sections.map((item) => item.id)])),
  };
}

describe("hasUnsavedChanges", () => {
  it("is false for the plan as saved, whatever the order", () => {
    const working = workingFrom();
    working.courses.reverse();
    working.chosen!["AE 2320"].reverse();
    expect(hasUnsavedChanges(designPlan(), working)).toBe(false);
  });

  it("notices an added or removed course", () => {
    expect(hasUnsavedChanges(designPlan(), { ...workingFrom(), courses: ["AE 2320", "AE 2410"] })).toBe(true);
    expect(hasUnsavedChanges(designPlan(), { ...workingFrom(), courses: [...designPlan().courses, "CS 2102"] })).toBe(true);
  });

  it("notices a lock or an unlock, but not an empty lock list", () => {
    expect(hasUnsavedChanges(designPlan(), { ...workingFrom(), locks: {} })).toBe(true);
    expect(hasUnsavedChanges(designPlan(), { ...workingFrom(), locks: { ...designPlan().locks, "AE 2410": ["AE 2410-C01"] } })).toBe(true);
    expect(hasUnsavedChanges(designPlan(), { ...workingFrom(), locks: { ...designPlan().locks, "AE 2410": [] } })).toBe(false);
  });

  it("notices changed preferences, with blocked times in any order", () => {
    const plan = designPlan({
      preferences: {
        startsAfter: 540,
        onlyOpen: true,
        blocked: [
          { day: "Tue", start: 840, end: 960 },
          { day: "Fri", start: 840, end: 960 },
        ],
      },
    });
    const working = workingFrom(plan);
    working.preferences.blocked.reverse();
    expect(hasUnsavedChanges(plan, working)).toBe(false);
    expect(hasUnsavedChanges(plan, { ...working, preferences: { ...working.preferences, startsAfter: 600 } })).toBe(true);
    expect(hasUnsavedChanges(plan, { ...working, preferences: { ...working.preferences, onlyOpen: false } })).toBe(true);
    expect(hasUnsavedChanges(plan, { ...working, preferences: { ...working.preferences, blocked: [] } })).toBe(true);
  });

  it("notices a different section, and skips sections while no schedule is shown", () => {
    const working = workingFrom();
    working.chosen!["AE 2320"] = ["AE 2320-CL01", "AE 2320-CX03"];
    expect(hasUnsavedChanges(designPlan(), working)).toBe(true);
    expect(hasUnsavedChanges(designPlan(), { ...working, chosen: null })).toBe(false);
  });
});

describe("wouldDiscardWork", () => {
  it("asks before replacing courses that were never saved or changed since", () => {
    expect(wouldDiscardWork(null, workingFrom())).toBe(true);
    expect(wouldDiscardWork(designPlan(), { ...workingFrom(), locks: {} })).toBe(true);
  });

  it("doesn't ask for an empty draft or one that is saved as it is", () => {
    expect(wouldDiscardWork(null, null)).toBe(false);
    expect(wouldDiscardWork(null, { ...workingFrom(), courses: [] })).toBe(false);
    expect(wouldDiscardWork(designPlan(), workingFrom())).toBe(false);
  });
});

describe("getSaveState", () => {
  const ready = { termStatus: "ready" as const, hasSchedule: true, working: workingFrom() };

  it("offers Save schedule without a status for a plan that was never saved", () => {
    expect(getSaveState({ ...ready, currentPlan: null })).toMatchObject({ status: "none", canSave: true, busy: false });
  });

  it("says Schedule saved when nothing changed since the save", () => {
    expect(getSaveState({ ...ready, currentPlan: designPlan() })).toMatchObject({ status: "saved", canSave: false });
  });

  it("says Unsaved changes once the plan differs", () => {
    const working = { ...workingFrom(), locks: {} };
    expect(getSaveState({ ...ready, working, currentPlan: designPlan() })).toMatchObject({ status: "unsaved", canSave: true });
  });

  it("can't save without a schedule, and is busy while the term loads", () => {
    expect(getSaveState({ ...ready, hasSchedule: false, currentPlan: designPlan() })).toMatchObject({
      status: "none",
      canSave: false,
      busy: false,
    });
    expect(getSaveState({ ...ready, termStatus: "loading", currentPlan: null })).toMatchObject({ canSave: false, busy: true });
    expect(getSaveState({ ...ready, termStatus: "idle", currentPlan: null })).toMatchObject({ busy: true });
    expect(getSaveState({ ...ready, termStatus: "error", currentPlan: null })).toMatchObject({ canSave: false, busy: false });
  });
});
