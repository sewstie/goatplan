import type { HistoryCourse } from "./history";
import type { TrackingSheet } from "./sheets/types";
import { parseTerm, termRank } from "./terms";

export const HUA_GROUPINGS = {
  "art-drama-music": ["AR", "TH", "MU"],
  "modern-languages": ["AB", "CN", "ISE", "GN", "SP"],
  "literature-writing": ["EN", "WR"],
  "history-humanities": ["HI", "HU", "INTL"],
  "philosophy-religion": ["PY", "RE"],
} as const;

export const HUA_SUBJECTS: readonly string[] = Object.values(HUA_GROUPINGS).flat();
export const SEMINAR_CODES: readonly string[] = ["HU 3900", "HU 3910"];
export const LANGUAGE_PATH_SUBJECTS: readonly string[] = ["CN", "GN", "SP", "ISE"];
const EITHER_PATH_SUBJECTS = new Set(["ISE"]);
const ADVANCED_LEVEL = 3000;

export type HuaPath = { kind: "depth-breadth" } | { kind: "language"; subject: string };

export interface HuaPathGuess {
  path: HuaPath;
  chosen: boolean;
  first: string | null;
  alsoPossible: HuaPath | null;
}

const DEPTH_BREADTH: HuaPath = { kind: "depth-breadth" };
const subjectOf = (code: string) => code.split(" ")[0];

export const huaPathId = (path: HuaPath) => (path.kind === "language" ? `language:${path.subject}` : path.kind);

export function parseHuaPath(value: unknown): HuaPath | null {
  if (value === "depth-breadth") return DEPTH_BREADTH;
  const subject = typeof value === "string" && /^language:([A-Z]{2,4})$/.exec(value)?.[1];
  return subject && LANGUAGE_PATH_SUBJECTS.includes(subject) ? { kind: "language", subject } : null;
}

function takenOrder(course: HistoryCourse): number {
  const term = parseTerm(course.term);
  if (term) return termRank(term);
  return course.status === "taken" ? 0 : Number.MAX_SAFE_INTEGER;
}

export function humanitiesCourses(courses: readonly HistoryCourse[]): HistoryCourse[] {
  return courses
    .filter((course) => HUA_SUBJECTS.includes(subjectOf(course.code)) && !SEMINAR_CODES.includes(course.code))
    .sort((a, b) => takenOrder(a) - takenOrder(b));
}

export function detectHuaPath(courses: readonly HistoryCourse[], chosen?: HuaPath | null): HuaPathGuess {
  const list = humanitiesCourses(courses);
  const first = list[0]?.code ?? null;
  if (chosen) return { path: chosen, chosen: true, first, alsoPossible: null };
  const subjects = new Set(list.map((course) => subjectOf(course.code)));
  const language = subjects.size === 1 ? [...subjects][0] : null;
  const seminar = courses.some((course) => SEMINAR_CODES.includes(course.code));
  if (!language || seminar || !LANGUAGE_PATH_SUBJECTS.includes(language)) return { path: DEPTH_BREADTH, chosen: false, first, alsoPossible: null };
  const path: HuaPath = { kind: "language", subject: language };
  if (EITHER_PATH_SUBJECTS.has(language)) return { path: DEPTH_BREADTH, chosen: false, first, alsoPossible: path };
  return { path, chosen: false, first, alsoPossible: null };
}

export function applyHuaPath(sheet: TrackingSheet, path: HuaPath): TrackingSheet {
  if (path.kind !== "language") return sheet;
  const { subject } = path;
  const replaced = sheet.checks.filter((check) => check.type === "groupDepth" || check.type === "groupBreadth");
  const section = replaced[0]?.section ?? "hua";
  const confirmations = new Set(replaced.map((check) => check.confirmation).filter(Boolean));
  const removed = new Set(replaced.map((check) => check.id));
  return {
    ...sheet,
    lines: sheet.lines.map((line) => {
      if (line.section !== section) return line;
      const seminar = line.filter.courses?.some((code) => SEMINAR_CODES.includes(code)) ?? false;
      return seminar
        ? { ...line, name: "Advanced language course", displayName: `${subject} ${ADVANCED_LEVEL}+`, filter: { type: "subjectMinLevel", subject, minLevel: ADVANCED_LEVEL } }
        : { ...line, name: "Language course", displayName: `${subject} course`, filter: { type: "subjects", subjects: [subject] } };
    }),
    checks: sheet.checks.filter((check) => !removed.has(check.id)),
    manualItems: sheet.manualItems.filter((item) => !confirmations.has(item.id)),
  };
}
