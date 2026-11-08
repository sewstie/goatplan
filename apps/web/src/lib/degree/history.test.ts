import { describe, expect, it } from "vitest";
import { getRequirements } from "./requirements";
import { MemoryPlanStorage } from "@/lib/plans/testing";
import {
  buildAuditRequest,
  cleanCourseCode,
  EMPTY_HISTORY,
  foundCourse,
  HISTORY_KEY,
  MAX_HISTORY_FILE_LENGTH,
  parseCredits,
  parseHistory,
  parseHistoryFile,
  readHistory,
  serializeHistory,
  typedCourse,
  writeHistory,
  type DegreeHistory,
  type HistoryCourse,
} from "./history";

const course = (code: string, extra: Partial<HistoryCourse> = {}): HistoryCourse => ({
  code,
  title: "",
  credits: 3,
  status: "taken",
  apIb: false,
  source: "found",
  ...extra,
});

function stored(value: unknown) {
  const storage = new MemoryPlanStorage();
  storage.setItem(HISTORY_KEY, typeof value === "string" ? value : JSON.stringify(value));
  return storage;
}

describe("cleanCourseCode", () => {
  it.each([
    ["cs2102", "CS 2102"],
    ["  cs   2102 ", "CS 2102"],
    ["Cs-2102", "CS 2102"],
    ["ma\t1021", "MA 1021"],
    ["cs 502", "CS 502"],
    ["cs 210x", "CS 210X"],
    ["wpe 1001", "WPE 1001"],
    ["ECON 1110", "ECON 1110"],
  ])("cleans %j to %j", (typed, code) => {
    expect(cleanCourseCode(typed)).toBe(code);
  });

  it.each(["", "   ", "calculus", "CS", "2102", "C 2102", "ABCDE 2102", "CS 21", "CS 21023", "CS 2102 A", "CS 2102; drop"])(
    "rejects %j",
    (typed) => {
      expect(cleanCourseCode(typed)).toBeNull();
    },
  );
});

describe("new courses", () => {
  it("defaults a typed course to 3 credits and remembers it was typed", () => {
    expect(typedCourse("CS 9999")).toEqual(course("CS 9999", { source: "typed" }));
  });

  it("copies code, title and credits from a found course", () => {
    expect(foundCourse({ code: "MA 1021", title: "Calculus I", credits: 3 })).toEqual(
      course("MA 1021", { title: "Calculus I" }),
    );
  });

  it("gives a found course with no credits the same default", () => {
    expect(foundCourse({ code: "MA 1021", title: "Calculus I", credits: null }).credits).toBe(3);
  });
});

describe("parseHistory", () => {
  it("reads a good history", () => {
    const history = { courses: [course("CS 2102", { term: "2027-C", status: "planned", apIb: true })], manual: ["iqp-1"] };
    expect(parseHistory({ version: 1, ...history })).toEqual({ history, damaged: false });
  });

  it.each([
    ["null", null],
    ["a list", []],
    ["another version", { version: 3, courses: [], manual: [] }],
    ["no version", { courses: [], manual: [] }],
    ["courses that aren't a list", { version: 1, courses: "CS 2102", manual: [] }],
  ])("treats %s as an empty, damaged history", (_name, value) => {
    expect(parseHistory(value)).toEqual({ history: EMPTY_HISTORY, damaged: true });
  });

  it.each([
    ["no code", { title: "", credits: 3 }],
    ["a code that isn't one", { code: "drop table", title: "", credits: 3 }],
    ["text credits", { code: "CS 2102", title: "", credits: "3" }],
    ["negative credits", { code: "CS 2102", title: "", credits: -1 }],
    ["endless credits", { code: "CS 2102", title: "", credits: Infinity }],
    ["a title that isn't text", { code: "CS 2102", title: 7, credits: 3 }],
    ["huge credits", { code: "CS 2102", title: "", credits: 31 }],
    ["a very long title", { code: "CS 2102", title: "x".repeat(301), credits: 3 }],
    ["a very long term", { code: "CS 2102", title: "", credits: 3, term: "x".repeat(41) }],
    ["not an object", "CS 2102"],
  ])("skips a course with %s and keeps the others", (_name, broken) => {
    const good = course("MA 1021");
    expect(parseHistory({ version: 1, courses: [broken, good], manual: [] })).toEqual({
      history: { courses: [good], manual: [] },
      damaged: true,
    });
  });

  it("cleans a stored code", () => {
    const { history } = parseHistory({ version: 1, courses: [{ ...course("CS 2102"), code: "cs2102" }], manual: [] });
    expect(history.courses[0].code).toBe("CS 2102");
  });

  it("keeps the first copy of a repeated code", () => {
    const { history } = parseHistory({
      version: 1,
      courses: [course("CS 2102", { title: "First" }), course("CS 2102", { title: "Second" })],
      manual: [],
    });
    expect(history.courses.map((item) => item.title)).toEqual(["First"]);
  });

  it("drops fields a history doesn't have, so grades can't be kept by accident", () => {
    const { history } = parseHistory({ version: 1, courses: [{ ...course("CS 2102"), grade: "A" }], manual: [], gpa: 4 });
    expect(history).toEqual({ courses: [course("CS 2102")], manual: [] });
  });

  it("fills missing flags with their defaults", () => {
    const { history } = parseHistory({ version: 1, courses: [{ code: "CS 2102", title: "", credits: 3 }] });
    expect(history).toEqual({ courses: [course("CS 2102", { source: "typed" })], manual: [] });
  });

  it("keeps only text in the manual items", () => {
    const { history } = parseHistory({ version: 1, courses: [], manual: ["iqp-1", 7, null] });
    expect(history.manual).toEqual(["iqp-1"]);
  });
});

describe("history storage", () => {
  it("is empty and not damaged when nothing is stored", () => {
    expect(readHistory(new MemoryPlanStorage())).toEqual({ history: EMPTY_HISTORY, damaged: false });
  });

  it("is empty without storage", () => {
    expect(readHistory(null)).toEqual({ history: EMPTY_HISTORY, damaged: false });
  });

  it("gives back what it stored, under the history key", () => {
    const storage = new MemoryPlanStorage();
    const history = { courses: [course("CS 2102"), course("CS 9999", { source: "typed" })], manual: [] };
    expect(writeHistory(storage, history)).toBe(true);
    expect(storage.getItem(HISTORY_KEY)).not.toBeNull();
    expect(readHistory(storage)).toEqual({ history, damaged: false });
  });

  it("reports text that isn't JSON as damaged", () => {
    expect(readHistory(stored("{not json"))).toEqual({ history: EMPTY_HISTORY, damaged: true });
  });

  it("doesn't throw when storage is blocked", () => {
    const blocked = new MemoryPlanStorage();
    blocked.getItem = () => {
      throw new Error("blocked");
    };
    blocked.setItem = () => {
      throw new Error("blocked");
    };
    expect(readHistory(blocked)).toEqual({ history: EMPTY_HISTORY, damaged: false });
    expect(writeHistory(blocked, EMPTY_HISTORY)).toBe(false);
  });

  it("reports a write with no storage as failed", () => {
    expect(writeHistory(null, EMPTY_HISTORY)).toBe(false);
  });
});

describe("parseCredits", () => {
  it.each([["3", 3], [" 1.5 ", 1.5], ["0", 0], ["0.75", 0.75], [".5", 0.5], ["30", 30]])("reads %j", (text, credits) => {
    expect(parseCredits(text)).toBe(credits);
  });

  it.each(["", " ", "three", "-1", "31", "1e2", "3,5", "1.234", "Infinity", "0x10", "3 credits"])("rejects %j", (text) => {
    expect(parseCredits(text)).toBeNull();
  });
});

describe("history files", () => {
  const full: DegreeHistory = {
    courses: [
      course("CS 2102", { title: "Object-Oriented Design Concepts", term: "B 2026" }),
      course("EN 1000", { source: "typed", apIb: true, credits: 1.5 }),
      course("MA 1023", { title: "Calculus \"III\" <b>", status: "planned", credits: 0.75 }),
    ],
    manual: ["iqp-1", "wpe-sports"],
  };

  it("restores an identical history from its own export", () => {
    expect(parseHistoryFile(serializeHistory(full))).toEqual({ ok: true, history: full });
    expect(parseHistoryFile(serializeHistory(EMPTY_HISTORY))).toEqual({ ok: true, history: EMPTY_HISTORY });
  });

  it("keeps the order and exports nothing but the history", () => {
    const file = JSON.parse(serializeHistory(full));
    expect(Object.keys(file).sort()).toEqual(["courses", "manual", "version"]);
    expect(file.courses.map((item: HistoryCourse) => item.code)).toEqual(["CS 2102", "EN 1000", "MA 1023"]);
  });

  it("reads the same format the browser stores", () => {
    const storage = new MemoryPlanStorage();
    writeHistory(storage, full);
    expect(parseHistoryFile(storage.getItem(HISTORY_KEY) ?? "")).toEqual({ ok: true, history: full });
  });

  const file = (overrides: object) => JSON.stringify({ version: 1, courses: [course("CS 2102")], manual: [], ...overrides });
  const withCourse = (overrides: object) => file({ courses: [{ ...course("CS 2102"), ...overrides }] });

  it.each([
    ["an empty file", ""],
    ["text that isn't JSON", "{not json"],
    ["a cut-off file", serializeHistory(full).slice(0, 40)],
    ["null", "null"],
    ["a number", "7"],
    ["a list", "[]"],
    ["some other JSON", '{"hello":"world"}'],
    ["no version", JSON.stringify({ courses: [], manual: [] })],
    ["a version that's text", file({ version: "1" })],
    ["no courses", JSON.stringify({ version: 1, manual: [] })],
    ["courses that aren't a list", file({ courses: { 0: course("CS 2102") } })],
    ["no manual list", JSON.stringify({ version: 1, courses: [] })],
    ["a manual list with other things in it", file({ manual: ["iqp-1", 7] })],
    ["a very long manual item", file({ manual: ["x".repeat(65)] })],
    ["a course that's not an object", file({ courses: ["CS 2102"] })],
    ["a broken code", withCourse({ code: "<img src=x onerror=alert(1)>" })],
    ["credits that are text", withCourse({ credits: "3" })],
    ["negative credits", withCourse({ credits: -3 })],
    ["huge credits", withCourse({ credits: 1e308 })],
    ["endless credits", `{"version":1,"manual":[],"courses":[{"code":"CS 2102","title":"","credits":1e999,"inProgress":false,"apIb":false,"source":"typed"}]}`],
    ["a title that isn't text", withCourse({ title: {} })],
    ["a very long title", withCourse({ title: "x".repeat(301) })],
    ["a term that isn't text", withCourse({ term: 2025 })],
    ["a very long term", withCourse({ term: "x".repeat(41) })],
    ["an in-progress flag that isn't true or false", withCourse({ status: "unknown" })],
    ["an AP/IB flag that isn't true or false", withCourse({ apIb: 1 })],
    ["an unknown source", withCourse({ source: "hacked" })],
    ["a repeated code", file({ courses: [course("CS 2102"), course("cs2102")] })],
    ["one bad course among good ones", file({ courses: [course("CS 2102"), { code: "nope" }] })],
    ["a file that's far too long", file({ manual: [" ".repeat(MAX_HISTORY_FILE_LENGTH)] })],
    ["very deep nesting", `${"[".repeat(200_000)}${"]".repeat(200_000)}`],
  ])("refuses %s", (_name, text) => {
    expect(parseHistoryFile(text)).toEqual({ ok: false, reason: "broken" });
  });

  it.each([0, 3, 1.5, -1, 999])("says version %s is a different version", (version) => {
    expect(parseHistoryFile(file({ version }))).toEqual({ ok: false, reason: "version" });
  });

  it("isn't fooled by a __proto__ key, and doesn't pollute anything", () => {
    const text = '{"__proto__":{"version":1,"courses":[],"manual":[],"polluted":true}}';
    expect(parseHistoryFile(text)).toEqual({ ok: false, reason: "broken" });
    const carried = '{"version":1,"manual":[],"__proto__":{"polluted":true},"courses":[{"__proto__":{"polluted":true},"code":"CS 2102","title":"","credits":3,"inProgress":false,"apIb":false,"source":"typed","constructor":{"prototype":{"polluted":true}}}]}';
    const result = parseHistoryFile(carried);
    expect(result).toEqual({ ok: true, history: { courses: [course("CS 2102", { source: "typed" })], manual: [] } });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("drops extra fields, so a grade in a file can't be stored", () => {
    const result = parseHistoryFile(file({ gpa: 4, courses: [{ ...course("CS 2102"), grade: "A" }] }));
    expect(result).toEqual({ ok: true, history: { courses: [course("CS 2102")], manual: [] } });
  });

  it("cleans a code a person edited by hand", () => {
    const result = parseHistoryFile(file({ courses: [course("cs2102")] }));
    expect(result).toEqual({ ok: true, history: { courses: [course("CS 2102")], manual: [] } });
  });
});

describe("buildAuditRequest", () => {
  it("sends finished courses as taken and in-progress courses as planned", () => {
    const request = buildAuditRequest({
      courses: [course("CS 2102"), course("MA 1021", { status: "planned" }), course("EN 1001", { apIb: true, credits: 1.5 })],
      manual: ["iqp-1"],
    });
    expect(request).toEqual({
      version: 1,
      requirements: "cs-2030",
      sheet: getRequirements(),
      taken: [{ code: "CS 2102", credits: 3 }, { code: "EN 1001", credits: 1.5, apIb: true }],
      planned: [{ code: "MA 1021", credits: 3 }],
      manual: ["iqp-1"],
    });
  });

  it("sends a code that counts more than once with its credits split per copy", () => {
    const { history } = parseHistory({ version: 2, courses: [course("MA 1000", { apIb: true, credits: 6, copies: 2 })], manual: [] });
    expect(history.courses[0].copies).toBe(2);
    expect(buildAuditRequest(history).taken).toEqual([{ code: "MA 1000", credits: 3, apIb: true, copies: 2 }]);
  });

  it("drops a copies count it can't use", () => {
    for (const copies of [1, 0, 1.5, 10, "2"]) {
      const { history } = parseHistory({ version: 2, courses: [course("MA 1000", { copies: copies as number })], manual: [] });
      expect(history.courses[0]).not.toHaveProperty("copies");
    }
  });

  it("works from the stored copy alone, for a course no term file lists", () => {
    const { history } = parseHistory({ version: 1, courses: [course("CS 1005", { title: "Retired course" })], manual: [] });
    expect(buildAuditRequest(history).taken).toEqual([{ code: "CS 1005", credits: 3 }]);
  });
});

describe("standalone history migration", () => {
  it("migrates in-progress records to planned and preserves other records as taken", () => {
    const legacy = { version: 1, manual: ["iqp-1"], courses: [
      { code: "CS 2102", title: "Design", credits: 3, inProgress: true, apIb: false, source: "found", term: "C Term 2027" },
      { code: "MA 1021", title: "Calculus", credits: 3, inProgress: false, apIb: false, source: "found", term: "A Term 2025" },
      { code: "EN 1000", title: "Transfer", credits: 3, apIb: true, source: "typed" },
    ] };
    const migrated = parseHistory(legacy);
    expect(migrated.damaged).toBe(false);
    expect(migrated.history.courses).toEqual([
      course("CS 2102", { title: "Design", status: "planned", term: "C Term 2027" }),
      course("MA 1021", { title: "Calculus" }),
      course("EN 1000", { title: "Transfer", apIb: true, source: "typed" }),
    ]);
    expect(JSON.parse(serializeHistory(migrated.history))).toMatchObject({ version: 2 });
    expect(serializeHistory(migrated.history)).not.toContain("inProgress");
  });

  it("accepts all terms through 2030, summer included, without consulting published data", () => {
    const history = { courses: [course("CS 2102", { status: "planned", term: "D Term 2030" })], manual: [] };
    expect(parseHistoryFile(serializeHistory(history))).toEqual({ ok: true, history });
    const summer = { ...history, courses: [course("CS 2102", { status: "planned", term: "E Term 2027" })] };
    expect(parseHistoryFile(serializeHistory(summer))).toEqual({ ok: true, history: summer });
    for (const term of ["A Term 2025", "B Term 2031", "anything"]) {
      expect(parseHistoryFile(serializeHistory({ ...history, courses: [course("CS 2102", { term })] }))).toEqual({ ok: false, reason: "broken" });
    }
  });
});

describe("catalog identifiers", () => {
  it("keeps unnumbered catalog entries for review without sending invalid codes to the audit", () => {
    for (const code of ["ISU", "ISU BB", "HU—AAS-50"]) {
      const entry = foundCourse({ code, title: "Catalog entry", credits: 3 });
      expect(entry.source).toBe("typed");
      const history = { courses: [entry, course("MA 1021")], manual: [] };
      expect(parseHistoryFile(serializeHistory(history))).toEqual({ ok: true, history });
      expect(buildAuditRequest(history).taken).toEqual([{ code: "MA 1021", credits: 3 }]);
    }
  });
});
