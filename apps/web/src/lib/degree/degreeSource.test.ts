import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuditResponse, AuditSuccess } from "@/lib/engine";
import { MemoryPlanStorage } from "@/lib/plans/testing";
import { AUDIT_DELAY_MS, createDegreeSource, type AuditEngine } from "./degreeSource";
import { foundCourse, HISTORY_KEY, parseHistoryFile, typedCourse, writeHistory } from "./history";
import cs from "./sheets/cs-2030.json";
import type { TrackingSheet } from "./sheets";
import fixture from "../../../e2e/fixtures/degree-major-sheet.json";
import { createGapSource } from "./courseGaps";

const answer = (done: number): AuditSuccess => ({
  ok: true,
  version: 1,
  sections: [{ name: "Mathematics", done, planned: 0, total: 7, lines: [] }],
  checks: [],
  freeElectives: { creditsDone: 0, creditsPlanned: 0, creditsTotal: 9, courses: [] },
  extra: [],
  candidateResults: [],
});

function setup(audit: AuditEngine["audit"] = async (request) => answer(request.taken?.length ?? 0)) {
  const storage = new MemoryPlanStorage();
  const engine = { audit: vi.fn(audit) };
  const source = createDegreeSource({ getStorage: () => storage, engine });
  const stop = source.subscribe(() => {});
  return { storage, engine, source, stop };
}

const pause = async () => {
  await vi.advanceTimersByTimeAsync(AUDIT_DELAY_MS);
  await vi.dynamicImportSettled();
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("the history", () => {
  it("distinguishes a first visit from a legacy CS history and backs up the migrated selection", () => {
    const storage = new MemoryPlanStorage();
    const engine = { audit: async () => answer(0) };
    const fresh = createDegreeSource({ getStorage: () => storage, engine });
    expect(fresh.getSnapshot().selectedSheetId).toBeNull();
    writeHistory(storage, { courses: [typedCourse("MA 1021")], manual: ["iqp-1"], pins: [{ code: "MA 1021", line: 34 }] });
    const legacy = createDegreeSource({ getStorage: () => storage, engine });
    expect(legacy.getSnapshot().selectedSheetId).toBe("cs-2030");
    expect(JSON.parse(legacy.exportHistory())).toMatchObject({ sheetId: "cs-2030", sheets: { "cs-2030": { manual: ["iqp-1"], pins: [{ code: "MA 1021", line: 34 }] } } });
  });
  it("switches independent sheets while sharing courses and restoring each sheet's pins and confirmations", async () => {
    const storage = new MemoryPlanStorage();
    const second = fixture as TrackingSheet;
    const source = createDegreeSource({ getStorage: () => storage, engine: { audit: async () => answer(0) }, loadSheet: async (id) => id === second.id ? second : cs as TrackingSheet });
    source.subscribe(() => {});
    expect(source.selectSheet("cs-2030")).toBe(true);
    source.addCourse(typedCourse("MA 1021"));
    source.setPin({ code: "MA 1021", line: 34 });
    source.setManualItem("iqp-1", true);
    source.selectSheet("fixture-2030");
    await pause();
    expect(source.getSnapshot()).toMatchObject({ sheet: { id: "fixture-2030" }, history: { courses: [typedCourse("MA 1021")], manual: [] } });
    expect(source.getSnapshot().history.pins ?? []).toEqual([]);
    source.setManualItem("project", true);
    source.setPin({ code: "MA 1021", line: 35 });
    source.selectSheet("cs-2030");
    await pause();
    expect(source.getSnapshot().history.manual).toEqual(["iqp-1"]);
    expect(source.getSnapshot().history.pins).toEqual([{ code: "MA 1021", line: 34 }]);
    source.selectSheet("fixture-2030");
    expect(source.getSnapshot().history.manual).toEqual(["project"]);
    expect(source.getSnapshot().history.pins).toEqual([{ code: "MA 1021", line: 35 }]);
  });

  it("audits against the loaded sheet document", async () => {
    let sheet: unknown;
    const { source, stop } = setup(async (request) => {
      sheet = request.sheet;
      return answer(0);
    });
    await pause();
    expect(sheet).toMatchObject({ id: "cs-2030", major: "Computer Science", classYear: 2030, totalUnits: 15 });
    expect(source.getSnapshot().audit.status).toBe("ready");
    stop();
  });

  it("stores an added course and lists it", () => {
    const { source, storage } = setup();
    expect(source.addCourse(typedCourse("CS 9999"))).toBe("added");
    expect(source.getSnapshot().history.courses.map((course) => course.code)).toEqual(["CS 9999"]);
    expect(storage.getItem(HISTORY_KEY)).toContain("CS 9999");
  });

  it("says when a course is already there and keeps one copy", () => {
    const { source } = setup();
    source.addCourse(typedCourse("CS 9999"));
    expect(source.addCourse(typedCourse("CS 9999"))).toBe("duplicate");
    expect(source.getSnapshot().history.courses).toHaveLength(1);
  });

  it("removes a course", () => {
    const { source, storage } = setup();
    source.addCourse(typedCourse("CS 9999"));
    source.addCourse(typedCourse("MA 1021"));
    expect(source.removeCourse("CS 9999")).toBe(true);
    expect(source.getSnapshot().history.courses.map((course) => course.code)).toEqual(["MA 1021"]);
    expect(storage.getItem(HISTORY_KEY)).not.toContain("CS 9999");
  });

  it("reports a course the browser couldn't keep, and keeps it for this open page", () => {
    const source = createDegreeSource({ getStorage: () => null, engine: { audit: vi.fn(async () => answer(0)) } });
    expect(source.addCourse(typedCourse("CS 9999"))).toBe("unsaved");
    expect(source.getSnapshot().history.courses.map((course) => course.code)).toEqual(["CS 9999"]);
    expect(source.getSnapshot().unsaved).toBe(true);
  });

  it("saves the open page's changes once the browser takes them", () => {
    const { source, storage } = setup();
    const setItem = storage.setItem.bind(storage);
    storage.setItem = () => {
      throw new Error("full");
    };
    source.addCourse(typedCourse("CS 9999"));
    expect(source.saveAgain()).toBe(false);
    storage.setItem = setItem;
    expect(source.saveAgain()).toBe(true);
    expect(source.getSnapshot().unsaved).toBe(false);
    expect(source.exportHistory()).toContain("CS 9999");
    expect(storage.getItem(HISTORY_KEY)).toContain("CS 9999");
  });

  it("rejects a course with a broken code", () => {
    const { source } = setup();
    expect(source.addCourse({ ...typedCourse("CS 9999"), code: "not a code" })).toBe("invalid");
    expect(source.getSnapshot().history.courses).toEqual([]);
  });

  it("tells listeners about a change, and gives the same snapshot until then", () => {
    const { source } = setup();
    const listener = vi.fn();
    source.subscribe(listener);
    const before = source.getSnapshot();
    expect(source.getSnapshot()).toBe(before);
    source.addCourse(typedCourse("CS 9999"));
    expect(listener).toHaveBeenCalled();
    expect(source.getSnapshot()).not.toBe(before);
  });

  it("follows a change from another tab", async () => {
    const { source, storage, engine } = setup();
    await pause();
    engine.audit.mockClear();
    storage.setItem(HISTORY_KEY, JSON.stringify({ version: 1, courses: [typedCourse("CS 9999")], manual: [] }));
    window.dispatchEvent(new StorageEvent("storage", { key: HISTORY_KEY }));
    expect(source.getSnapshot().history.courses).toHaveLength(1);
    await pause();
    expect(engine.audit).toHaveBeenCalledTimes(1);
  });

  it("ignores other keys changing in another tab", async () => {
    const { source, engine } = setup();
    await pause();
    engine.audit.mockClear();
    const before = source.getSnapshot();
    window.dispatchEvent(new StorageEvent("storage", { key: "goatplan:plans:v1:plan:1" }));
    expect(source.getSnapshot()).toBe(before);
    await pause();
    expect(engine.audit).not.toHaveBeenCalled();
  });

  it("marks a damaged history, and a good write clears the mark", () => {
    const storage = new MemoryPlanStorage();
    storage.setItem(HISTORY_KEY, "{not json");
    const source = createDegreeSource({ getStorage: () => storage, engine: { audit: vi.fn(async () => answer(0)) } });
    expect(source.getSnapshot().damaged).toBe(true);
    source.addCourse(typedCourse("CS 9999"));
    expect(source.getSnapshot().damaged).toBe(false);
  });
});

describe("adding several courses", () => {
  it("adds them all in one write and audits once", async () => {
    const { source, storage, engine } = setup();
    await pause();
    engine.audit.mockClear();
    const write = vi.spyOn(storage, "setItem");
    expect(source.addCourses([typedCourse("CS 9999"), { ...typedCourse("MA 1021"), status: "planned" }])).toEqual({ status: "added", added: 2 });
    expect(write).toHaveBeenCalledTimes(1);
    await pause();
    expect(engine.audit).toHaveBeenCalledTimes(1);
    expect(engine.audit.mock.calls[0][0].taken).toEqual([{ code: "CS 9999", credits: 3 }]);
    expect(engine.audit.mock.calls[0][0].planned).toEqual([{ code: "MA 1021", credits: 3 }]);
  });

  it("skips courses already there, or listed twice, and leaves the old copy alone", () => {
    const { source } = setup();
    source.addCourse({ ...typedCourse("CS 9999"), term: "A 2026" });
    expect(source.addCourses([typedCourse("CS 9999"), typedCourse("MA 1021"), typedCourse("MA 1021")])).toEqual({ status: "added", added: 1 });
    expect(source.getSnapshot().history.courses.map((course) => [course.code, course.term])).toEqual([["CS 9999", "A 2026"], ["MA 1021", undefined]]);
  });

  it("adds nothing if one of them is broken", () => {
    const { source } = setup();
    expect(source.addCourses([typedCourse("CS 9999"), { ...typedCourse("MA 1021"), code: "nope" }])).toEqual({ status: "invalid", added: 0 });
    expect(source.getSnapshot().history.courses).toEqual([]);
  });

  it("reports a list the browser couldn't keep", () => {
    const source = createDegreeSource({ getStorage: () => null, engine: { audit: vi.fn(async () => answer(0)) } });
    expect(source.addCourses([typedCourse("CS 9999")])).toEqual({ status: "unsaved", added: 0 });
    expect(source.getSnapshot().unsaved).toBe(true);
  });
});

describe("editing a course", () => {
  function withCourses() {
    const made = setup();
    made.source.addCourse(typedCourse("EN 1000"));
    made.source.addCourse(foundCourse({ code: "MA 1021", title: "Calculus I", credits: 3 }));
    return made;
  }
  const saved = (source: ReturnType<typeof setup>["source"], code: string) => source.getSnapshot().history.courses.find((course) => course.code === code);

  it("changes credits and keeps the rest", () => {
    const { source } = withCourses();
    expect(source.editCourse("MA 1021", { credits: 1.5 })).toBe("saved");
    expect(saved(source, "MA 1021")).toEqual({ ...foundCourse({ code: "MA 1021", title: "Calculus I", credits: 3 }), credits: 1.5 });
  });

  it("adds, tidies and clears a term", () => {
    const { source } = withCourses();
    source.editCourse("MA 1021", { term: "  A 2026 " });
    expect(saved(source, "MA 1021")?.term).toBe("A 2026");
    source.editCourse("MA 1021", { term: "   " });
    expect(saved(source, "MA 1021")).not.toHaveProperty("term");
  });

  it.each([
    ["credits", { credits: -1 }],
    ["credits", { credits: Number.NaN }],
    ["credits", { credits: 31 }],
    ["a term", { term: "x".repeat(41) }],
  ])("refuses bad %s and keeps the course as it was", (_name, changes) => {
    const { source } = withCourses();
    const before = saved(source, "MA 1021");
    expect(source.editCourse("MA 1021", changes)).toBe("invalid");
    expect(saved(source, "MA 1021")).toEqual(before);
  });

  it("only lets a typed course be marked AP/IB", () => {
    const { source } = withCourses();
    expect(source.editCourse("EN 1000", { apIb: true })).toBe("saved");
    expect(source.editCourse("MA 1021", { apIb: true })).toBe("invalid");
    expect(saved(source, "EN 1000")?.apIb).toBe(true);
    expect(saved(source, "MA 1021")?.apIb).toBe(false);
  });

  it("lets a found course from an imported file be unmarked", () => {
    const { source } = setup();
    source.replaceHistory({ courses: [{ ...foundCourse({ code: "MA 1021", title: "", credits: 3 }), apIb: true }], manual: [] });
    expect(source.editCourse("MA 1021", { apIb: false })).toBe("saved");
    expect(saved(source, "MA 1021")?.apIb).toBe(false);
  });

  it("can't change a course that isn't there, or its code", () => {
    const { source } = withCourses();
    expect(source.editCourse("CS 1234", { credits: 1 })).toBe("invalid");
    expect(source.getSnapshot().history.courses).toHaveLength(2);
  });

  it("reports a change the browser couldn't keep, and keeps it for this open page", () => {
    const { source, storage } = withCourses();
    storage.setItem = () => {
      throw new Error("full");
    };
    expect(source.editCourse("MA 1021", { status: "planned" })).toBe("unsaved");
    expect(saved(source, "MA 1021")?.status).toBe("planned");
    expect(source.getSnapshot().unsaved).toBe(true);
  });

  it("sends in-progress and AP/IB changes to the audit", async () => {
    const { source, engine } = withCourses();
    await pause();
    engine.audit.mockClear();
    source.editCourse("MA 1021", { status: "planned" });
    await pause();
    expect(engine.audit.mock.lastCall?.[0].planned).toEqual([{ code: "MA 1021", credits: 3 }]);
    expect(engine.audit.mock.lastCall?.[0].taken).toEqual([{ code: "EN 1000", credits: 3 }]);

    source.editCourse("EN 1000", { apIb: true, credits: 1.5 });
    await pause();
    expect(engine.audit.mock.lastCall?.[0].taken).toEqual([{ code: "EN 1000", credits: 1.5, apIb: true }]);

    source.editCourse("MA 1021", { status: "taken" });
    await pause();
    expect(engine.audit.mock.lastCall?.[0].planned).toEqual([]);
    expect(engine.audit.mock.lastCall?.[0].taken).toContainEqual({ code: "MA 1021", credits: 3 });
  });
});

describe("export and import", () => {
  it.each([
    { sheetId: 42, sheets: {} },
    { sheetId: "../cs", sheets: {} },
    { sheetId: "cs-2030", sheets: { "cs-2030": { manual: [42] } } },
    { sheetId: "cs-2030", sheets: { "cs-2030": { manual: [], pins: [{ code: "MA 1021", line: "34" }] } } },
    { sheetId: "cs-2030", sheets: { "cs-2030": { manual: [], pins: [{ code: "MA 1021", line: -1 }] } } },
    { sheetId: "cs-2030", sheets: [] },
  ])("rejects a backup with invalid sheet state: %j", (state) => {
    expect(parseHistoryFile(JSON.stringify({ version: 1, courses: [], manual: [], ...state }))).toEqual({ ok: false, reason: "broken" });
  });
  it("merges a complete backup and restores the selected sheet and all sheet state after reload", () => {
    const { source } = setup();
    source.selectSheet("cs-2030");
    source.addCourse(typedCourse("MA 1021"));
    source.setManualItem("iqp-1", true);
    source.setPin({ code: "MA 1021", line: 34 });
    source.selectSheet("fixture-2030");
    source.setManualItem("project", true);
    const parsed = parseHistoryFile(source.exportHistory());
    if (!parsed.ok) throw new Error("the backup should be valid");
    const other = setup();
    other.source.addCourse(typedCourse("CS 1101"));
    other.source.mergeHistory(parsed.history);
    const reloaded = createDegreeSource({ getStorage: () => other.storage, engine: other.engine });
    expect(reloaded.getSnapshot().selectedSheetId).toBe("fixture-2030");
    expect(reloaded.getSnapshot().history.manual).toEqual(["project"]);
    expect(reloaded.getSnapshot().history.courses.map(({ code }) => code)).toEqual(["CS 1101", "MA 1021"]);
    reloaded.selectSheet("cs-2030");
    expect(reloaded.getSnapshot().history.manual).toEqual(["iqp-1"]);
    expect(reloaded.getSnapshot().history.pins).toEqual([{ code: "MA 1021", line: 34 }]);
  });
  it("restores an identical history on another device", () => {
    const { source } = setup();
    source.addCourse(foundCourse({ code: "MA 1021", title: "Calculus I", credits: 3 }));
    source.addCourse({ ...typedCourse("EN 1000"), apIb: true, term: "AP" });
    source.editCourse("MA 1021", { status: "planned", credits: 1.5, term: "A 2026" });
    const before = source.getSnapshot().history;

    const parsed = parseHistoryFile(source.exportHistory());
    const other = setup();
    if (!parsed.ok) throw new Error("the export should read back");
    expect(other.source.replaceHistory(parsed.history)).toBe(true);
    expect(other.source.getSnapshot().history).toMatchObject(before);
    expect(other.source.exportHistory()).toBe(source.exportHistory());
  });

  it("exports what's stored right now, including another tab's change", () => {
    const { source, storage } = setup();
    writeHistory(storage, { courses: [typedCourse("CS 9999")], manual: ["iqp-1"] });
    const file = JSON.parse(source.exportHistory());
    expect(file.courses[0].code).toBe("CS 9999");
    expect(file.manual).toEqual(["iqp-1"]);
  });

  it("replacing a history audits the new one and clears a damaged mark", async () => {
    const { source, storage, engine } = setup();
    storage.setItem(HISTORY_KEY, "{not json");
    window.dispatchEvent(new StorageEvent("storage", { key: HISTORY_KEY }));
    expect(source.getSnapshot().damaged).toBe(true);
    await pause();
    engine.audit.mockClear();
    source.replaceHistory({ courses: [typedCourse("CS 9999")], manual: [] });
    expect(source.getSnapshot().damaged).toBe(false);
    await pause();
    expect(engine.audit).toHaveBeenCalledTimes(1);
  });

  it("says so when the browser won't take the new history", () => {
    const { source, storage } = setup();
    source.addCourse(typedCourse("CS 9999"));
    storage.setItem = () => {
      throw new Error("full");
    };
    expect(source.replaceHistory({ courses: [], manual: [] })).toBe(false);
    expect(source.getSnapshot().unsaved).toBe(true);
  });

  it("merges a file into what's here, skipping courses it already has", () => {
    const { source } = setup();
    source.addCourse(typedCourse("CS 9999"));
    expect(source.mergeHistory({ courses: [{ ...typedCourse("CS 9999"), credits: 1 }, typedCourse("MA 1021")], manual: ["iqp-1"], pins: [{ code: "MA 1021", line: 34 }] })).toBe(true);
    const { history } = source.getSnapshot();
    expect(history.courses.map((course) => [course.code, course.credits])).toEqual([["CS 9999", 3], ["MA 1021", 3]]);
    expect(history.manual).toEqual(["iqp-1"]);
    expect(history.pins).toEqual([{ code: "MA 1021", line: 34 }]);
  });
});

describe("pins", () => {
  it("removing a shared course removes its pins on every sheet", () => {
    const { source } = setup();
    source.selectSheet("cs-2030");
    source.addCourse(typedCourse("MA 1021"));
    source.setPin({ code: "MA 1021", line: 34 });
    source.selectSheet("fixture-2030");
    source.removeCourse("MA 1021");
    source.selectSheet("cs-2030");
    expect(source.getSnapshot().history.pins ?? []).toEqual([]);
  });
  it("keeps one pin per course and per line", () => {
    const { source } = setup();
    source.setPin({ code: "CS 2022", line: 38 });
    source.setPin({ code: "CS 2022", line: 18 });
    source.setPin({ code: "MA 1021", line: 18 });
    expect(source.getSnapshot().history.pins).toEqual([{ code: "MA 1021", line: 18 }]);
  });

  it("removes a course's pin along with the course", () => {
    const { source } = setup();
    source.addCourse(typedCourse("CS 2022"));
    source.setPin({ code: "CS 2022", line: 38 });
    source.removeCourse("CS 2022");
    expect(source.getSnapshot().history).toEqual({ courses: [], manual: [] });
  });

  it("clears them all and takes them out of the export only when there are none", () => {
    const { source } = setup();
    source.setPin({ code: "CS 2022", line: 38 });
    expect(source.exportHistory()).toContain('"pins"');
    source.clearPins();
    expect(source.exportHistory()).not.toContain('"pins"');
  });
});

describe("the audit", () => {
  it("clears search badges when another tab removes the saved selection", async () => {
    const { source, storage, engine } = setup();
    source.selectSheet("cs-2030");
    const gaps = createGapSource({ degree: source, engine });
    gaps.subscribe(() => {});
    gaps.setOpenTerm({ courses: [], planned: [] });
    await pause();
    expect(gaps.getSnapshot().closes).not.toBeNull();
    storage.removeItem(HISTORY_KEY);
    window.dispatchEvent(new StorageEvent("storage", { key: HISTORY_KEY }));
    expect(gaps.getSnapshot()).toMatchObject({ status: "waiting", closes: null });
  });
  it("waits for a selection before downloading a sheet for search", async () => {
    const storage = new MemoryPlanStorage();
    const engine = { audit: vi.fn(async () => answer(0)) };
    const source = createDegreeSource({ getStorage: () => storage, engine, requireSelection: true });
    const gaps = createGapSource({ degree: source, engine });
    gaps.subscribe(() => {});
    gaps.setOpenTerm({ courses: [], planned: [] });
    await pause();
    expect(engine.audit).not.toHaveBeenCalled();
  });
  it("clears search badges while another major is being audited", async () => {
    const { source, engine } = setup();
    source.selectSheet("cs-2030");
    const gaps = createGapSource({ degree: source, engine });
    gaps.subscribe(() => {});
    gaps.setOpenTerm({ courses: [], planned: [] });
    await pause();
    expect(gaps.getSnapshot().closes).not.toBeNull();
    source.selectSheet("fixture-2030");
    expect(gaps.getSnapshot()).toMatchObject({ status: "waiting", closes: null });
  });
  it("uses the selected sheet for course-search audits too", async () => {
    const storage = new MemoryPlanStorage();
    const requests: string[] = [];
    const engine = { audit: async (request: Parameters<AuditEngine["audit"]>[0]) => { requests.push(request.requirements!); return answer(0); } };
    const source = createDegreeSource({ getStorage: () => storage, engine, loadSheet: async () => fixture as TrackingSheet });
    source.subscribe(() => {});
    source.selectSheet("fixture-2030");
    await pause();
    const gaps = createGapSource({ degree: source, engine });
    gaps.subscribe(() => {});
    gaps.setOpenTerm({ courses: [], planned: [] });
    await pause();
    expect(requests).toEqual(["fixture-2030", "fixture-2030"]);
  });
  it("drops a pending answer from the previous major", async () => {
    const replies: ((response: AuditResponse) => void)[] = [];
    const requests: string[] = [];
    const storage = new MemoryPlanStorage();
    const source = createDegreeSource({ getStorage: () => storage, loadSheet: async (id) => id === fixture.id ? fixture as TrackingSheet : cs as TrackingSheet, engine: { audit: (request) => {
      requests.push(request.requirements!);
      return new Promise((resolve) => replies.push(resolve));
    } } });
    source.subscribe(() => {});
    source.selectSheet("cs-2030");
    await pause();
    source.selectSheet("fixture-2030");
    await pause();
    expect(requests).toEqual(["cs-2030", "fixture-2030"]);
    replies[1](answer(2));
    await vi.advanceTimersByTimeAsync(0);
    replies[0](answer(1));
    await vi.advanceTimersByTimeAsync(0);
    expect(source.getSnapshot().audit).toEqual({ status: "ready", result: answer(2) });
  });
  it("clears the old sheet immediately when a replacement backup selects another major", async () => {
    const { source } = setup();
    await pause();
    source.replaceHistory({ courses: [], manual: [], sheetId: "fixture-2030" });
    expect(source.getSnapshot().sheet).toBeNull();
    expect(source.getSnapshot().audit).toEqual({ status: "waiting", result: null });
  });
  it("starts waiting, then shows the engine's answer", async () => {
    const { source } = setup();
    expect(source.getSnapshot().audit).toEqual({ status: "waiting", result: null });
    await pause();
    expect(source.getSnapshot().audit).toEqual({ status: "ready", result: answer(0) });
  });

  it("doesn't run with nobody listening", async () => {
    const engine = { audit: vi.fn(async () => answer(0)) };
    createDegreeSource({ getStorage: () => new MemoryPlanStorage(), engine });
    await pause();
    expect(engine.audit).not.toHaveBeenCalled();
  });

  it("waits a short pause and asks once for several quick changes", async () => {
    const { source, engine } = setup();
    await pause();
    engine.audit.mockClear();
    source.addCourse(typedCourse("CS 9999"));
    source.addCourse(typedCourse("MA 1021"));
    await vi.advanceTimersByTimeAsync(AUDIT_DELAY_MS - 1);
    expect(engine.audit).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await vi.dynamicImportSettled();
    expect(engine.audit).toHaveBeenCalledTimes(1);
    expect(engine.audit.mock.calls[0][0].taken).toHaveLength(2);
  });

  it("keeps the last answer on screen while the next one is coming", async () => {
    const { source } = setup();
    await pause();
    source.addCourse(typedCourse("CS 9999"));
    expect(source.getSnapshot().audit).toEqual({ status: "waiting", result: answer(0) });
    await pause();
    expect(source.getSnapshot().audit).toEqual({ status: "ready", result: answer(1) });
  });

  it("drops an older answer that arrives after a newer change", async () => {
    const replies: ((response: AuditResponse) => void)[] = [];
    const { source, engine } = setup(() => new Promise((resolve) => replies.push(resolve)));
    await pause();
    source.addCourse(typedCourse("CS 9999"));
    await pause();
    expect(engine.audit).toHaveBeenCalledTimes(2);
    replies[1](answer(1));
    await vi.advanceTimersByTimeAsync(0);
    replies[0](answer(0));
    await vi.advanceTimersByTimeAsync(0);
    expect(source.getSnapshot().audit).toEqual({ status: "ready", result: answer(1) });
  });

  it("reports a failed audit, and trying again works", async () => {
    let failing = true;
    const { source } = setup(async () => {
      if (failing) throw new Error("no engine");
      return answer(0);
    });
    await pause();
    expect(source.getSnapshot().audit).toEqual({ status: "failed", result: null });
    failing = false;
    source.retryAudit();
    await pause();
    expect(source.getSnapshot().audit.status).toBe("ready");
  });

  it("reports an engine error answer as failed", async () => {
    const { source } = setup(async () => ({
      ok: false,
      version: 1,
      error: { code: "badRequest", message: "nope", detail: "taken" },
    }));
    await pause();
    expect(source.getSnapshot().audit).toEqual({ status: "failed", result: null });
  });

  it("stops its timer when the last listener leaves, and runs again when one comes back", async () => {
    const { source, engine, stop } = setup();
    stop();
    await pause();
    expect(engine.audit).not.toHaveBeenCalled();
    source.subscribe(() => {});
    await pause();
    expect(engine.audit).toHaveBeenCalledTimes(1);
  });
});

describe("tick boxes", () => {
  it("stores a tick, sends it to the audit and keeps it after a reload", async () => {
    const { source, storage, engine } = setup();
    expect(source.setManualItem("iqp-1", true)).toBe(true);
    expect(source.getSnapshot().history.manual).toEqual(["iqp-1"]);
    await pause();
    expect(engine.audit.mock.calls.at(-1)?.[0].manual).toEqual(["iqp-1"]);

    const reloaded = createDegreeSource({ getStorage: () => storage, engine });
    expect(reloaded.getSnapshot().history.manual).toEqual(["iqp-1"]);
  });

  it("removes an unticked item and leaves the others", () => {
    const { source } = setup();
    source.setManualItem("iqp-1", true);
    source.setManualItem("mqp-2", true);
    source.setManualItem("iqp-1", false);
    expect(source.getSnapshot().history.manual).toEqual(["mqp-2"]);
  });

  it("keeps one copy when an item is ticked twice", () => {
    const { source } = setup();
    source.setManualItem("iqp-1", true);
    source.setManualItem("iqp-1", true);
    expect(source.getSnapshot().history.manual).toEqual(["iqp-1"]);
  });

  it("keeps the courses when a box is ticked", () => {
    const { source } = setup();
    source.addCourse(typedCourse("CS 9999"));
    source.setManualItem("iqp-1", true);
    expect(source.getSnapshot().history.courses).toHaveLength(1);
  });

  it("reports a tick the browser couldn't keep, and keeps it for this open page", () => {
    const source = createDegreeSource({ getStorage: () => null, engine: { audit: vi.fn(async () => answer(0)) } });
    expect(source.setManualItem("iqp-1", true)).toBe(false);
    expect(source.getSnapshot().history.manual).toEqual(["iqp-1"]);
    expect(source.getSnapshot().unsaved).toBe(true);
  });
});

describe("planner independence", () => {
  it("ignores planner storage changes and only audits explicit history", async () => {
    const { source, engine } = setup();
    source.addCourse({ ...typedCourse("MA 1021"), status: "planned", term: "A Term 2030" });
    await pause();
    expect(engine.audit.mock.calls.at(-1)?.[0].planned).toEqual([{ code: "MA 1021", credits: 3 }]);
    engine.audit.mockClear();
    for (const key of ["goatplan:draft:v1:2027-C", "goatplan:term:v1"]) window.dispatchEvent(new StorageEvent("storage", { key }));
    await pause();
    expect(engine.audit).not.toHaveBeenCalled();
  });
});
