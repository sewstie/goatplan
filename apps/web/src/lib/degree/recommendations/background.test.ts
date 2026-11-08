import { describe, expect, it } from "vitest";
import { preparation, backgroundCourses } from "./background";
import { typedCourse } from "../history";
import type { MapSource } from "@/lib/courseMap/courseMap";

const term = { letter: "C", year: 2027 } as const;
const taken = (code: string) => typedCourse(code);
const plan = (code: string, date?: string) => ({ ...taken(code), status: "planned" as const, term: date });

describe("recommended background", () => {
  it("uses the whole nested expression and separate skill confirmations", () => {
    expect(preparation("CS 2103", [taken("CS 1101")], term).state).toBe("skills");
    const note = preparation("CS 2103", [taken("CS 1101")], term).notes[0];
    expect(preparation("CS 2103", [taken("CS 1101")], term, [note]).state).toBe("confirmed");
    expect(preparation("CS 2103", [], term, [note]).state).toBe("missing");
    expect(preparation("CS 2102", [taken("CS 1102")], term).state).toBe("completed");
  });
  it("distinguishes null, missing curation, and note-only backgrounds", () => {
    expect(preparation("CS 1101", [], term).state).toBe("completed");
    expect(preparation("MA 1021", [], term).state).toBe("unknown");
    expect(preparation("CS 1102", [], term).state).toBe("skills");
  });
  it("uses earlier plans conditionally and completed undated knowledge", () => {
    expect(preparation("CS 2102", [plan("CS 1101", "B Term 2026")], term).state).toBe("conditional");
    for (const date of ["C Term 2027", "D Term 2027", undefined]) expect(preparation("CS 2102", [plan("CS 1101", date)], term).state).toBe("missing");
    expect(preparation("CS 2102", [taken("CS 1101")], term).state).toBe("completed");
  });
  it("resolves source aliases in either direction without credit-alternative inference", () => {
    const records: MapSource[] = [
      { code: "CS 2022", aliases: ["MA 2201"], title: "Discrete", source: "", wording: "", background: null },
      { code: "CS 4000", title: "Test", source: "", wording: "", background: { course: "MA 2201" } },
    ];
    expect(preparation("CS 4000", [taken("CS 2022")], term, [], records).state).toBe("completed");
    expect(preparation("CS 4000", [taken("CS 1102")], term, [], records).state).toBe("missing");
  });
  it("terminates cyclic and missing source traversal", () => {
    const records: MapSource[] = [{ code: "CS 0001", title: "Test", source: "", wording: "", background: { all: [{ course: "CS 0001" }, { course: "MA 9999" }] } }];
    expect(backgroundCourses("CS 0001", records)).toEqual({ codes: ["CS 0001", "MA 9999"], uncertain: true });
  });
  it("skips options of a choice that the student already covers", () => {
    expect(backgroundCourses("CS 2011").codes).toContain("CS 1005");
    const covered = backgroundCourses("CS 2011", undefined, ["CS 1101"]).codes;
    expect(covered).toContain("CS 2303");
    expect(covered).not.toContain("CS 1005");
    expect(covered).not.toContain("CS 1004");
  });
  it("depends on relevant knowledge rather than credit totals", () => {
    expect(preparation("CS 2102", [taken("CS 1101")], term).state).not.toBe(preparation("CS 2102", [taken("MA 1021")], term).state);
  });
});
