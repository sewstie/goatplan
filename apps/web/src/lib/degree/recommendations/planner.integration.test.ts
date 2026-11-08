// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { EngineClient, type EngineWorker } from "@/lib/engine/EngineClient";
import { createEngineHost, type GoatplanModule } from "@/lib/engine/engineHost";
import type { CatalogCourse } from "../catalog";
import { typedCourse, type DegreeHistory } from "../history";
import { applyHuaPath } from "../humanities";
import { activateRequirements } from "../requirements";
import { loadSheet, type TrackingSheet } from "../sheets";
import { createRecommendationAudit } from "./audit";
import { recommend, type RecommendationInput } from "./planner";
import { termId } from "./offerings";
import type { ScheduleCheck } from "./schedules";

const webRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const host = createEngineHost({
  async loadModule() {
    const engineModule = await import(/* @vite-ignore */ pathToFileURL(`${webRoot}public/engine/goatplan.mjs`).href);
    return await engineModule.default() as GoatplanModule;
  },
  fetchTermText: async () => { throw new Error("No term load needed."); },
});
const worker: EngineWorker = { onmessage: null, onerror: null, postMessage(message) { void host.handle(message).then((reply) => worker.onmessage?.({ data: reply } as MessageEvent)); }, terminate() {} };
const engine = new EngineClient(() => worker);
const a = { letter: "A", year: 2027 } as const;
const b = { letter: "B", year: 2027 } as const;
const c = { letter: "C", year: 2028 } as const;
const course = (code: string, credits: number | null = 3): CatalogCourse => ({ code, subject: code.split(" ")[0], title: code, credits, level: "Undergraduate", description: "", sections: [], options: [], lastOffered: null, termLetters: ["A", "B", "C", "D"] });
const introCatalog = ["CS 1101", "CS 1102", "CS 2102", "CS 2103", "CS 2022", "CS 2223", "MA 1021", "PH 1110", "EN 1251", "PSY 1400"].map((code) => course(code));
let sheet: TrackingSheet;
beforeAll(async () => { sheet = await loadSheet("cs-2030"); activateRequirements(sheet); });
afterAll(() => engine.dispose());
function input(changes: Partial<RecommendationInput> = {}): RecommendationInput {
  const terms = changes.terms ?? [a];
  return { history: { courses: [], manual: [] }, sheet, catalog: introCatalog, terms, cap: 9, offerings: Object.fromEntries(terms.map((term) => [termId(term), { status: "unpublished" }])), kept: [], excluded: [], confirmations: [], reserved: {}, ...changes };
}
const generate = (changes: Partial<RecommendationInput> = {}) => { const value = input(changes); return recommend(value, createRecommendationAudit(engine, value.sheet)); };
const codes = (result: Awaited<ReturnType<typeof generate>>) => result.terms.flatMap((row) => row.additions.map((choice) => choice.course.code));

describe("recommendations with the real CS audit", () => {
  it("plans an introductory chain and offers useful non-CS alternatives", async () => {
    const result = await generate({ terms: [a, b, c] });
    expect(codes(result)).toContain("CS 1101");
    expect(codes(result)).toContain("CS 2102");
    expect(codes(result)).toContain("CS 2223");
    expect(result.terms[0].additions.some((choice) => choice.course.code === "CS 2102")).toBe(false);
    expect(result.terms[1].additions.find((choice) => choice.course.code === "CS 2102")?.background.state).toBe("conditional");
    expect(result.terms[0].alternatives.map((choice) => choice.course.code)).toEqual(expect.arrayContaining(["MA 1021", "PH 1110", "EN 1251", "PSY 1400"]));
    expect(result.terms.every((row) => row.credits <= 9)).toBe(true);
  });
  it("excludes completed courses, only-one alternatives, and cross-listed duplicates", async () => {
    const history: DegreeHistory = { courses: [typedCourse("CS 1102"), typedCourse("MA 2201")], manual: [] };
    const result = await generate({ history });
    expect(codes(result)).not.toEqual(expect.arrayContaining(["CS 1101", "CS 2022"]));
    expect(codes(result)).toContain("CS 2102");
    expect(codes(result)).not.toContain("CS 2103");
    expect(codes(await generate({ history: { courses: [...history.courses, typedCourse("CS 2022")], manual: [] } }))).not.toContain("CS 2022");
  });
  it("does not use later, same-term, or undated plans as prior preparation", async () => {
    for (const term of ["B Term 2027", "A Term 2027", undefined]) {
      const history: DegreeHistory = { courses: [{ ...typedCourse("CS 1101"), status: "planned", term }], manual: [] };
      const result = await generate({ history, catalog: [course("CS 2102")] });
      expect(codes(result)).not.toContain("CS 2102");
      expect(result.terms[0].alternatives[0].background.state).toBe("missing");
      if (!term) expect(result.issues.join(" ")).toContain("without a term");
    }
  });
  it("honors project reservations, kept overloads, fractional caps, and larger courses", async () => {
    const existing = { ...typedCourse("CS 1101"), status: "planned" as const, term: "A Term 2027", credits: 3.5 };
    const result = await generate({ history: { courses: [existing], manual: [] }, reserved: { "A Term 2027": "IQP" }, cap: 3 });
    expect(result.terms[0]).toMatchObject({ credits: 3.5, unused: 0, additions: [] });
    expect(result.terms[0].issues.join(" ")).toContain("over your limit");
    expect(result.terms[0].issues.join(" ")).toContain("IQP");
    expect(codes(await generate({ cap: 2.5 }))).toEqual([]);
    expect(codes(await generate({ cap: 3.5 }))).toHaveLength(1);
    expect(codes(await generate({ cap: 3, history: { courses: [{ ...existing, credits: 3 }], manual: [] } }))).toEqual([]);
  });
  it("keeps an explicitly reviewed choice with preparation and offering warnings", async () => {
    const kept = { ...typedCourse("CS 2102"), status: "planned" as const, term: "A Term 2027" };
    const result = await generate({ kept: [kept], catalog: [{ ...course("CS 2102"), termLetters: [] }] });
    expect(codes(result)).toEqual(["CS 2102"]);
    expect(result.terms[0].issues.join(" ")).toContain("Missing recommended background");
    expect(result.terms[0].issues.join(" ")).toContain("Not sure when");
  });
  it("keeps published failures and absence out of automatic selection", async () => {
    const failed = await generate({ offerings: { "2027-A": { status: "failed" } } });
    expect(codes(failed)).toEqual([]);
    expect(failed.terms[0].issues.join(" ")).toContain("couldn’t be loaded");
    const absent = await generate({ offerings: { "2027-A": { status: "published", file: { term: { id: "2027-A" }, courses: [], generatedAt: "" } as never } } });
    expect(codes(absent)).toEqual([]);
    expect(absent.terms[0].alternatives).toEqual([]);
  });
  it("only suggests courses offered in that term, as alternatives too", async () => {
    const file = { term: { id: "2027-A" }, generatedAt: "", courses: [{ code: "MA 1021", credits: 3, sections: [{ status: "open", capacity: 30, enrolled: 10 }] }] } as never;
    const published = await generate({ offerings: { "2027-A": { status: "published", file } } });
    expect([...published.terms[0].additions, ...published.terms[0].alternatives].map((choice) => choice.course.code)).toEqual(["MA 1021"]);
    const onlyInC = await generate({ catalog: [{ ...course("CS 1101"), termLetters: ["C"] }, course("MA 1021"), { ...course("PH 1110"), termLetters: [] }] });
    expect([...onlyInC.terms[0].additions, ...onlyInC.terms[0].alternatives].map((choice) => choice.course.code)).toEqual(["MA 1021"]);
  });
  it("doesn't group courses whose class times clash", async () => {
    const section = { status: "open", capacity: 30, enrolled: 0 };
    const file = { term: { id: "2027-A" }, generatedAt: "", courses: introCatalog.map((item) => ({ code: item.code, credits: 3, sections: [section] })) } as never;
    const asked: string[][] = [];
    const clashOf = (codes: readonly string[]) => codes.includes("CS 1101") && codes.includes("CS 2022");
    const schedules: ScheduleCheck = { fit: async (_, codes) => { asked.push([...codes]); return clashOf(codes) ? "clashes" : "fits"; } };
    const value = input({ offerings: { "2027-A": { status: "published", file } } });
    const free = await recommend(value, createRecommendationAudit(engine, sheet));
    expect(codes(free)).toEqual(expect.arrayContaining(["CS 1101", "CS 2022"]));
    const result = await recommend(value, createRecommendationAudit(engine, sheet), schedules);
    expect(clashOf(codes(result))).toBe(false);
    expect(asked.length).toBeGreaterThan(0);
    expect(result.terms[0].issues.join(" ")).toMatch(/Left out (CS 1101|CS 2022): their class times clash/);
    const unsure = await recommend(value, createRecommendationAudit(engine, sheet), { fit: async () => "unknown" });
    expect(codes(unsure)).toEqual(codes(free));
    expect(unsure.terms[0].issues.join(" ")).toContain("Couldn’t check class times");
    const kept = ["CS 1101", "CS 2022"].map((code) => ({ ...typedCourse(code), status: "planned" as const, term: "A Term 2027" }));
    const keptClash = await recommend({ ...value, kept }, createRecommendationAudit(engine, sheet), schedules);
    expect(keptClash.terms[0].issues.join(" ")).toContain("can’t all fit in one weekly schedule");
    expect(keptClash.terms[0].issues.join(" ")).not.toContain("Left out");
    const keptFree = await recommend({ ...value, kept }, createRecommendationAudit(engine, sheet));
    expect(keptClash.terms[0].additions.map((choice) => choice.course.code)).toEqual(keptFree.terms[0].additions.map((choice) => choice.course.code));
    expect(keptClash.terms[0].alternatives.some((choice) => choice.reason.includes("clash"))).toBe(false);
  });
  it("does not select variable-credit courses automatically", async () => {
    const result = await generate({ catalog: [course("CS 1101", null)] });
    expect(codes(result)).toEqual([]);
    expect(result.terms[0].alternatives[0].reason).toContain("Credits unknown");
  });
  it("is deterministic across catalog ordering and does not mutate inputs", async () => {
    const value = input({ terms: [a, b] });
    const before = JSON.stringify(value);
    const first = await recommend(value, createRecommendationAudit(engine, sheet));
    const second = await generate({ terms: [a, b], catalog: [...introCatalog].reverse() });
    expect(first).toEqual(second);
    expect(JSON.stringify(value)).toBe(before);
  });
  it.each([NaN, Infinity, 0, -1, 31, 3.001])("rejects invalid cap %s", async (cap) => {
    await expect(generate({ cap })).rejects.toThrow("credit cap");
  });
  it("regenerates dependent courses after exclusions or skill changes", async () => {
    const result = await generate({ terms: [a, b], excluded: ["CS 1101", "CS 1102"] });
    expect(codes(result)).not.toContain("CS 2102");
    const note = "Substantial prior programming experience";
    const confirmed = await generate({ confirmations: [note], catalog: [course("CS 1102")] });
    expect(codes(confirmed)).toEqual(["CS 1102"]);
    expect(codes(await generate({ catalog: [course("CS 1102")] }))).toEqual([]);
  });
  it("uses combined marginal audits when two courses compete for the last social-science line", async () => {
    const result = await generate({ history: { courses: [typedCourse("PSY 1400")], manual: [] }, catalog: [course("GOV 1100"), course("ECON 1110")], records: ["GOV 1100", "ECON 1110"].map((code) => ({ code, title: code, source: "fixture", wording: "None", background: null })), cap: 9 });
    const choices = result.terms[0].additions;
    expect(choices.filter((choice) => choice.reason.includes("Social Science"))).toHaveLength(1);
    expect(choices.filter((choice) => choice.reason.includes("free-elective"))).toHaveLength(1);
  });
  it("preserves selected humanities paths, AP limits, and pins in the audit adapter", async () => {
    const language = applyHuaPath(sheet, { kind: "language", subject: "SP" });
    const result = await generate({ sheet: language, catalog: [course("EN 1251"), course("SP 1521")], history: { courses: [{ ...typedCourse("SP 1522"), apIb: true }], manual: [], huaPath: "language:SP", pins: [{ code: "SP 1522", line: 1 }] } });
    expect(result.terms[0].alternatives.map((choice) => choice.course.code)).toContain("SP 1521");
    expect(result.terms[0].alternatives.find((choice) => choice.course.code === "EN 1251")?.reason ?? "").not.toContain("Humanities");
  });
  it("never offers or keeps a humanities course that can't count toward depth or breadth", async () => {
    const taken = ["EN 1251", "EN 2211", "EN 2221", "WR 1011"].map((code) => ({ ...typedCourse(code), term: "A Term 2026" }));
    const records = ["EN 2231", "HI 1310", "HU 3900"].map((code) => ({ code, title: code, source: "fixture", wording: "None", background: null }));
    const result = await generate({ history: { courses: taken, manual: [] }, catalog: [course("EN 2231"), course("HI 1310"), course("HU 3900")], records, kept: [{ ...typedCourse("EN 2231"), status: "planned", term: "A Term 2027" }] });
    const offered = (value: typeof result) => [...value.terms[0].additions, ...value.terms[0].alternatives].map((choice) => choice.course.code);
    expect(result.terms[0].additions.map((choice) => choice.course.code)).toContain("HI 1310");
    expect(offered(result)).not.toContain("HU 3900");
    expect(result.issues.join(" ")).toMatch(/EN 2231 won’t count toward humanities.*It wasn’t added/);
    const withoutBreadth = await generate({ history: { courses: taken, manual: [] }, catalog: [course("EN 2231"), course("HI 1310")], records, excluded: ["HI 1310"] });
    expect(offered(withoutBreadth)).not.toContain("EN 2231");
  });
  it("leaves manual requirements unresolved and never supplies nonmajor or graduate CS credit", async () => {
    const result = await generate({ catalog: [course("CS 2119"), { ...course("CS 5007"), level: "Graduate" }, course("CS 1004"), course("CS 1101")] });
    expect(codes(result)).not.toContain("CS 5007");
    expect(result.terms[0].additions.filter((choice) => choice.reason.includes("Computer Science")).map((choice) => choice.course.code)).not.toEqual(expect.arrayContaining(["CS 2119", "CS 1004"]));
    expect(result.issues.join(" ")).toMatch(/Physical|Residency|MQP|IQP|Education/);
  });
  it("returns a useful partial result at the course search limit", async () => {
    const smallCourses = ["CS 1101", "CS 2022", "MA 1021", "MA 1022", "MA 1023", "MA 1024", "MA 2071", "PH 1110", "EN 1251"].map((code) => course(code));
    const result = await generate({ catalog: smallCourses, cap: 30, records: smallCourses.map((item) => ({ code: item.code, title: item.code, source: "fixture", wording: "fixture", background: null })) });
    expect(result.limited).toBe(true);
    expect(result.terms[0].additions).toHaveLength(6);
    expect(result.terms[0].credits).toBe(18);
  });
  it("leaves a fully allocated history alone and preserves unresolved manual work", async () => {
    const fixture = JSON.parse(readFileSync(new URL("../../../../../../data/fixtures/degree-history-complete.json", import.meta.url), "utf8"));
    const history: DegreeHistory = { courses: [...fixture.takenCourses.map((item: { code: string; credits: number }) => ({ ...typedCourse(item.code), ...item })), ...fixture.plannedCourses.map((item: { code: string; credits: number }) => ({ ...typedCourse(item.code), ...item, status: "planned" as const }))], manual: [] };
    const result = await generate({ history });
    expect(codes(result)).toEqual([]);
    expect(result.issues.join(" ")).toContain("isn’t on the sheet yet");
    expect(history.manual).toEqual([]);
  });
  it("uses published credit values when the catalog has a smaller historical value", async () => {
    const publishedCourse = { ...course("CS 1101", 3), sections: [{ status: "open", capacity: 10, enrolled: 0 }] };
    const result = await generate({ catalog: [course("CS 1101", 1.5)], offerings: { "2027-A": { status: "published", file: { term: { id: "2027-A" }, courses: [publishedCourse], generatedAt: "" } as never } } });
    expect(codes(result)).toEqual(["CS 1101"]);
    expect(result.terms[0].additions[0].course.credits).toBe(3);
    expect(result.terms[0].additions[0].reason).toContain("Computer Science");
  });
  it("bounded lookahead chooses preparation that unlocks a useful later CS course", async () => {
    const result = await generate({ terms: [a, b], cap: 3, history: { courses: [typedCourse("CS 2102"), typedCourse("CS 2011")], manual: [] }, catalog: [{ ...course("CS 2303"), termLetters: ["A"] }, { ...course("CS 3041"), termLetters: ["A"] }, { ...course("CS 3013"), termLetters: ["B"] }] });
    expect(result.terms[0].additions[0].course.code).toBe("CS 2303");
    expect(result.terms[1].additions).toHaveLength(1);
    expect(result.terms[1].additions[0].background.state).toBe("conditional");
  });
});
