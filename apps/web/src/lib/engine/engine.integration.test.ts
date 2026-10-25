// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import type { TermFile, TermIndex } from "@/lib/data/types";
import { createEngineHost, type GoatplanModule } from "./engineHost";
import type { LoadTermResponse, SolveResponse } from "./types";

// The real WebAssembly engine from public/engine, run through the worker's host logic.

const webRoot = fileURLToPath(new URL("../../../", import.meta.url));
const readData = (name: string) => readFileSync(`${webRoot}public/data/${name}`, "utf8");

const host = createEngineHost({
  async loadModule() {
    const moduleUrl = pathToFileURL(`${webRoot}public/engine/goatplan.mjs`).href;
    const engineModule = await import(/* @vite-ignore */ moduleUrl);
    return (await engineModule.default()) as GoatplanModule;
  },
  fetchTermText: async (termId) => readData(`${termId}.json`),
});

const termId = (JSON.parse(readData("index.json")) as TermIndex).terms[0].id;
const term = JSON.parse(readData(`${termId}.json`)) as TermFile;
const timed = term.courses.filter((course) =>
  course.sections.some((section) => section.meetings.length > 0),
);

let nextId = 1;
async function solve(request: object): Promise<SolveResponse> {
  const reply = await host.handle({ id: nextId++, kind: "solve", request: { version: 1, courses: [], ...request } });
  if (reply.type !== "result") throw new Error(reply.message);
  return reply.response as SolveResponse;
}

describe("real engine", () => {
  it("loads a published term", async () => {
    const reply = await host.handle({ id: nextId++, kind: "loadTerm", termId });
    expect(reply.type).toBe("result");
    const response = (reply as { response: LoadTermResponse }).response;
    expect(response).toEqual({ ok: true, version: 1, termId, courses: term.courses.length });
  }, 30_000);

  it("answers a solve request in the documented shape", async () => {
    const courses = timed.slice(0, 2).map((course) => course.code);
    const response = await solve({ courses, limits: { maxSchedules: 3 } });
    expect(response.ok).toBe(true);
    if (!response.ok) return;

    expect(response).toMatchObject({ version: 1, termId, capped: false, diagnosis: null });
    expect(typeof response.elapsedMs).toBe("number");
    expect(response.schedules.length).toBeGreaterThan(0);
    expect(response.schedules.length).toBeLessThanOrEqual(3);
    for (const schedule of response.schedules) {
      expect(Object.keys(schedule.score).sort()).toEqual([
        "averageEnd",
        "averageStart",
        "days",
        "earlyMinutes",
        "firstStart",
        "freeMinutes",
        "gapMinutes",
        "lastEnd",
        "lateMinutes",
        "total",
      ]);
      expect(schedule.courses.map((course) => course.code)).toEqual(courses);
      for (const course of schedule.courses) {
        expect(course.alternatives).toContainEqual(course.sections);
        expect(course.openSeats === null || typeof course.openSeats === "number").toBe(true);
      }
    }
  });

  it("explains why nothing fits", async () => {
    const response = await solve({ courses: [timed[0].code], preferences: { startsAfter: 1430 } });
    expect(response.ok).toBe(true);
    if (!response.ok) return;

    expect(response.total).toBe(0);
    expect(response.diagnosis).toMatchObject({ unsure: false, clashingPairs: [], minimalClash: [] });
    const [empty] = response.diagnosis!.emptyCourses;
    expect(empty.code).toBe(timed[0].code);
    expect(Object.keys(empty.removed).sort()).toEqual(["blocked", "notAnyOf", "notLocked", "notOpen", "startsTooEarly"]);
    for (const fix of response.diagnosis!.fixes) {
      expect(["relaxStartsAfter", "clearBlocked", "allowFull", "unlock", "clearAnyOf", "dropCourse"]).toContain(fix.kind);
    }
  });

  it("returns errors as ok: false with a code and detail", async () => {
    const response = await solve({ courses: ["ZZ 9999"] });
    expect(response).toMatchObject({
      ok: false,
      version: 1,
      error: { code: "unknownCourse", detail: "ZZ 9999" },
    });
  });

  it("sends the version back as JSON text in detail", async () => {
    const response = await solve({ version: 2, courses: [timed[0].code] });
    expect(response).toMatchObject({ ok: false, error: { code: "unsupportedVersion", detail: "2" } });
  });

  it("lists a clashing pair as [first, second] in request order", async () => {
    // Two courses with one option each, meeting at exactly the same times, can never fit together.
    const meetingKey = (course: (typeof timed)[number]) =>
      JSON.stringify(course.sections.map((section) => section.meetings));
    const seen = new Map<string, string>();
    let pair: [string, string] | null = null;
    for (const course of timed.filter((candidate) => candidate.options.length === 1)) {
      const twin = seen.get(meetingKey(course));
      if (twin) {
        pair = [twin, course.code];
        break;
      }
      seen.set(meetingKey(course), course.code);
    }
    expect(pair, "two single-option courses at the same times").not.toBeNull();

    const [first, second] = pair!;
    const response = await solve({ courses: [second, first] });
    expect(response.ok && response.diagnosis).toMatchObject({
      clashingPairs: [[second, first]],
      minimalClash: [],
    });
  });

  it("gives a minimal clash in request order where every course is needed", async () => {
    const small = timed.filter((course) => course.options.length >= 2 && course.options.length <= 3);
    let found: { courses: string[]; clash: string[] } | null = null;
    search: for (let i = 0; i < small.length; i += 1) {
      for (let j = i + 1; j < small.length; j += 1) {
        for (let k = j + 1; k < small.length; k += 1) {
          const courses = [small[i].code, small[j].code, small[k].code];
          const response = await solve({ courses, limits: { maxSchedules: 1 } });
          if (response.ok && response.diagnosis && response.diagnosis.minimalClash.length > 0) {
            found = { courses, clash: response.diagnosis.minimalClash };
            break search;
          }
        }
      }
    }
    expect(found, "three courses that fit pair by pair but not together").not.toBeNull();

    const { courses, clash } = found!;
    expect(clash).toEqual(courses.filter((code) => clash.includes(code)));
    for (const left of clash) {
      const rest = clash.filter((code) => code !== left);
      const response = await solve({ courses: rest, limits: { maxSchedules: 1 } });
      expect(response.ok && response.total, `without ${left}`).toBeGreaterThan(0);
    }
  }, 60_000);
});
