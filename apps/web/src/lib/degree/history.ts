import { normalizeCourseCode } from "@/components/courses/courseCode";
import type { Course } from "@/lib/data/types";
import { ENGINE_API_VERSION, type AuditCourse, type AuditRequest } from "@/lib/engine/types";
import { REQUIREMENTS_ID } from "./requirements";

export const HISTORY_KEY = "goatplan:history:v1";
const HISTORY_VERSION = 1;
export const DEFAULT_CREDITS = 3;
const MAX_CREDITS = 30;
const MAX_TITLE_LENGTH = 300;
export const MAX_TERM_LENGTH = 40;
const MAX_MANUAL_ITEM_LENGTH = 64;
export const MAX_HISTORY_FILE_LENGTH = 256 * 1024;

export type HistoryStorage = Pick<Storage, "getItem" | "setItem">;

export interface HistoryCourse {
  code: string;
  title: string;
  credits: number;
  term?: string;
  inProgress: boolean;
  apIb: boolean;
  source: "found" | "typed";
  creditSource?: CreditSource;
}

export const CREDIT_SOURCES = ["wpi", "transfer", "other"] as const;
export type CreditSource = (typeof CREDIT_SOURCES)[number];

export interface LinePin {
  code: string;
  line: number;
}

export interface DegreeHistory {
  courses: HistoryCourse[];
  manual: string[];
  pins?: LinePin[];
}

export interface StoredHistory {
  history: DegreeHistory;
  damaged: boolean;
}

export const EMPTY_HISTORY: DegreeHistory = { courses: [], manual: [] };

export type HistoryFile = { ok: true; history: DegreeHistory } | { ok: false; reason: "broken" | "version" };

export const cleanCourseCode = normalizeCourseCode;

export function typedCourse(code: string): HistoryCourse {
  return { code, title: "", credits: DEFAULT_CREDITS, inProgress: false, apIb: false, source: "typed" };
}

export function foundCourse({ code, title, credits }: Pick<Course, "code" | "title" | "credits">): HistoryCourse {
  return { code, title, credits: credits ?? DEFAULT_CREDITS, inProgress: false, apIb: false, source: "found" };
}

export function parseCredits(text: string): number | null {
  const clean = text.trim();
  if (!/^(\d+(\.\d{1,2})?|\.\d{1,2})$/.test(clean)) return null;
  const credits = Number(clean);
  return credits <= MAX_CREDITS ? credits : null;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function parseCourse(value: unknown): HistoryCourse | null {
  if (!isObject(value) || typeof value.code !== "string" || typeof value.title !== "string") return null;
  const code = cleanCourseCode(value.code);
  const { credits, term } = value;
  if (!code || typeof credits !== "number" || !Number.isFinite(credits) || credits < 0 || credits > MAX_CREDITS) return null;
  if (value.title.length > MAX_TITLE_LENGTH || (typeof term === "string" && term.length > MAX_TERM_LENGTH)) return null;
  return {
    code,
    title: value.title,
    credits,
    ...(typeof term === "string" ? { term } : {}),
    inProgress: value.inProgress === true,
    apIb: value.apIb === true,
    source: value.source === "found" ? "found" : "typed",
    ...(CREDIT_SOURCES.includes(value.creditSource as CreditSource) ? { creditSource: value.creditSource as CreditSource } : {}),
  };
}

function parsePin(value: unknown): LinePin | null {
  if (!isObject(value) || typeof value.code !== "string" || !Number.isInteger(value.line)) return null;
  const code = cleanCourseCode(value.code);
  return code ? { code, line: value.line as number } : null;
}

const parsePins = (value: unknown): LinePin[] => (Array.isArray(value) ? value.map(parsePin).filter((pin) => pin !== null) : []);

export function parseHistory(value: unknown): StoredHistory {
  if (!isObject(value) || value.version !== HISTORY_VERSION || !Array.isArray(value.courses)) {
    return { history: EMPTY_HISTORY, damaged: true };
  }
  const courses = new Map<string, HistoryCourse>();
  let damaged = false;
  for (const item of value.courses) {
    const course = parseCourse(item);
    if (!course) damaged = true;
    else if (!courses.has(course.code)) courses.set(course.code, course);
  }
  const manual = Array.isArray(value.manual) ? value.manual.filter((item) => typeof item === "string") : [];
  const pins = parsePins(value.pins);
  return { history: { courses: [...courses.values()], manual, ...(pins.length > 0 ? { pins } : {}) }, damaged };
}

export function serializeHistory(history: DegreeHistory): string {
  return JSON.stringify({ version: HISTORY_VERSION, ...history }, null, 2);
}

const hasEveryField = (value: unknown): boolean =>
  isObject(value) &&
  typeof value.inProgress === "boolean" &&
  typeof value.apIb === "boolean" &&
  (value.source === "found" || value.source === "typed") &&
  (value.term === undefined || typeof value.term === "string");

const validCredits = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= MAX_CREDITS;

const isManualItem = (value: unknown): boolean => typeof value === "string" && value.length <= MAX_MANUAL_ITEM_LENGTH;

export interface FileProblem {
  badRecords: number;
  badCredits: number;
}

export function describeBadFile(text: string): FileProblem {
  try {
    const value: unknown = JSON.parse(text);
    if (!isObject(value) || !Array.isArray(value.courses)) return { badRecords: 0, badCredits: 0 };
    const courses: unknown[] = value.courses;
    return {
      badRecords: courses.filter((course) => !hasEveryField(course) || parseCourse(course) === null).length,
      badCredits: courses.filter((course) => isObject(course) && !validCredits(course.credits)).length,
    };
  } catch {
    return { badRecords: 0, badCredits: 0 };
  }
}

export function parseHistoryFile(text: string): HistoryFile {
  const broken: HistoryFile = { ok: false, reason: "broken" };
  if (text.length > MAX_HISTORY_FILE_LENGTH) return broken;
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return broken;
  }
  if (!isObject(value) || typeof value.version !== "number") return broken;
  if (value.version !== HISTORY_VERSION) return { ok: false, reason: "version" };
  const { courses, manual } = value;
  if (!Array.isArray(courses) || !courses.every(hasEveryField)) return broken;
  if (!Array.isArray(manual) || !manual.every(isManualItem)) return broken;
  const { history, damaged } = parseHistory(value);
  if (damaged || history.courses.length !== courses.length) return broken;
  return { ok: true, history };
}

export function browserHistoryStorage(): HistoryStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readHistory(storage: HistoryStorage | null): StoredHistory {
  let text: string | null = null;
  try {
    text = storage?.getItem(HISTORY_KEY) ?? null;
  } catch {
    return { history: EMPTY_HISTORY, damaged: false };
  }
  if (text === null) return { history: EMPTY_HISTORY, damaged: false };
  try {
    return parseHistory(JSON.parse(text));
  } catch {
    return { history: EMPTY_HISTORY, damaged: true };
  }
}

export function writeHistory(storage: HistoryStorage | null, history: DegreeHistory): boolean {
  if (!storage) return false;
  try {
    storage.setItem(HISTORY_KEY, serializeHistory(history));
    return true;
  } catch {
    return false;
  }
}

const auditCourse = ({ code, credits, apIb }: HistoryCourse): AuditCourse =>
  apIb ? { code, credits, apIb } : { code, credits };

export function buildAuditRequest({ courses, manual }: DegreeHistory, plan: readonly AuditCourse[] = []): AuditRequest {
  const known = new Set(courses.map((course) => course.code));
  return {
    version: ENGINE_API_VERSION,
    requirements: REQUIREMENTS_ID,
    taken: courses.filter((course) => !course.inProgress).map(auditCourse),
    planned: [...courses.filter((course) => course.inProgress).map(auditCourse), ...plan.filter((course) => !known.has(course.code))],
    manual,
  };
}
