// @vitest-environment node
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import type { TermFile } from "@/lib/data/types";
import { EngineClient, type EngineWorker } from "@/lib/engine/EngineClient";
import { createEngineHost, type GoatplanModule } from "@/lib/engine/engineHost";
import { createScheduleCheck, scheduledCodes } from "./schedules";

const lecture = (code: string, start: number) => ({
  id: `${code}-CL01`, code: "CL01", type: "lecture", status: "open", enrolled: 0, capacity: 30,
  waitlist: { taken: 0, capacity: 0 }, instructors: [], delivery: "in-person",
  meetings: [{ days: ["Mon", "Wed"], start, end: start + 50, location: "Room 1" }],
});
const course = (code: string, start: number) => ({
  code, subject: code.split(" ")[0], title: code, credits: 3, level: "Undergraduate", description: "",
  sections: [lecture(code, start)], options: [[`${code}-CL01`]],
});
const term = {
  term: { id: "2027-C", name: "C Term", season: "Spring", year: 2027, start: "2027-01-13", end: "2027-03-05" },
  generatedAt: "2026-11-01T00:00:00Z",
  courses: [course("CS 2102", 540), course("MA 1021", 540), course("PH 1110", 600),
    { ...course("MA 1022", 540), sections: [lecture("MA 1022", 540), { ...lecture("MA 1022", 660), id: "MA 1022-CL02", capacity: 30, enrolled: 30 }], options: [["MA 1022-CL01"], ["MA 1022-CL02"]] }, { ...course("CS 9999", 0), sections: [], options: [] }],
} as unknown as TermFile;

const webRoot = fileURLToPath(new URL("../../../../", import.meta.url));
let loads = 0;
const host = createEngineHost({
  async loadModule() {
    const engineModule = await import(/* @vite-ignore */ pathToFileURL(`${webRoot}public/engine/goatplan.mjs`).href);
    return await engineModule.default() as GoatplanModule;
  },
  fetchTermText: async () => { loads += 1; return JSON.stringify(term); },
});
const worker: EngineWorker = { onmessage: null, onerror: null, postMessage(message) { void host.handle(message).then((reply) => worker.onmessage?.({ data: reply } as MessageEvent)); }, terminate() {} };
const engine = new EngineClient(() => worker);
afterAll(() => engine.dispose());

describe("schedule check", () => {
  it("only asks about courses with sections in the term", () => {
    expect(scheduledCodes(term, ["PH 1110", "CS 9999", "EN 1251", "CS 2102", "PH 1110"])).toEqual(["CS 2102", "PH 1110"]);
  });

  it("finds whether the courses fit in one weekly schedule", async () => {
    const check = createScheduleCheck(engine);
    expect(await check.fit(term, ["CS 2102", "PH 1110"])).toBe("fits");
    expect(await check.fit(term, ["CS 2102", "MA 1021"])).toBe("clashes");
    expect(await check.fit(term, ["CS 2102", "MA 1021", "EN 1251"])).toBe("clashes");
    expect(await check.fit(term, ["EN 1251"])).toBe("fits");
    expect(loads).toBe(0);
  }, 30_000);

  it("rejects a course when only its full section avoids the chosen courses", async () => {
    const check = createScheduleCheck(engine);
    expect(await check.fit(term, ["MA 1022"])).toBe("fits");
    expect(await check.fit(term, ["CS 2102", "MA 1022"])).toBe("clashes");
  });

  it("can't tell when the engine fails", async () => {
    const broken = createScheduleCheck({ loadTerm: async () => { throw new Error("worker crashed"); }, solve: async () => { throw new Error("unused"); } });
    expect(await broken.fit(term, ["CS 2102", "MA 1021"])).toBe("unknown");
    let tries = 0;
    const missing = createScheduleCheck({ loadTerm: async () => { tries += 1; return { ok: false } as never; }, solve: async () => { throw new Error("unused"); } });
    expect(await missing.fit(term, ["CS 2102"])).toBe("unknown");
    expect(await missing.fit(term, ["PH 1110"])).toBe("unknown");
    expect(tries).toBe(1);
  });
});
