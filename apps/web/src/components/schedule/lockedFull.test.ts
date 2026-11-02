import { describe, expect, it } from "vitest";
import type { SectionStatus } from "@/lib/data/types";
import { termFile } from "@/lib/store/testing/fixtures";
import type { PlannerState } from "@/lib/store";
import { selectLockedFull } from "./lockedFull";

const term = termFile("2027-C");
const course = term.courses.find((item) => item.code === "AE 2320")!;
const lab = course.sections.find((section) => section.id === "AE 2320-CX01")!;
const withLab = (status: SectionStatus) => ({ ...term, courses: term.courses.map((item) => (item === course ? { ...item, sections: item.sections.map((section) => (section === lab ? { ...section, status } : section)) } : item)) });

const state = (changes: Partial<PlannerState> = {}) => ({
  term: withLab("closed"),
  seatsUpdatedAt: "2099-01-01T00:00:00Z",
  locks: { "AE 2320": ["AE 2320-CX01"] },
  courses: ["AE 2320"],
  preferences: { startsAfter: 0, blocked: [], onlyOpen: true },
  response: { ok: true, total: 0 },
  solveStatus: "done",
  drawing: false,
  savedPlanId: null,
  ...changes,
}) as Parameters<typeof selectLockedFull>[0];

describe("selectLockedFull", () => {
  it("finds a locked section that filled up when nothing fits", () => {
    expect(selectLockedFull(state())?.section.id).toBe("AE 2320-CX01");
  });

  it("leaves a section already full in the term file to the usual diagnosis", () => {
    expect(selectLockedFull(state({ seatsUpdatedAt: term.generatedAt }))).toBeNull();
  });

  it("stays out of the way while schedules still fit", () => {
    expect(selectLockedFull(state({ response: { ok: true, total: 2 } as PlannerState["response"] }))).toBeNull();
  });

  it("doesn't blame the lock when full sections are allowed", () => {
    expect(selectLockedFull(state({ preferences: { startsAfter: 0, blocked: [], onlyOpen: false } }))).toBeNull();
  });

  it("doesn't blame a locked section that's still open", () => {
    expect(selectLockedFull(state({ term: withLab("open") }))).toBeNull();
  });

  it("leaves the grid up while drawing", () => {
    expect(selectLockedFull(state({ drawing: true }))).toBeNull();
  });
});
