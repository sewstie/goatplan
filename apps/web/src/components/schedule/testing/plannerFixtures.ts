import type { Section, TermFile } from "@/lib/data/types";
import type { Schedule, SolveResponse } from "@/lib/engine/types";
import { getPlannerStore, type PlannerState } from "@/lib/store";

// Small, hand-made planner states for the schedule components' tests.

function section(id: string, changes: Partial<Section> = {}): Section {
  return {
    id,
    code: id.split("-")[1],
    type: "lecture",
    status: "open",
    enrolled: 10,
    capacity: 40,
    waitlist: { taken: 0, capacity: 0 },
    instructors: ["Ye Lu"],
    delivery: "in-person",
    meetings: [{ days: ["Mon", "Tue", "Wed", "Thu", "Fri"], start: 540, end: 590, location: "Unity Hall 400" }],
    ...changes,
  };
}

const lab = (code: string, start: number): Section =>
  section(`AE 2320-${code}`, {
    type: "lab",
    meetings: [{ days: ["Thu"], start, end: start + 50, location: "Higgins Labs 230 Geom Modeling Computer Lab" }],
  });

export const term: TermFile = {
  term: { id: "2027-C", name: "C Term", season: "Spring", year: 2027, start: "2027-01-13", end: "2027-03-05" },
  generatedAt: "2026-10-17T12:52:39Z",
  courses: [
    {
      code: "AE 2320",
      subject: "AE",
      title: "Introduction to Orbital Mechanics",
      credits: 3,
      level: "Undergraduate",
      description: "",
      sections: [section("AE 2320-CL01"), lab("CX01", 840), lab("CX02", 900), lab("CX03", 960)],
      options: ["CX01", "CX02", "CX03"].map((code) => ["AE 2320-CL01", `AE 2320-${code}`]),
    },
    {
      code: "AE 2410",
      subject: "AE",
      title: "Introduction to Aerospace Structures",
      credits: 3,
      level: "Undergraduate",
      description: "",
      sections: [
        section("AE 2410-C01", {
          instructors: ["Mark Richman"],
          meetings: [{ days: ["Mon", "Tue", "Wed", "Thu", "Fri"], start: 600, end: 650, location: "Higgins Labs 116" }],
        }),
      ],
      options: [["AE 2410-C01"]],
    },
    {
      code: "AE 5131",
      subject: "AE",
      title: "Incompressible Fluid Dynamics",
      credits: 3,
      level: "Graduate",
      description: "",
      sections: [section("AE 5131-C01", { meetings: [], delivery: "online-async" })],
      options: [["AE 5131-C01"]],
    },
  ],
};

function schedule(lab: string, withOnline: boolean): Schedule {
  const courses = [
    { code: "AE 2320", sections: ["AE 2320-CL01", `AE 2320-${lab}`], openSeats: 30, alternatives: [] },
    { code: "AE 2410", sections: ["AE 2410-C01"], openSeats: 30, alternatives: [] },
  ];
  if (withOnline) courses.push({ code: "AE 5131", sections: ["AE 5131-C01"], openSeats: 30, alternatives: [] });
  return {
    score: { total: 300, earlyMinutes: 250, gapMinutes: 60, days: 5 },
    courses: courses.map((course) => ({ ...course, alternatives: [course.sections] })),
  };
}

export function solved(labs: readonly string[], changes: Partial<Extract<SolveResponse, { ok: true }>> = {}, withOnline = false) {
  return {
    ok: true as const,
    version: 1 as const,
    termId: "2027-C",
    total: labs.length,
    patterns: labs.length,
    capped: false,
    steps: 10,
    elapsedMs: 1,
    schedules: labs.map((code) => schedule(code, withOnline)),
    diagnosis: null,
    ...changes,
  };
}

const initial = getPlannerStore().getState();

/** Puts the shared store in a planned state (ready term, the two AE courses) with the given changes. */
export function setPlanner(changes: Partial<PlannerState> = {}) {
  getPlannerStore().setState({
    ...initial,
    terms: [{ ...term.term, status: "upcoming", courses: 3, sections: 6, generatedAt: term.generatedAt }],
    termId: "2027-C",
    term,
    termStatus: "ready",
    courses: ["AE 2320", "AE 2410"],
    preferences: { startsAfter: 540, blocked: [{ day: "Tue", start: 840, end: 960 }], onlyOpen: true },
    response: solved(["CX01", "CX02", "CX03"]),
    solveStatus: "done",
    ...changes,
  });
}

export function resetPlanner() {
  getPlannerStore().setState(initial, true);
}
