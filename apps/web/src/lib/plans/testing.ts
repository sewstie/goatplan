import type { Section, TermFile } from "@/lib/data";
import type { PlanStorage } from "./storage";
import type { SavedPlan } from "./types";

// Small, hand-made data for plan tests.

export class MemoryPlanStorage implements PlanStorage {
  readonly items = new Map<string, string>();

  get length() {
    return this.items.size;
  }

  key(index: number) {
    return [...this.items.keys()][index] ?? null;
  }

  getItem(key: string) {
    return this.items.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.items.set(key, value);
  }

  removeItem(key: string) {
    this.items.delete(key);
  }

  clear() {
    this.items.clear();
  }
}

export function section(course: string, code: string, overrides: Partial<Section> = {}): Section {
  return {
    id: `${course}-${code}`,
    code,
    type: "lecture",
    status: "open",
    enrolled: 84,
    capacity: 120,
    waitlist: { taken: 0, capacity: 20 },
    instructors: ["Ye Lu"],
    delivery: "in-person",
    meetings: [{ days: ["Mon", "Tue", "Wed", "Thu", "Fri"], start: 540, end: 590, location: "Unity Hall 400" }],
    ...overrides,
  };
}

/** The plan from the "Sections to register" design: three courses, four sections, lab CX02 locked. */
export function designPlan(overrides: Partial<SavedPlan> = {}): SavedPlan {
  return {
    id: "plan-1",
    name: "Plan 1",
    termId: "2027-C",
    term: { name: "C Term", season: "Spring", year: 2027 },
    savedAt: "2026-10-17T12:00:00.000Z",
    courses: ["AE 2320", "AE 2410", "AE 2210"],
    schedule: [
      {
        code: "AE 2320",
        title: "Introduction to Orbital Mechanics",
        sections: [
          section("AE 2320", "CX02", {
            type: "lab",
            enrolled: 36,
            capacity: 40,
            waitlist: { taken: 0, capacity: 0 },
            meetings: [{ days: ["Thu"], start: 900, end: 950, location: "Higgins Labs 230" }],
          }),
          section("AE 2320", "CL01"),
        ],
      },
      {
        code: "AE 2410",
        title: "Introduction to Aerospace Structures",
        sections: [
          section("AE 2410", "C01", {
            enrolled: 32,
            capacity: 50,
            instructors: ["Mark Richman"],
            meetings: [{ days: ["Mon", "Tue", "Wed", "Thu", "Fri"], start: 600, end: 650, location: "Higgins Labs 116" }],
          }),
        ],
      },
      {
        code: "AE 2210",
        title: "Introduction to Thermal Engineering",
        sections: [
          section("AE 2210", "C01", {
            enrolled: 66,
            capacity: 70,
            instructors: ["David Olinger"],
            meetings: [{ days: ["Mon", "Tue", "Wed", "Thu", "Fri"], start: 660, end: 710, location: "Salisbury Labs 104" }],
          }),
        ],
      },
    ],
    locks: { "AE 2320": ["AE 2320-CX02"] },
    professorByCourse: {},
    preferences: { startsAfter: 540, blocked: [{ day: "Tue", start: 840, end: 960 }], onlyOpen: true },
    sortPreset: "fewestEarly",
    ...overrides,
  };
}

/** A term file whose courses hold exactly the plan's sections, as the latest data. */
export function termWith(plan: SavedPlan): TermFile {
  return {
    term: { id: plan.termId, ...plan.term, start: "2027-01-13", end: "2027-03-05" },
    generatedAt: "2026-10-18T12:00:00Z",
    courses: plan.schedule.map((course) => ({
      code: course.code,
      subject: course.code.split(" ")[0],
      title: course.title,
      credits: 3,
      level: "Undergraduate",
      description: "",
      sections: structuredClone(course.sections),
      options: [course.sections.map((item) => item.id)],
    })),
  };
}
