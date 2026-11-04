// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { EngineClient, type EngineWorker } from "./EngineClient";
import { createEngineHost, type GoatplanModule } from "./engineHost";
import type { AuditRequest, AuditSuccess } from "./types";
import type { TermFile, TermIndex } from "@/lib/data/types";
import { buildAuditRequest, type HistoryCourse } from "@/lib/degree/history";

const webRoot = fileURLToPath(new URL("../../../", import.meta.url));
const cases = JSON.parse(readFileSync(`${webRoot}../../engine/tests/fixtures/audit.json`, "utf8")) as {
  name: string;
  request: AuditRequest;
  sections?: Record<string, { done: number; planned: number; total: number }>;
  lines?: { id: number; state: string; course: string | null }[];
  freeElectives?: AuditSuccess["freeElectives"];
  extra?: string[];
  checks?: { id: string; state: string; courses?: string[] }[];
  candidateResults?: AuditSuccess["candidateResults"];
  error?: { code: string; detail: string };
}[];

interface HandWrittenHistory {
  takenCourses: { code: string; credits: number; apIb?: boolean }[];
  plannedCourses: { code: string; credits: number; apIb?: boolean }[];
  confirmedManualItems: string[];
  expectedLines: Record<string, { state: string; course?: string | null; subSlots?: { state: string; course: string | null }[] }>;
  expectedSections: Record<string, { done: number; planned: number; total: number }>;
  expectedChecks: Record<string, { state: string; courses?: string[] }>;
  expectedFreeElectivePool: { courses: { code: string; credits: number }[]; totalCredits: number };
  expectedExtra: { code: string }[];
}

const readHistory = (name: string) =>
  JSON.parse(readFileSync(`${webRoot}../../data/fixtures/${name}`, "utf8")) as HandWrittenHistory;

const sheetWord = (state: string) => {
  if (state === "missing") return "empty";
  if (state === "check-yourself") return "check";
  return state;
};

const courseOnly = ({ code, credits, apIb }: { code: string; credits: number; apIb?: boolean }) =>
  apIb === undefined ? { code, credits } : { code, credits, apIb };

function historyRequest(history: HandWrittenHistory): AuditRequest {
  return {
    version: 1,
    requirements: "cs-2030",
    taken: history.takenCourses.map(courseOnly),
    planned: history.plannedCourses.map(courseOnly),
    manual: history.confirmedManualItems,
  };
}

const caseNamed = (name: string) => {
  const found = cases.find((item) => item.name === name);
  if (!found) throw new Error(`Missing audit case: ${name}`);
  return found;
};

function expectCase(response: AuditSuccess, item: (typeof cases)[number]) {
  for (const [name, expected] of Object.entries(item.sections ?? {})) {
    expect(response.sections.find((section) => section.name === name), item.name).toMatchObject(expected);
  }
  const lines = response.sections.flatMap((section) => section.lines);
  for (const expected of item.lines ?? []) {
    expect(lines.find((line) => line.id === expected.id), item.name).toMatchObject(expected);
  }
  if (item.freeElectives) expect(response.freeElectives, item.name).toEqual(item.freeElectives);
  if (item.extra) expect(response.extra, item.name).toEqual(item.extra);
  for (const expected of item.checks ?? []) {
    expect(response.checks.find((check) => check.id === expected.id), `${item.name}: ${expected.id}`).toMatchObject(expected);
  }
  if (item.candidateResults) expect(response.candidateResults, item.name).toEqual(item.candidateResults);
}

function setup() {
  const fetchTermText = vi.fn(async (termId: string) =>
    readFileSync(`${webRoot}public/data/${termId}.json`, "utf8"),
  );
  const host = createEngineHost({
    async loadModule() {
      const url = pathToFileURL(`${webRoot}public/engine/goatplan.mjs`).href;
      const engineModule = await import(/* @vite-ignore */ url);
      return await engineModule.default() as GoatplanModule;
    },
    fetchTermText,
  });
  const worker: EngineWorker = {
    onmessage: null,
    onerror: null,
    postMessage(message) {
      void host.handle(message).then((reply) => {
        worker.onmessage?.({ data: reply } as MessageEvent);
      });
    },
    terminate() {},
  };
  return { client: new EngineClient(() => worker), fetchTermText };
}

describe("audit through WebAssembly and EngineClient", () => {
  it("passes the native contract cases without fetching a term and repeats identical answers", async () => {
    const { client, fetchTermText } = setup();
    try {
      for (const item of cases) {
        const response = await client.audit(item.request);
        expect(response.version, item.name).toBe(1);
        expect(JSON.stringify(await client.audit(item.request)), item.name).toBe(JSON.stringify(response));
        if (item.error) {
          expect(response, item.name).toMatchObject({ ok: false, error: item.error });
          continue;
        }
        expect(response.ok, item.name).toBe(true);
        if (!response.ok) continue;
        expect(response.sections).toHaveLength(8);
        expect(response.sections.flatMap((section) => section.lines)).toHaveLength(45);
        expectCase(response, item);
        const assigned = response.sections
          .filter((section) => section.name !== "Free Electives")
          .flatMap((section) => section.lines)
          .flatMap((line) => line.subSlots ? line.subSlots.map((slot) => slot.course) : [line.course])
          .flatMap((course) => course ? [course] : []);
        expect(new Set(assigned).size, item.name).toBe(assigned.length);
        expect(assigned.filter((code) => response.freeElectives.courses.includes(code)), item.name).toEqual([]);
      }
      expect(fetchTermText).not.toHaveBeenCalled();
    } finally {
      client.dispose();
    }
  }, 30_000);

  it.each([
    ["only one of", "only one of a set fills a CS line and the others go to the pool"],
    ["cross-list counted once", "both codes of a cross-list count once"],
    ["cross-list going either way", "a cross-list moves to math when CS is full"],
    ["cross-list going either way", "a cross-list moves to CS when math is full"],
    ["taken before planned", "a planned course swaps a taken course to another line without unseating it"],
    ["taken before planned", "a planned course never unseats a taken course from its only line"],
    ["credits", "two small courses count as one free elective line"],
    ["credits", "zero credit courses count toward nothing"],
    ["WPE slots", "WPE classes fill WPE slots"],
    ["extras", "courses beyond the pool are extra"],
    ["extras", "repeated codes count once and later copies are extra"],
    ["manual items", "confirmed manual items fill their lines"],
    ["area", "a matched CS course meets its area and sits on its area line"],
    ["area", "an area course keeps a CS line ahead of other courses"],
    ["Social Implications", "a non-CS Social Implications course fills a social science line and shows check yourself"],
    ["graduate", "each graduate course counts as one 4000+ course with no bonus"],
    ["science", "science needs 2 courses from one discipline"],
    ["humanities", "unconfirmed humanities depth shows check yourself"],
    ["humanities", "all-language students pass breadth with check yourself"],
    ["humanities", "humanities spanning groupings below 3 courses shows check yourself"],
    ["AP/IB", "more than 1 AP/IB humanities course is flagged"],
    ["residency", "residency shows check yourself once a course is present"],
    ["candidate", "a candidate closes a line by swapping a cross-listed course"],
    ["candidate", "a candidate that only meets a check"],
    ["candidate", "a free-elective-only candidate shows nothing"],
    ["candidate", "a candidate on a full degree shows nothing"],
  ])("runs the %s rule through WebAssembly: %s", async (_rule, name) => {
    const { client } = setup();
    try {
      const item = caseNamed(name);
      const response = await client.audit(item.request);
      expect(response.ok).toBe(true);
      if (response.ok) expectCase(response, item);
    } finally {
      client.dispose();
    }
  }, 30_000);

  it.each(["degree-history-mid.json", "degree-history-complete.json"])(
    "matches the expected answers of %s exactly",
    async (name) => {
      const { client } = setup();
      try {
        const history = readHistory(name);
        const response = await client.audit(historyRequest(history));
        expect(response.ok).toBe(true);
        if (!response.ok) return;

        const lines = response.sections.flatMap((section) => section.lines);
        expect(lines).toHaveLength(Object.keys(history.expectedLines).length);
        for (const line of lines) {
          const expected = history.expectedLines[String(line.id)];
          expect(line.state, `line ${line.id}`).toBe(sheetWord(expected.state));
          if (expected.course !== undefined) expect(line.course, `line ${line.id}`).toBe(expected.course);
          if (expected.subSlots) {
            expect(line.subSlots, `line ${line.id}`).toEqual(
              expected.subSlots.map((slot) => ({ course: slot.course, state: sheetWord(slot.state) })),
            );
          }
        }

        const sectionOrder = ["hua", "wpe", "social-science", "iqp", "free-electives", "cs", "math", "science"];
        response.sections.forEach((section, index) => {
          const { done, planned, total } = history.expectedSections[sectionOrder[index]];
          expect(section, section.name).toMatchObject({ done, planned, total });
        });

        expect(response.checks).toHaveLength(Object.keys(history.expectedChecks).length);
        for (const check of response.checks) {
          const expected = history.expectedChecks[check.id];
          expect(check.state, check.id).toBe(sheetWord(expected.state));
          if (expected.courses) expect(check.courses, check.id).toEqual(expected.courses);
        }

        const pool = history.expectedFreeElectivePool;
        expect(response.freeElectives.courses).toEqual(pool.courses.map((course) => course.code));
        expect(response.freeElectives.creditsDone + response.freeElectives.creditsPlanned).toBe(pool.totalCredits);
        expect(response.extra).toEqual(history.expectedExtra.map((course) => course.code));
      } finally {
        client.dispose();
      }
    },
    30_000,
  );

  it("answers about 580 candidates fast enough not to be noticed", async () => {
    const { client } = setup();
    try {
      const subjects = ["CS", "MA", "PH", "CH", "BB", "GE", "EN", "HI", "PY", "SP", "GOV", "PSY", "ECE", "ME", "RBE", "BME", "AE", "ID", "BUS", "DS"];
      const candidates = Array.from({ length: 580 }, (_, index) => ({
        code: `${subjects[index % subjects.length]} ${1000 + 7 * Math.floor(index / subjects.length)}`,
        credits: 3,
      }));
      for (const name of ["degree-history-mid.json", "degree-history-complete.json"]) {
        const request = { ...historyRequest(readHistory(name)), candidates };
        await client.audit(request);
        let best = Number.POSITIVE_INFINITY;
        for (let run = 0; run < 5; run += 1) {
          const start = performance.now();
          const response = await client.audit(request);
          best = Math.min(best, performance.now() - start);
          expect(response.ok && response.candidateResults).toHaveLength(580);
        }
        console.info(`[timing] ${name}: 580 candidates through WebAssembly in ${best.toFixed(1)} ms`);
        expect(best).toBeLessThan(200);
      }
    } finally {
      client.dispose();
    }
  }, 30_000);

  it("gives the same bytes when the lists arrive in another order", async () => {
    const { client } = setup();
    try {
      for (const item of cases) {
        if (item.error) continue;
        const reversed: AuditRequest = {
          ...item.request,
          taken: item.request.taken ? [...item.request.taken].reverse() : item.request.taken,
          planned: item.request.planned ? [...item.request.planned].reverse() : item.request.planned,
          manual: item.request.manual ? [...item.request.manual].reverse() : item.request.manual,
        };
        expect(JSON.stringify(await client.audit(reversed)), item.name)
          .toBe(JSON.stringify(await client.audit(item.request)));
      }
    } finally {
      client.dispose();
    }
  }, 30_000);

  it("keeps solve and audit results when both are pending", async () => {
    const { client } = setup();
    try {
      const index = JSON.parse(readFileSync(`${webRoot}public/data/index.json`, "utf8")) as TermIndex;
      const termId = index.terms[0].id;
      const term = JSON.parse(readFileSync(`${webRoot}public/data/${termId}.json`, "utf8")) as TermFile;
      expect((await client.loadTerm(termId)).ok).toBe(true);
      const request: AuditRequest = { version: 1, requirements: "cs-2030", taken: [{ code: "CS 210X", credits: 3 }] };
      const solveRequest = { version: 1 as const, courses: [term.courses[0].code], limits: { maxSchedules: 1 } };
      const [audit, solve, repeated] = await Promise.all([
        client.audit(request), client.solve(solveRequest), client.audit(request),
      ]);
      expect(audit.ok).toBe(true);
      expect(solve).toMatchObject({ ok: true, termId });
      expect(repeated).toEqual(audit);
      const [nextSolve, nextAudit] = await Promise.all([client.solve(solveRequest), client.audit(request)]);
      expect(nextSolve).toMatchObject({ ok: true, termId });
      expect(nextAudit).toEqual(audit);
      const cs = (audit as AuditSuccess).sections.find((section) => section.name === "Computer Science");
      expect(cs).toMatchObject({ done: 1, planned: 0 });
    } finally {
      client.dispose();
    }
  }, 30_000);
});

describe("the degree module's requests through WebAssembly", () => {
  const saved = (code: string, extra: Partial<HistoryCourse> = {}): HistoryCourse => ({ code, title: "", credits: 3, inProgress: false, apIb: false, source: "found", ...extra });
  const lineOf = (response: AuditSuccess, id: number) => response.sections.flatMap((section) => section.lines).find((line) => line.id === id);
  const checkOf = (response: AuditSuccess, id: string) => response.checks.find((check) => check.id === id);

  async function ask(history: { courses: HistoryCourse[]; manual?: string[] }, plan: { code: string; credits: number }[] = []) {
    const { client } = setup();
    const response = await client.audit(buildAuditRequest({ manual: [], ...history }, plan));
    if (!response.ok) throw new Error(response.error.code);
    return response;
  }

  it("shows a course from the plan as planned, and removing it undoes that", async () => {
    const plan = [{ code: "CS 2102", credits: 3 }];
    const withPlan = await ask({ courses: [] }, plan);
    expect(withPlan.sections.find((section) => section.name === "Computer Science")).toMatchObject({ done: 0, planned: 1 });
    expect(lineOf(withPlan, 16)).toMatchObject({ state: "empty" });
    expect(lineOf(withPlan, 17)).toMatchObject({ state: "planned", course: "CS 2102" });

    const without = await ask({ courses: [] });
    expect(without.sections.find((section) => section.name === "Computer Science")).toMatchObject({ done: 0, planned: 0 });
  });

  it("counts a course that's both taken and in the plan as taken, with nothing left over", async () => {
    const response = await ask({ courses: [saved("CS 2102")] }, [{ code: "CS 2102", credits: 3 }]);
    expect(lineOf(response, 17)).toMatchObject({ state: "done", course: "CS 2102" });
    expect(response.extra).toEqual([]);
  });

  it("keeps a taken course when the plan has the other code of its cross-list", async () => {
    const response = await ask({ courses: [saved("CS 2022")] }, [{ code: "MA 2201", credits: 3 }]);
    expect(lineOf(response, 17)).toMatchObject({ state: "done", course: "CS 2022" });
    expect(response.sections.find((section) => section.name === "Mathematics")).toMatchObject({ planned: 0 });
    expect(response.extra).toEqual(["MA 2201"]);
  });

  it("holds depth at check until it's confirmed", async () => {
    const courses = [saved("EN 1001"), saved("EN 1002"), saved("EN 2201")];
    const asked = await ask({ courses });
    expect(checkOf(asked, "hua-depth")).toMatchObject({ state: "check", courses: ["EN 1001", "EN 1002", "EN 2201"] });
    const confirmed = await ask({ courses, manual: ["hua-depth-confirmation"] });
    expect(checkOf(confirmed, "hua-depth")).toMatchObject({ state: "met" });
  });

  it("fills an IQP line from its tick box and the free WPE slots from the sports box", async () => {
    const response = await ask({ courses: [saved("WPE 1001", { credits: 1 })], manual: ["iqp-2", "wpe-sports"] });
    expect(lineOf(response, 11)).toMatchObject({ state: "done", course: null });
    expect(lineOf(response, 10)).toMatchObject({ state: "empty" });
    expect(lineOf(response, 7)?.subSlots?.map((slot) => slot.course)).toEqual(["WPE 1001", null, null, null]);
    expect(lineOf(response, 7)).toMatchObject({ state: "done" });
  });
});
