// @vitest-environment node
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";
import type { Course } from "@/lib/data/types";
import { EngineClient, type EngineWorker } from "@/lib/engine/EngineClient";
import { createEngineHost, type GoatplanModule } from "@/lib/engine/engineHost";
import { MemoryPlanStorage } from "@/lib/plans/testing";
import { createGapSource } from "./courseGaps";
import { createDegreeSource } from "./degreeSource";
import { typedCourse } from "./history";

const webRoot = fileURLToPath(new URL("../../../", import.meta.url));

function realEngine() {
  const host = createEngineHost({
    async loadModule() {
      const url = pathToFileURL(`${webRoot}public/engine/goatplan.mjs`).href;
      const engineModule = await import(/* @vite-ignore */ url);
      return await engineModule.default() as GoatplanModule;
    },
    fetchTermText: async () => {
      throw new Error("An audit doesn't need a term.");
    },
  });
  const worker: EngineWorker = {
    onmessage: null,
    onerror: null,
    postMessage(message) {
      void host.handle(message).then((reply) => worker.onmessage?.({ data: reply } as MessageEvent));
    },
    terminate() {},
  };
  return new EngineClient(() => worker);
}

const course = (code: string, credits = 3) =>
  ({ code, subject: code.split(" ")[0], title: code, credits, level: "Undergraduate", description: "", sections: [], options: [] }) as Course;

function setup(taken: string[]) {
  const engine = realEngine();
  const storage = new MemoryPlanStorage();
  const degree = createDegreeSource({ getStorage: () => storage, engine });
  for (const code of taken) degree.addCourse(typedCourse(code));
  const gaps = createGapSource({ degree, engine });
  gaps.subscribe(() => {});
  const answers = async () => {
    await vi.waitFor(() => expect(gaps.getSnapshot().status).toBe("ready"), { timeout: 5_000, interval: 10 });
    return gaps.getSnapshot().closes;
  };
  return { engine, degree, gaps, answers };
}

describe("badge answers from the real audit", () => {
  it("names a section and a check for a course that closes both", async () => {
    const { gaps, answers, engine } = setup(["CS 2102"]);
    gaps.setOpenTerm({ courses: [course("CS 3013")], planned: [] });
    expect((await answers())?.get("CS 3013")).toEqual(["Computer Science", "Systems"]);
    engine.dispose();
  });

  it("follows a swap to the section the moved course ends up in", async () => {
    const { gaps, answers, engine } = setup([
      "CS 2001", "CS 2002", "CS 2003", "CS 2004", "CS 2005", "CS 2006", "CS 2007", "CS 2008", "CS 2009", "CS 2022",
    ]);
    gaps.setOpenTerm({ courses: [course("CS 2010"), course("CS 3133")], planned: [] });
    const closes = await answers();
    expect(closes?.get("CS 2010")).toEqual(["Mathematics"]);
    expect(closes?.get("CS 3133")).toEqual(["Mathematics", "Theory & Languages"]);
    engine.dispose();
  });

  it("shows only the check for a course that closes only a check", async () => {
    const { gaps, answers, engine } = setup(["ECON 1110", "PSY 1400"]);
    gaps.setOpenTerm({ courses: [course("GOV 2315")], planned: [] });
    expect((await answers())?.get("GOV 2315")).toEqual(["Social Implications"]);
    engine.dispose();
  });

  it("gives nothing for a course that could only be a free elective", async () => {
    const { gaps, answers, engine } = setup([]);
    gaps.setOpenTerm({ courses: [course("BUS 2020"), course("ID 1000"), course("MA 1021")], planned: [] });
    const closes = await answers();
    expect(closes?.has("BUS 2020")).toBe(false);
    expect(closes?.has("ID 1000")).toBe(false);
    expect(closes?.get("MA 1021")).toEqual(["Mathematics"]);
    engine.dispose();
  });

  it("gives nothing for a course under 3 credits", async () => {
    const { gaps, answers, engine } = setup([]);
    gaps.setOpenTerm({ courses: [course("CS 3013", 1.5)], planned: [] });
    expect((await answers())?.has("CS 3013")).toBe(false);
    engine.dispose();
  });

  it("stops naming a check once the history or the plan meets it", async () => {
    const { degree, gaps, answers, engine } = setup(["CS 2102"]);
    const courses = [course("CS 3013"), course("CS 4513")];
    gaps.setOpenTerm({ courses, planned: [] });
    expect((await answers())?.get("CS 4513")).toEqual(["Computer Science", "Systems"]);

    gaps.setOpenTerm({ courses, planned: ["CS 3013"] });
    expect(gaps.getSnapshot().status).toBe("waiting");
    const planned = await answers();
    expect(planned?.get("CS 4513")).toEqual(["Computer Science"]);
    expect(planned?.has("CS 3013")).toBe(false);

    gaps.setOpenTerm({ courses, planned: [] });
    degree.addCourse(typedCourse("CS 4513"));
    const taken = await answers();
    expect(taken?.get("CS 3013")).toEqual(["Computer Science"]);
    expect(taken?.has("CS 4513")).toBe(false);
    engine.dispose();
  });

  it("names nothing on a finished section", async () => {
    const { gaps, answers, engine } = setup(["PSY 1400", "GOV 1100"]);
    gaps.setOpenTerm({ courses: [course("ECON 1110")], planned: [] });
    expect((await answers())?.has("ECON 1110")).toBe(false);
    engine.dispose();
  });
});
