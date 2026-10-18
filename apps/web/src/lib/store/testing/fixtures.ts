import type { Course, Section, TermFile, TermSummary } from "@/lib/data/types";
import type { LoadTermResponse, SolveRequest, SolveResponse } from "@/lib/engine/types";
import type { DraftStorage } from "../draft";

// Small, hand-made data for store tests.

function section(courseCode: string, code: string, type: Section["type"]): Section {
  return {
    id: `${courseCode}-${code}`,
    code,
    type,
    status: "open",
    enrolled: 10,
    capacity: 40,
    waitlist: { taken: 0, capacity: 0 },
    instructors: ["Ye Lu"],
    delivery: "in-person",
    meetings: [{ days: ["Mon"], start: 540, end: 590, location: "Unity Hall 400" }],
  };
}

function course(code: string, sections: Section[], options: string[][]): Course {
  return { code, subject: code.split(" ")[0], title: code, credits: 3, level: "Undergraduate", description: "", sections, options };
}

export function termFile(id: string): TermFile {
  return {
    term: { id, name: id, season: "Spring", year: 2027, start: "2027-01-13", end: "2027-03-05" },
    generatedAt: "2026-10-17T12:52:39Z",
    courses: [
      course(
        "AE 2320",
        [section("AE 2320", "CL01", "lecture"), section("AE 2320", "CX01", "lab"), section("AE 2320", "CX02", "lab")],
        [
          ["AE 2320-CL01", "AE 2320-CX01"],
          ["AE 2320-CL01", "AE 2320-CX02"],
        ],
      ),
      course("AE 2410", [section("AE 2410", "C01", "lecture")], [["AE 2410-C01"]]),
      course("AB 1533", [section("AB 1533", "C01", "lecture")], [["AB 1533-C01"]]),
    ],
  };
}

export function termSummary(id: string, end = "2027-03-05"): TermSummary {
  return {
    id,
    name: id,
    season: "Spring",
    year: 2027,
    start: "2027-01-13",
    end,
    status: "upcoming",
    courses: 3,
    sections: 5,
    generatedAt: "2026-10-17T12:52:39Z",
  };
}

export const loaded = (termId: string): LoadTermResponse => ({ ok: true, version: 1, termId, courses: 3 });

/** An engine answer with two schedules for the requested courses; AE 2320 has two same-time labs. */
export function solved(request: SolveRequest, termId = "2027-C"): SolveResponse {
  const scheduleCourse = (code: string, labIndex: number) =>
    code === "AE 2320"
      ? {
          code,
          sections: ["AE 2320-CL01", `AE 2320-CX0${labIndex}`],
          openSeats: 30,
          alternatives: [
            ["AE 2320-CL01", `AE 2320-CX0${labIndex}`],
            ["AE 2320-CL01", `AE 2320-CX0${3 - labIndex}`],
          ],
        }
      : { code, sections: [`${code}-C01`], openSeats: 30, alternatives: [[`${code}-C01`]] };

  return {
    ok: true,
    version: 1,
    termId,
    total: 2,
    patterns: 2,
    capped: false,
    steps: 10,
    elapsedMs: 1,
    schedules: [1, 2].map((labIndex) => ({
      score: { total: labIndex, earlyMinutes: 0, gapMinutes: 0, days: 1 },
      courses: request.courses.map((code) => scheduleCourse(code, labIndex)),
    })),
    diagnosis: null,
  };
}

export class MemoryStorage implements DraftStorage {
  readonly items = new Map<string, string>();

  getItem(key: string) {
    return this.items.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.items.set(key, value);
  }
}
