import { describe, expect, it } from "vitest";
import type { AuditLine, AuditSuccess } from "@/lib/engine/types";
import { applyPins, filledLines, moveOutcome, type PinCourses } from "./pins";

const line = (id: number, course: string | null = null, state: AuditLine["state"] = course ? "done" : "empty"): AuditLine => ({ id, label: "Line", state, course });

function audit(cs: AuditLine[], math: AuditLine[], extras: Partial<AuditSuccess> = {}): AuditSuccess {
  return {
    ok: true,
    version: 1,
    sections: [
      { name: "Free Electives", done: 0, planned: 0, total: 3, lines: [line(13), line(14), line(15)] },
      { name: "Computer Science", done: cs.filter((item) => item.course).length, planned: 0, total: 18, lines: cs },
      { name: "Mathematics", done: math.filter((item) => item.course).length, planned: 0, total: 7, lines: math },
    ],
    checks: [{ id: "systems", label: "Systems area", state: "met", courses: ["CS 3013"] }],
    freeElectives: { creditsDone: 0, creditsPlanned: 0, creditsTotal: 9, courses: [] },
    extra: [],
    candidateResults: [],
    ...extras,
  };
}

const taken = (...codes: string[]): PinCourses => new Map(codes.map((code) => [code, { credits: 3, taken: true }]));
const lineOf = (result: AuditSuccess, id: number) => result.sections.flatMap((section) => section.lines).find((item) => item.id === id)!;

describe("applyPins", () => {
  it("does nothing without pins", () => {
    const result = audit([line(18, "CS 2022")], [line(38)]);
    expect(applyPins(result, [], taken("CS 2022")).result).toBe(result);
  });

  it("moves a course to the pinned line and frees its old one", () => {
    const applied = applyPins(audit([line(18, "CS 2022")], [line(38)]), [{ code: "CS 2022", line: 38 }], taken("CS 2022"));
    expect(lineOf(applied.result, 38).course).toBe("CS 2022");
    expect(lineOf(applied.result, 18).course).toBeNull();
    expect(applied.pinned.get(38)).toBe("CS 2022");
  });

  it("recounts the sections", () => {
    const { result } = applyPins(audit([line(18, "CS 2022")], [line(38)]), [{ code: "CS 2022", line: 38 }], taken("CS 2022"));
    expect(result.sections.find((section) => section.name === "Computer Science")!.done).toBe(0);
    expect(result.sections.find((section) => section.name === "Mathematics")!.done).toBe(1);
  });

  it("finds another line for the course it pushes out", () => {
    const { result } = applyPins(
      audit([line(18, "CS 2022"), line(21)], [line(34), line(38, "MA 2071")]),
      [{ code: "CS 2022", line: 38 }],
      taken("CS 2022", "MA 2071"),
    );
    expect(lineOf(result, 38).course).toBe("CS 2022");
    expect(lineOf(result, 34).course).toBe("MA 2071");
  });

  it("moves other courses along when that's what it takes", () => {
    const { result } = applyPins(
      audit([line(26, "CS 4513"), line(18)], [], { freeElectives: { creditsDone: 3, creditsPlanned: 0, creditsTotal: 9, courses: ["CS 4432"] } }),
      [{ code: "CS 4432", line: 26 }],
      taken("CS 4432", "CS 4513"),
    );
    expect(lineOf(result, 26).course).toBe("CS 4432");
    expect(lineOf(result, 18).course).toBe("CS 4513");
  });

  it("puts a pushed-out course in free electives when nothing else takes it", () => {
    const { result } = applyPins(audit([line(18, "CS 2022")], [line(38, "MA 2071")]), [{ code: "CS 2022", line: 38 }], taken("CS 2022", "MA 2071"));
    expect(result.freeElectives.courses).toContain("MA 2071");
    expect(lineOf(result, 13).course).toBe("MA 2071");
    expect(result.freeElectives.creditsDone).toBe(3);
  });

  it("fills a freed line from free electives", () => {
    const start = audit([line(18, "CS 2022")], [line(38)], { freeElectives: { creditsDone: 3, creditsPlanned: 0, creditsTotal: 9, courses: ["CS 3733"] } });
    const { result } = applyPins(start, [{ code: "CS 2022", line: 38 }], taken("CS 2022", "CS 3733"));
    expect(lineOf(result, 18).course).toBe("CS 3733");
    expect(result.freeElectives.courses).toEqual([]);
  });

  it("moves only one copy of a code that counts twice", () => {
    const twice: PinCourses = new Map([["MA 1000", { credits: 6, taken: true }]]);
    const start = audit([], [line(34, "MA 1000"), line(35, "MA 1000"), line(36)]);
    const moved = applyPins(start, [{ code: "MA 1000", line: 36 }], twice).result;
    expect([34, 35, 36].map((id) => lineOf(moved, id).course)).toEqual([null, "MA 1000", "MA 1000"]);
    const stays = applyPins(start, [{ code: "MA 1000", line: 35 }], twice).result;
    expect([34, 35, 36].map((id) => lineOf(stays, id).course)).toEqual(["MA 1000", "MA 1000", null]);
  });

  it("rejects a pin the course isn't allowed on", () => {
    const start = audit([line(18, "CS 2119")], [line(38)]);
    const applied = applyPins(start, [{ code: "CS 2119", line: 18 }, { code: "CS 2119", line: 40 }], taken("CS 2119"));
    expect(applied.rejected).toEqual([{ code: "CS 2119", line: 18 }, { code: "CS 2119", line: 40 }]);
  });

  it("rejects a pin for a course no longer in the history", () => {
    const applied = applyPins(audit([line(18)], []), [{ code: "CS 2022", line: 18 }], taken());
    expect(applied.rejected).toHaveLength(1);
  });

  it("keeps two courses of an only-one-of set from both sitting on CS lines", () => {
    const { result } = applyPins(
      audit([line(17, "CS 2102"), line(18, "CS 2223"), line(19)], [], { freeElectives: { creditsDone: 3, creditsPlanned: 0, creditsTotal: 9, courses: ["CS 2103"] } }),
      [{ code: "CS 2223", line: 19 }],
      taken("CS 2102", "CS 2223", "CS 2103"),
    );
    expect(lineOf(result, 18).course).toBeNull();
    expect(result.freeElectives.courses).toContain("CS 2103");
  });

  it("drops an area check when its course leaves Computer Science", () => {
    const start = audit([line(22, "CS 3013")], []);
    const { result } = applyPins(start, [{ code: "CS 3013", line: 13 }], taken("CS 3013"));
    expect(result.checks[0]).toMatchObject({ id: "systems", state: "not-met", courses: [] });
  });
});

describe("moveOutcome", () => {
  it("counts one fewer line when the pin pushes a course off a line", () => {
    const start = audit([line(18, "CS 2022")], [line(38, "MA 2071")]);
    const outcome = moveOutcome(start, [], taken("CS 2022", "MA 2071"), { code: "CS 2022", line: 38 });
    expect(filledLines(start)).toBe(2);
    expect(outcome).toMatchObject({ best: 2, displaced: "MA 2071", freeElectiveCourse: "MA 2071" });
    expect(outcome.emptied.map((item) => item.id)).toEqual([18]);
  });

  it("sees no loss when the target line was empty", () => {
    const outcome = moveOutcome(audit([line(18, "CS 2022"), line(21)], [line(38)]), [], taken("CS 2022"), { code: "CS 2022", line: 38 });
    expect(outcome.withPin).toBe(outcome.best);
    expect(outcome.displaced).toBeNull();
  });
});
