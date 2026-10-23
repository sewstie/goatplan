import { expect, it } from "vitest";
import { emptyDraft } from "./draft";
import { termFile } from "./testing/fixtures";
import { restoredPlanSummary } from "./restoredPlanSummary";

it("lists the start, named blocks, lecture professor and locked section kept by a restored plan", () => {
  const draft = {
    ...emptyDraft(), courses: ["AE 2320"],
    preferences: { startsAfter: 540, onlyOpen: true, blocked: [
      { day: "Tue" as const, start: 840, end: 960, label: "Work" },
      { day: "Fri" as const, start: 840, end: 960, label: "Work" },
    ] },
    professorByCourse: { "AE 2320": "Ye Lu" }, locks: { "AE 2320": ["AE 2320-CX02"] },
  };
  expect(restoredPlanSummary(draft, termFile("2027-C"))).toBe("Plan restored · 9 AM start, Work, Ye Lu and lab CX02 are kept.");
});

it.each([
  [0, [], "Plan restored."],
  [555, [], "Plan restored · 9:15 AM start is kept."],
  [0, [{ day: "Mon" as const, start: 720, end: 780, label: "Lunch" }], "Plan restored · Lunch is kept."],
  [600, [{ day: "Mon" as const, start: 720, end: 780 }], "Plan restored · 10 AM start is kept."],
])("summarizes only the choices present (%s, %j)", (startsAfter, blocked, expected) => {
  expect(restoredPlanSummary({ ...emptyDraft(), courses: ["AE 2320"], preferences: { startsAfter, blocked, onlyOpen: true } }, termFile("2027-C"))).toBe(expected);
});

it("includes a retained unavailable professor and does not claim missing sections were kept", () => {
  expect(restoredPlanSummary({ ...emptyDraft(), courses: ["AE 2320"], professorByCourse: { "AE 2320": "Ada Morgan" }, locks: { "AE 2320": ["missing"] } }, termFile("2027-C"))).toBe("Plan restored · Ada Morgan is kept.");
  expect(restoredPlanSummary(emptyDraft(), termFile("2027-C"))).toBeNull();
});
