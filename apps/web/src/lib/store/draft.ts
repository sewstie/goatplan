import { WEEK } from "@/lib/data/days";
import type { Day, TermFile } from "@/lib/data/types";
import { isSortPresetId } from "./sortPresets";
import type { Draft, PlanBlockedTime, PlanPreferences } from "./types";

export const DRAFT_VERSION = 1;
export const LAST_TERM_KEY = "goatplan:term:v1";

export function draftKey(termId: string): string {
  return `goatplan:draft:v${DRAFT_VERSION}:${termId}`;
}

export type DraftStorage = Pick<Storage, "getItem" | "setItem">;

export const DEFAULT_PREFERENCES: Readonly<PlanPreferences> = { startsAfter: 0, blocked: [], onlyOpen: true };

export function emptyDraft(): Draft {
  return {
    courses: [],
    preferences: { ...DEFAULT_PREFERENCES, blocked: [] },
    locks: {},
    professorByCourse: {},
    sortPreset: "fewestEarly",
    alternatives: {},
  };
}

/** localStorage, or null where it doesn't exist or is blocked. */
export function browserStorage(): DraftStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");
const isMinute = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 1440;
const isRecordOf = <T>(value: unknown, check: (item: unknown) => item is T): value is Record<string, T> =>
  isObject(value) && Object.values(value).every(check);

function isBlockedTime(value: unknown): value is PlanBlockedTime {
  return (
    isObject(value) &&
    WEEK.includes(value.day as Day) &&
    isMinute(value.start) &&
    isMinute(value.end) &&
    (value.start as number) < (value.end as number) &&
    (value.label === undefined || typeof value.label === "string")
  );
}

/** Keeps a name only when it has some text. */
function copyBlockedTime({ day, start, end, label }: PlanBlockedTime): PlanBlockedTime {
  const name = label?.trim();
  return name ? { day, start, end, label: name } : { day, start, end };
}

const isChoice = (value: unknown): value is Record<string, string[]> => isRecordOf(value, isStringArray);

export function parseProfessors(value: unknown): Draft["professorByCourse"] | null {
  if (value === undefined) return {};
  if (!isRecordOf(value, (name): name is string | null => name === null || (typeof name === "string" && name.trim().length > 0))) return null;
  return Object.fromEntries(Object.entries(value).map(([code, name]) => [code, name?.trim() ?? null]));
}

/** A saved draft, or null if the data is broken or from another version. Never throws. */
export function parseDraft(value: unknown): Draft | null {
  if (!isObject(value) || value.version !== DRAFT_VERSION) return null;
  const { courses, preferences, locks, sortPreset, alternatives } = value;
  const professorByCourse = parseProfessors(value.professorByCourse);
  if (!professorByCourse) return null;
  if (!isStringArray(courses) || !isRecordOf(locks, isStringArray) || !isSortPresetId(sortPreset)) return null;
  if (!isRecordOf(alternatives, isChoice) || !isObject(preferences)) return null;
  const { startsAfter, blocked, onlyOpen } = preferences;
  if (!isMinute(startsAfter) || typeof onlyOpen !== "boolean") return null;
  if (!Array.isArray(blocked) || !blocked.every(isBlockedTime)) return null;

  return {
    courses: [...courses],
    preferences: {
      startsAfter,
      blocked: blocked.map(copyBlockedTime),
      onlyOpen,
    },
    locks: { ...locks },
    professorByCourse,
    sortPreset,
    alternatives: { ...alternatives },
  };
}

export function readDraft(storage: DraftStorage | null, termId: string): Draft | null {
  try {
    const raw = storage?.getItem(draftKey(termId));
    return raw ? parseDraft(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeDraft(storage: DraftStorage | null, termId: string, draft: Draft): void {
  try {
    storage?.setItem(draftKey(termId), JSON.stringify({ version: DRAFT_VERSION, ...draft }));
  } catch {
    // Full or blocked storage: the draft just isn't kept.
  }
}

export function readLastTerm(storage: DraftStorage | null): string | null {
  try {
    return storage?.getItem(LAST_TERM_KEY) ?? null;
  } catch {
    return null;
  }
}

export function writeLastTerm(storage: DraftStorage | null, termId: string): void {
  try {
    storage?.setItem(LAST_TERM_KEY, termId);
  } catch {
    // Same as writeDraft.
  }
}

/** Drops what the term no longer has: unknown courses, locks on missing sections, choices for removed courses. */
export function sanitizeDraft(draft: Draft, term: TermFile): Draft {
  const coursesByCode = new Map(term.courses.map((course) => [course.code, course]));
  const courses = [...new Set(draft.courses)].filter((code) => coursesByCode.has(code));

  const locks: Draft["locks"] = {};
  for (const code of courses) {
    const sectionIds = new Set(coursesByCode.get(code)!.sections.map((section) => section.id));
    const kept = [...new Set(draft.locks[code] ?? [])].filter((id) => sectionIds.has(id));
    if (kept.length > 0) locks[code] = kept;
  }

  const alternatives: Draft["alternatives"] = {};
  for (const [scheduleKey, choice] of Object.entries(draft.alternatives)) {
    const kept = Object.fromEntries(Object.entries(choice).filter(([code]) => courses.includes(code)));
    if (Object.keys(kept).length > 0) alternatives[scheduleKey] = kept;
  }

  const professorByCourse = Object.fromEntries(Object.entries(draft.professorByCourse).filter(([code]) => courses.includes(code)));
  return { ...draft, courses, locks, professorByCourse, alternatives };
}
