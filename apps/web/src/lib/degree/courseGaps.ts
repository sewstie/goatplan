import type { Course } from "@/lib/data/types";
import { getEngineClient, type AuditRequest, type AuditSuccess } from "@/lib/engine";
import { AUDIT_DELAY_MS, getDegreeSource, type AuditEngine, type DegreeSource } from "./degreeSource";
import { buildAuditRequest, foundCourse, hasRegistrationCode, type DegreeHistory } from "./history";
import { huaProblem } from "./humanities";
import { DEFAULT_SHEET_ID, loadSheet, type TrackingSheet } from "./sheets";

export interface OpenTerm {
  courses: readonly Course[];
  planned: readonly string[];
}

export interface CourseGaps {
  status: "waiting" | "ready" | "failed";
  closes: ReadonlyMap<string, string[]> | null;
  details?: ReadonlyMap<string, { lines: number[]; checks: string[] }> | null;
}

export interface GapSource {
  subscribe(listener: () => void): () => void;
  getSnapshot(): CourseGaps;
  setOpenTerm(term: OpenTerm): void;
}

interface GapSourceDeps {
  degree: Pick<DegreeSource, "subscribe" | "getSnapshot">;
  engine: AuditEngine;
}

const asAuditCourse = (course: Course) => {
  const { code, credits } = foundCourse(course);
  return { code, credits };
};

function buildGapRequest(history: DegreeHistory, { courses }: OpenTerm, sheet: TrackingSheet): AuditRequest {
  const request = buildAuditRequest(history, sheet);
  return {
    ...request,
    candidates: courses.filter((course) => course.level === "Undergraduate" && hasRegistrationCode(course.code)).map(asAuditCourse),
  };
}

function readAnswers({ sections, checks, candidateResults }: AuditSuccess): Map<string, string[]> {
  const sectionOfLine = new Map(sections.flatMap((section) => section.lines.map((line) => [line.id, section.name] as const)));
  const checkNames = new Map(checks.map((check) => [check.id, check.label.replace(/ area$/, "")]));
  const closes = new Map<string, string[]>();
  for (const { code, closesLines, closesChecks } of candidateResults) {
    const names = [...closesLines.map((id) => sectionOfLine.get(id)), ...closesChecks.map((id) => checkNames.get(id))];
    const known = names.filter((name) => name !== undefined);
    if (known.length > 0) closes.set(code, [...new Set(known)]);
  }
  return closes;
}

function readDetails({ candidateResults }: AuditSuccess) {
  return new Map(candidateResults.filter(({ closesLines, closesChecks }) => closesLines.length + closesChecks.length > 0).map(({ code, closesLines, closesChecks }) => [code, { lines: closesLines, checks: closesChecks }]));
}

const samePlan = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((code, index) => code === b[index]);

export function createGapSource({ degree, engine }: GapSourceDeps): GapSource {
  const listeners = new Set<() => void>();
  let open: OpenTerm | null = null;
  let history: DegreeHistory | null = null;
  let selectedSheetId: string | null = null;
  let gaps: CourseGaps = { status: "waiting", closes: null };
  let timer: ReturnType<typeof setTimeout> | null = null;
  let due = true;
  let stopFollowing: (() => void) | null = null;
  // Each change bumps this, so an answer to an older question is dropped.
  let latest = 0;

  function notify() {
    for (const listener of listeners) listener();
  }

  function stopTimer() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function startTimer() {
    stopTimer();
    const term = open;
    if (term) timer = setTimeout(() => void ask(term), AUDIT_DELAY_MS);
  }

  async function ask(term: OpenTerm) {
    timer = null;
    due = false;
    const asked = ++latest;
    let next: CourseGaps = { status: "failed", closes: null };
    try {
      const snapshot = degree.getSnapshot();
      if (snapshot.selectedSheetId === null) return;
      const sheet = snapshot.sheet ?? await loadSheet(snapshot.history.sheetId ?? DEFAULT_SHEET_ID);
      if (asked !== latest) return;
      const history = degree.getSnapshot().history;
      const response = await engine.audit(buildGapRequest(history, term, sheet));
      if (response.ok) {
        const counted = { ...response, candidateResults: response.candidateResults.filter((candidate) => !huaProblem(candidate.code, history.courses, sheet)) };
        next = { status: "ready", closes: readAnswers(counted), details: readDetails(counted) };
      }
    } catch {
      // Search carries on without badges.
    }
    if (asked !== latest) return;
    gaps = next;
    if (next.status === "failed") due = true;
    notify();
  }

  function markStale() {
    due = true;
    latest += 1;
    gaps = { status: "waiting", closes: gaps.closes, details: gaps.details };
  }

  function changed() {
    markStale();
    if (listeners.size > 0) startTimer();
    notify();
  }

  function historyMoved(): boolean {
    const snapshot = degree.getSnapshot();
    const now = snapshot.history;
    if (now === history) return false;
    if (selectedSheetId !== snapshot.selectedSheetId) gaps = { status: "waiting", closes: null, details: null };
    selectedSheetId = snapshot.selectedSheetId;
    history = now;
    return true;
  }

  return {
    subscribe(listener) {
      if (listeners.size === 0) {
        stopFollowing = degree.subscribe(() => {
          if (historyMoved()) changed();
        });
        if (historyMoved()) markStale();
      }
      listeners.add(listener);
      if (due && !timer) startTimer();
      return () => {
        listeners.delete(listener);
        if (listeners.size > 0) return;
        stopFollowing?.();
        stopFollowing = null;
        stopTimer();
      };
    },
    getSnapshot: () => gaps,
    setOpenTerm(term) {
      if (open && open.courses === term.courses && samePlan(open.planned, term.planned)) return;
      open = term;
      changed();
    },
  };
}

let shared: GapSource | null = null;

export function getGapSource(): GapSource {
  shared ??= createGapSource({ degree: getDegreeSource(), engine: getEngineClient() });
  return shared;
}
