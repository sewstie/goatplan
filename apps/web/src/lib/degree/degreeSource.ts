import { getEngineClient, type AuditSuccess, type EngineClient } from "@/lib/engine";
import type { AuditCourse } from "@/lib/engine/types";
import {
  browserHistoryStorage,
  buildAuditRequest,
  HISTORY_KEY,
  parseCourse,
  readHistory,
  serializeHistory,
  writeHistory,
  type DegreeHistory,
  type HistoryCourse,
  type HistoryStorage,
  type LinePin,
  type StoredHistory,
} from "./history";
import { browserOpenPlan, isPlanKey, type OpenPlan } from "./openPlan";
import { DEFAULT_SHEET_ID, type TrackingSheet } from "./sheets";
import { loadRequirements } from "./requirements";

export const AUDIT_DELAY_MS = 200;

export type AuditEngine = Pick<EngineClient, "audit">;

export interface AuditState {
  status: "waiting" | "ready" | "failed";
  result: AuditSuccess | null;
}

export interface DegreeSnapshot {
  sheet: TrackingSheet | null;
  history: DegreeHistory;
  damaged: boolean;
  audit: AuditState;
  planCourses: AuditCourse[];
  unsaved: boolean;
}

export type AddResult = "added" | "duplicate" | "invalid" | "unsaved";

export interface AddManyResult {
  status: "added" | "invalid" | "unsaved";
  added: number;
}

export type CourseChanges = Partial<Pick<HistoryCourse, "credits" | "term" | "inProgress" | "apIb" | "creditSource">>;

export type EditResult = "saved" | "invalid" | "unsaved";

export interface DegreeSource {
  subscribe(listener: () => void): () => void;
  getSnapshot(): DegreeSnapshot;
  addCourse(course: HistoryCourse): AddResult;
  addCourses(courses: readonly HistoryCourse[]): AddManyResult;
  editCourse(code: string, changes: CourseChanges): EditResult;
  removeCourse(code: string): boolean;
  setManualItem(id: string, confirmed: boolean): boolean;
  exportHistory(): string;
  replaceHistory(history: DegreeHistory): boolean;
  mergeHistory(history: DegreeHistory): boolean;
  setPin(pin: LinePin): boolean;
  removePin(code: string): boolean;
  clearPins(): boolean;
  saveAgain(): boolean;
  planChanged(): void;
  retryAudit(): void;
}

interface DegreeSourceDeps {
  getStorage(): HistoryStorage | null;
  engine: AuditEngine;
  plan?: OpenPlan;
  sheetId?: string;
}

const NO_PLAN: OpenPlan = { read: async () => [], signature: () => "" };

export function createDegreeSource({ getStorage, engine, plan = NO_PLAN, sheetId = DEFAULT_SHEET_ID }: DegreeSourceDeps): DegreeSource {
  const listeners = new Set<() => void>();
  let stored: StoredHistory | null = null;
  let loadedSheet: TrackingSheet | null = null;
  // What the browser refused to keep. It stays usable until the page closes or a save succeeds.
  let session: DegreeHistory | null = null;
  let audit: AuditState = { status: "waiting", result: null };
  let planCourses: AuditCourse[] = [];
  let auditedPlan: string | null = null;
  let snapshot: DegreeSnapshot | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let auditDue = true;
  // Each change bumps this, so an answer to an older history is dropped.
  let latest = 0;

  function notify() {
    snapshot = null;
    for (const listener of listeners) listener();
  }

  function current(): StoredHistory {
    stored ??= session ? { history: session, damaged: false } : readHistory(getStorage());
    return stored;
  }

  function stopTimer() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function startTimer() {
    stopTimer();
    timer = setTimeout(() => void runAudit(), AUDIT_DELAY_MS);
  }

  async function runAudit() {
    timer = null;
    auditDue = false;
    const asked = ++latest;
    const signature = plan.signature();
    let next: AuditState = { status: "failed", result: null };
    let nextPlan = planCourses;
    try {
      nextPlan = await plan.read();
      const sheet = await loadRequirements(sheetId);
      if (asked !== latest) return;
      loadedSheet = sheet;
      const response = await engine.audit(buildAuditRequest(current().history, nextPlan, sheet));
      if (response.ok) next = { status: "ready", result: response };
    } catch {
      // The failed state already says so, and offers another try.
    }
    if (asked !== latest) return;
    audit = next;
    planCourses = nextPlan;
    auditedPlan = signature;
    notify();
  }

  function auditAgain() {
    auditDue = true;
    latest += 1;
    audit = { status: "waiting", result: audit.result };
    if (listeners.size > 0) startTimer();
    notify();
  }

  function historyChanged() {
    stored = null;
    auditAgain();
  }

  function onStorage(event: StorageEvent) {
    if (event.key === null || event.key === HISTORY_KEY) historyChanged();
    else if (isPlanKey(event.key)) auditAgain();
  }

  function working(): DegreeHistory {
    return session ?? readHistory(getStorage()).history;
  }

  function write(history: DegreeHistory): boolean {
    const kept = writeHistory(getStorage(), history);
    session = kept ? null : history;
    historyChanged();
    return kept;
  }

  const pinsOf = (history: DegreeHistory) => history.pins ?? [];

  function withPins(history: DegreeHistory, pins: readonly LinePin[]): DegreeHistory {
    const next = { ...history };
    delete next.pins;
    return pins.length > 0 ? { ...next, pins: [...pins] } : next;
  }

  return {
    subscribe(listener) {
      if (listeners.size === 0) {
        if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
        // The planner may have changed the plan while this screen was closed.
        if (auditedPlan !== null && auditedPlan !== plan.signature()) auditAgain();
      }
      listeners.add(listener);
      if (auditDue && !timer) startTimer();
      return () => {
        listeners.delete(listener);
        if (listeners.size > 0) return;
        if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
        stopTimer();
      };
    },
    getSnapshot() {
      if (!snapshot) {
        const { history, damaged } = current();
        snapshot = { sheet: loadedSheet, history, damaged, audit, planCourses, unsaved: session !== null };
      }
      return snapshot;
    },
    addCourse(course) {
      const clean = parseCourse(course);
      if (!clean) return "invalid";
      const history = working();
      if (history.courses.some((item) => item.code === clean.code)) return "duplicate";
      return write({ ...history, courses: [...history.courses, clean] }) ? "added" : "unsaved";
    },
    addCourses(list) {
      const clean = list.map(parseCourse).filter((course) => course !== null);
      if (clean.length !== list.length) return { status: "invalid", added: 0 };
      const history = working();
      const courses = new Map(history.courses.map((course) => [course.code, course]));
      for (const course of clean) if (!courses.has(course.code)) courses.set(course.code, course);
      const added = courses.size - history.courses.length;
      if (added === 0) return { status: "added", added };
      return write({ ...history, courses: [...courses.values()] }) ? { status: "added", added } : { status: "unsaved", added: 0 };
    },
    editCourse(code, changes) {
      const history = working();
      const course = history.courses.find((item) => item.code === code);
      if (!course || (changes.apIb && course.source !== "typed")) return "invalid";
      const edited = parseCourse({ ...course, ...changes, term: (changes.term ?? course.term)?.trim() || undefined });
      if (!edited) return "invalid";
      return write({ ...history, courses: history.courses.map((item) => (item === course ? edited : item)) }) ? "saved" : "unsaved";
    },
    removeCourse(code) {
      const history = working();
      return write(withPins({ ...history, courses: history.courses.filter((item) => item.code !== code) }, pinsOf(history).filter((pin) => pin.code !== code)));
    },
    setManualItem(id, confirmed) {
      const history = working();
      const others = history.manual.filter((item) => item !== id);
      return write({ ...history, manual: confirmed ? [...others, id] : others });
    },
    exportHistory() {
      return serializeHistory(working());
    },
    replaceHistory(history) {
      return write(history);
    },
    mergeHistory(incoming) {
      const history = working();
      const courses = new Map(history.courses.map((course) => [course.code, course]));
      for (const course of incoming.courses) if (!courses.has(course.code)) courses.set(course.code, course);
      const pins = [...pinsOf(history)];
      for (const pin of pinsOf(incoming)) {
        if (!pins.some((item) => item.code === pin.code || item.line === pin.line)) pins.push(pin);
      }
      return write(withPins({ ...history, courses: [...courses.values()], manual: [...new Set([...history.manual, ...incoming.manual])] }, pins));
    },
    setPin(pin) {
      const history = working();
      return write(withPins(history, [...pinsOf(history).filter((item) => item.code !== pin.code && item.line !== pin.line), pin]));
    },
    removePin(code) {
      const history = working();
      return write(withPins(history, pinsOf(history).filter((pin) => pin.code !== code)));
    },
    clearPins() {
      return write(withPins(working(), []));
    },
    saveAgain() {
      if (!session) return true;
      if (!writeHistory(getStorage(), session)) return false;
      session = null;
      notify();
      return true;
    },
    planChanged() {
      if (auditedPlan !== plan.signature()) auditAgain();
    },
    retryAudit() {
      audit = { status: "waiting", result: null };
      auditAgain();
    },
  };
}

let shared: DegreeSource | null = null;

export function getDegreeSource(): DegreeSource {
  shared ??= createDegreeSource({ getStorage: browserHistoryStorage, engine: getEngineClient(), plan: browserOpenPlan(browserHistoryStorage) });
  return shared;
}
