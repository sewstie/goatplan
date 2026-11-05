import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Course } from "@/lib/data/types";
import type { AuditRequest, AuditResponse, AuditSuccess } from "@/lib/engine";
import { MemoryPlanStorage } from "@/lib/plans/testing";
import { createGapSource } from "./courseGaps";
import { AUDIT_DELAY_MS, createDegreeSource, type AuditEngine } from "./degreeSource";
import { typedCourse, writeHistory } from "./history";

const course = (code: string, credits: number | null = 3, level: Course["level"] = "Undergraduate") =>
  ({ code, subject: code.split(" ")[0], title: code, credits, level, description: "", sections: [], options: [] }) as Course;

const answer = (request: AuditRequest): AuditSuccess => ({
  ok: true,
  version: 1,
  sections: [{
    name: "Computer Science",
    done: 0,
    planned: 0,
    total: 18,
    lines: [{ id: 17, label: "Computer Science", state: "empty", course: null }],
  }],
  checks: [{ id: "systems", label: "Systems area", state: "not-met", courses: [] }],
  freeElectives: { creditsDone: 0, creditsPlanned: 0, creditsTotal: 9, courses: [] },
  extra: [],
  candidateResults: (request.candidates ?? []).map(({ code }) => ({
    code,
    closesLines: code === "CS 3013" ? [17] : [],
    closesChecks: code === "CS 3013" ? ["systems"] : [],
  })),
});

const candidatesOnly = (request: AuditRequest) => request.candidates != null;

function setup(audit: AuditEngine["audit"] = async (request) => answer(request)) {
  const storage = new MemoryPlanStorage();
  writeHistory(storage, { courses: [], manual: [] });
  const engine = { audit: vi.fn(audit) };
  const degree = createDegreeSource({ getStorage: () => storage, engine });
  const gaps = createGapSource({ degree, engine });
  const asked = () => engine.audit.mock.calls.map(([request]) => request).filter(candidatesOnly);
  return { engine, degree, gaps, asked };
}

const pause = () => vi.advanceTimersByTimeAsync(AUDIT_DELAY_MS);
const term = [course("CS 3013"), course("BUS 2020")];

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("what the audit is asked", () => {
  it("asks about each undergraduate course in the term, and no others", async () => {
    const { gaps, asked } = setup();
    gaps.subscribe(() => {});
    gaps.setOpenTerm({ courses: [course("CS 3013"), course("CS 502", 3, "Graduate"), course("WPE 1001", 0.25)], planned: [] });
    await pause();
    expect(asked()[0].candidates).toEqual([{ code: "CS 3013", credits: 3 }, { code: "WPE 1001", credits: 0.25 }]);
  });

  it("gives a course with no credits listed the same 3 credits a found course gets", async () => {
    const { gaps, asked } = setup();
    gaps.subscribe(() => {});
    gaps.setOpenTerm({ courses: [course("CS 3013", null)], planned: [] });
    await pause();
    expect(asked()[0].candidates).toEqual([{ code: "CS 3013", credits: 3 }]);
  });

  it("counts in-progress courses and the plan as planned, and a course both taken and planned as taken", async () => {
    const { degree, gaps, asked } = setup();
    degree.addCourse(typedCourse("MA 1021"));
    degree.addCourse({ ...typedCourse("MA 1022"), inProgress: true });
    gaps.subscribe(() => {});
    gaps.setOpenTerm({
      courses: [course("MA 1021"), course("MA 1022"), course("MA 1023", 1.5)],
      planned: ["MA 1021", "MA 1022", "MA 1023"],
    });
    await pause();
    expect(asked()[0].taken).toEqual([{ code: "MA 1021", credits: 3 }]);
    expect(asked()[0].planned).toEqual([{ code: "MA 1022", credits: 3 }, { code: "MA 1023", credits: 1.5 }]);
  });

  it("doesn't ask until a term is open", async () => {
    const { gaps, asked } = setup();
    gaps.subscribe(() => {});
    await pause();
    expect(asked()).toEqual([]);
    expect(gaps.getSnapshot()).toMatchObject({ status: "waiting", closes: null });
  });

  it("doesn't run with nobody listening, and catches up when someone comes back", async () => {
    const { gaps, asked } = setup();
    gaps.setOpenTerm({ courses: term, planned: [] });
    await pause();
    expect(asked()).toEqual([]);
    const stop = gaps.subscribe(() => {});
    stop();
    await pause();
    expect(asked()).toEqual([]);
    gaps.subscribe(() => {});
    await pause();
    expect(asked()).toHaveLength(1);
  });
});

describe("the stored answers", () => {
  it("names the sections and checks a course closes, and leaves out courses that close nothing", async () => {
    const { gaps } = setup();
    gaps.subscribe(() => {});
    gaps.setOpenTerm({ courses: term, planned: [] });
    await pause();
    expect(gaps.getSnapshot()).toMatchObject({
      status: "ready",
      closes: new Map([["CS 3013", ["Computer Science", "Systems"]]]),
    });
  });

  it("names a section once when a course closes several of its lines", async () => {
    const { gaps } = setup(async (request) => ({
      ...answer(request),
      sections: [{ name: "Mathematics", done: 0, planned: 0, total: 7, lines: [
        { id: 34, label: "Mathematics", state: "empty", course: null },
        { id: 38, label: "Mathematics", state: "empty", course: null },
      ] }],
      candidateResults: [{ code: "CS 3013", closesLines: [34, 38], closesChecks: [] }],
    }));
    gaps.subscribe(() => {});
    gaps.setOpenTerm({ courses: term, planned: [] });
    await pause();
    expect(gaps.getSnapshot().closes?.get("CS 3013")).toEqual(["Mathematics"]);
  });

  it("gives the same snapshot until something changes, and tells listeners when it does", async () => {
    const { gaps } = setup();
    const listener = vi.fn();
    gaps.subscribe(listener);
    gaps.setOpenTerm({ courses: term, planned: [] });
    await pause();
    const before = gaps.getSnapshot();
    expect(gaps.getSnapshot()).toBe(before);
    listener.mockClear();
    gaps.setOpenTerm({ courses: term, planned: ["CS 3013"] });
    expect(listener).toHaveBeenCalled();
    expect(gaps.getSnapshot()).not.toBe(before);
  });
});

describe("when answers go stale", () => {
  it("asks again when the history changes, keeping the last answer until the new one comes", async () => {
    const { degree, gaps, asked } = setup();
    gaps.subscribe(() => {});
    gaps.setOpenTerm({ courses: term, planned: [] });
    await pause();
    const closes = gaps.getSnapshot().closes;
    degree.addCourse(typedCourse("MA 1021"));
    expect(gaps.getSnapshot()).toMatchObject({ status: "waiting", closes });
    await pause();
    expect(asked()).toHaveLength(2);
    expect(asked()[1].taken).toEqual([{ code: "MA 1021", credits: 3 }]);
    expect(gaps.getSnapshot().status).toBe("ready");
  });

  it("notices a history changed while nobody was listening", async () => {
    const { degree, gaps, asked } = setup();
    const stop = gaps.subscribe(() => {});
    gaps.setOpenTerm({ courses: term, planned: [] });
    await pause();
    stop();
    degree.addCourse(typedCourse("MA 1021"));
    await pause();
    expect(asked()).toHaveLength(1);
    gaps.subscribe(() => {});
    expect(gaps.getSnapshot().status).toBe("waiting");
    await pause();
    expect(asked()).toHaveLength(2);
  });

  it("asks again when the plan or the open term changes, and not when nothing did", async () => {
    const { gaps, asked } = setup();
    gaps.subscribe(() => {});
    gaps.setOpenTerm({ courses: term, planned: ["CS 3013"] });
    await pause();
    gaps.setOpenTerm({ courses: term, planned: ["CS 3013"] });
    await pause();
    expect(asked()).toHaveLength(1);
    gaps.setOpenTerm({ courses: term, planned: [] });
    await pause();
    expect(asked()).toHaveLength(2);
    gaps.setOpenTerm({ courses: [course("MA 1021")], planned: [] });
    await pause();
    expect(asked()).toHaveLength(3);
    expect(asked()[2].candidates).toEqual([{ code: "MA 1021", credits: 3 }]);
  });

  it("waits a short pause and asks once for several quick changes", async () => {
    const { gaps, asked } = setup();
    gaps.subscribe(() => {});
    gaps.setOpenTerm({ courses: term, planned: ["CS 3013"] });
    gaps.setOpenTerm({ courses: term, planned: ["CS 3013", "BUS 2020"] });
    await vi.advanceTimersByTimeAsync(AUDIT_DELAY_MS - 1);
    expect(asked()).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect(asked()).toHaveLength(1);
    expect(asked()[0].planned).toHaveLength(2);
  });

  it("drops an older answer that arrives after a newer change", async () => {
    const replies: ((response: AuditResponse) => void)[] = [];
    const { gaps, asked } = setup((request) => candidatesOnly(request) ? new Promise((resolve) => replies.push(resolve)) : Promise.resolve(answer(request)));
    gaps.subscribe(() => {});
    gaps.setOpenTerm({ courses: term, planned: [] });
    await pause();
    gaps.setOpenTerm({ courses: [course("MA 1021")], planned: [] });
    await pause();
    replies[1](answer(asked()[1]));
    await vi.advanceTimersByTimeAsync(0);
    replies[0](answer(asked()[0]));
    await vi.advanceTimersByTimeAsync(0);
    expect(gaps.getSnapshot()).toMatchObject({ status: "ready", closes: new Map() });
  });
});

describe("a failed audit", () => {
  it("clears the answers when the engine throws, and a later change tries again", async () => {
    let failing = true;
    const { gaps } = setup(async (request) => {
      if (failing) throw new Error("no engine");
      return answer(request);
    });
    gaps.subscribe(() => {});
    gaps.setOpenTerm({ courses: term, planned: [] });
    await pause();
    expect(gaps.getSnapshot()).toMatchObject({ status: "failed", closes: null });
    failing = false;
    gaps.setOpenTerm({ courses: term, planned: ["CS 3013"] });
    await pause();
    expect(gaps.getSnapshot().status).toBe("ready");
  });

  it("treats an engine error answer as failed", async () => {
    const { gaps } = setup(async () => ({ ok: false, version: 1, error: { code: "badRequest", message: "nope", detail: "candidates" } }));
    gaps.subscribe(() => {});
    gaps.setOpenTerm({ courses: term, planned: [] });
    await pause();
    expect(gaps.getSnapshot()).toMatchObject({ status: "failed", closes: null });
  });

  it("tries again when someone comes back", async () => {
    let failing = true;
    const { gaps } = setup(async (request) => {
      if (failing) throw new Error("no engine");
      return answer(request);
    });
    const stop = gaps.subscribe(() => {});
    gaps.setOpenTerm({ courses: term, planned: [] });
    await pause();
    stop();
    failing = false;
    gaps.subscribe(() => {});
    await pause();
    expect(gaps.getSnapshot().status).toBe("ready");
  });
});
