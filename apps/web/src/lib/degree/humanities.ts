import type { HistoryCourse } from "./history";
import type { TrackingSheet } from "./sheets/types";
import { parseTerm, termRank, type TermName } from "./terms";

export const HUA_GROUPINGS = {
  "art-drama-music": ["AR", "TH", "MU"],
  "modern-languages": ["AB", "CN", "ISE", "GN", "SP"],
  "literature-writing": ["EN", "WR"],
  "history-humanities": ["HI", "HU", "INTL"],
  "philosophy-religion": ["PY", "RE"],
} as const;

export const HUA_SUBJECTS: readonly string[] = Object.values(HUA_GROUPINGS).flat();
export const SEMINAR_CODES: readonly string[] = ["HU 3900", "HU 3910"];
export const LANGUAGE_PATH_SUBJECTS: readonly string[] = ["AB", "CN", "GN", "SP", "ISE"];
export const LANGUAGE_NAMES: Record<string, string> = { AB: "Arabic", CN: "Chinese", GN: "German", SP: "Spanish", ISE: "English for non-native speakers (ISE)" };
const LAST_COURSE_LEVEL: Record<string, number> = { AB: 2000 };
const ADVANCED_LEVEL = 3000;
export const lastLanguageLevel = (subject: string) => LAST_COURSE_LEVEL[subject] ?? ADVANCED_LEVEL;

export type HuaPath = { kind: "depth-breadth" } | { kind: "language"; subject: string };

export interface HuaPathGuess {
  path: HuaPath;
  chosen: boolean;
  first: string | null;
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
  if (chosen) return { path: chosen, chosen: true, first };
  const subjects = new Set(list.map((course) => subjectOf(course.code)));
  const language = subjects.size === 1 ? [...subjects][0] : null;
  const seminar = courses.some((course) => SEMINAR_CODES.includes(course.code));
  if (!language || seminar || !LANGUAGE_PATH_SUBJECTS.includes(language)) return { path: DEPTH_BREADTH, chosen: false, first };
  return { path: { kind: "language", subject: language }, chosen: false, first };
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
        ? { ...line, name: "Advanced language course", displayName: `${subject} ${lastLanguageLevel(subject)}+`, filter: { type: "subjectMinLevel", subject, minLevel: lastLanguageLevel(subject) } }
        : { ...line, name: "Language course", displayName: `${subject} course`, filter: { type: "subjects", subjects: [subject] } };
    }),
    checks: sheet.checks.filter((check) => !removed.has(check.id)),
    manualItems: sheet.manualItems.filter((item) => !confirmations.has(item.id)),
  };
}

const AREA_NAMES: Record<string, string> = {
  "art-drama-music": "art, drama and music",
  "modern-languages": "languages",
  "literature-writing": "literature and writing",
  "history-humanities": "history and humanities",
  "philosophy-religion": "philosophy and religion",
};
const SEMINAR_AFTER = 5;

export function groupingName(code: string): string | null {
  const area = Object.entries(HUA_GROUPINGS).find(([, subjects]) => (subjects as readonly string[]).includes(subjectOf(code)))?.[0];
  return area ? AREA_NAMES[area] : null;
}

function areaWords(names: readonly string[]): string {
  const words = names.map((name) => AREA_NAMES[name] ?? name);
  return words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} or ${words.at(-1)}`;
}

export function huaProblem(code: string, courses: readonly HistoryCourse[], sheet: TrackingSheet): string | null {
  const depth = sheet.checks.find((check) => check.type === "groupDepth");
  const breadth = sheet.checks.find((check) => check.type === "groupBreadth");
  if (!depth || !breadth?.groupings || SEMINAR_CODES.includes(code)) return null;
  const order = breadth.groupingOrder ?? Object.keys(breadth.groupings);
  const areaOf = (name: string) => order.find((area) => breadth.groupings![area].includes(subjectOf(name))) ?? null;
  const area = areaOf(code);
  if (!area) return null;
  const slots = depth.lines?.length ?? 0;
  const needed = depth.minCourses ?? 0;
  const before = humanitiesCourses(courses.filter((course) => course.code !== code)).map((course) => areaOf(course.code));
  if (before.length >= slots) return null;
  const fits = (list: readonly (string | null)[]) => {
    const open = slots - list.length;
    return order.filter((target) => {
      const count = list.filter((item) => item === target).length;
      const missing = Math.max(0, needed - count);
      return missing <= open && (list.length - count + open - missing >= 1 || target === breadth.exceptionGrouping);
    });
  };
  const possible = fits(before);
  if (!possible.length || fits([...before, area]).length) return null;
  const done = possible.find((target) => before.filter((item) => item === target).length >= needed);
  if (done) return `${code} won’t count toward humanities. Your depth is in ${areaWords([done])}, so your last humanities course has to come from another area for breadth.`;
  return `${code} won’t count toward humanities. To finish depth in the courses you have left, pick from ${areaWords(possible)}.`;
}

export function seminarTooEarly(code: string, courses: readonly HistoryCourse[], term: TermName): boolean {
  if (!SEMINAR_CODES.includes(code)) return false;
  const before = humanitiesCourses(courses).filter((course) => {
    const when = parseTerm(course.term);
    return when ? termRank(when) < termRank(term) : course.status === "taken";
  });
  return before.length < SEMINAR_AFTER;
}

export function huaPathNote(path: HuaPath): string | null {
  if (path.kind === "depth-breadth") return null;
  const { subject } = path;
  const name = subject === "ISE" ? "ISE" : (LANGUAGE_NAMES[subject] ?? subject);
  const main = `Language path: all 6 humanities courses in ${name}. The last is ${subject} ${lastLanguageLevel(subject)}+ in place of the seminar, so no breadth course is needed.`;
  return subject === "ISE" || subject === "AB" ? main : `${main} With WPI credit for 3 years of high school ${name}, 5 intermediate or higher courses at WPI are enough.`;
}
