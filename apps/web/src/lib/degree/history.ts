import { normalizeCourseCode } from "@/components/courses/courseCode";
import type { Course } from "@/lib/data/types";
import { ENGINE_API_VERSION, type AuditCourse, type AuditRequest } from "@/lib/engine/types";
import { parseTerm } from "./terms";
import { getRequirements } from "./requirements";
import type { TrackingSheet } from "./sheets";

export const HISTORY_KEY = "goatplan:history:v1";
const HISTORY_VERSION = 2;
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
  status: "taken" | "planned";
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

export interface SheetHistory {
  manual: string[];
  pins?: LinePin[];
}

export interface DegreeHistory extends SheetHistory {
  courses: HistoryCourse[];
  sheetId?: string;
  sheets?: Record<string, SheetHistory>;
}

export function keepSheetState(history: DegreeHistory): DegreeHistory {
  if (!history.sheetId) return history;
  return { ...history, sheets: { ...history.sheets, [history.sheetId]: { manual: history.manual, ...(history.pins?.length ? { pins: history.pins } : {}) } } };
}

export interface StoredHistory {
  history: DegreeHistory;
  damaged: boolean;
}

export const EMPTY_HISTORY: DegreeHistory = { courses: [], manual: [] };

export type HistoryFile = { ok: true; history: DegreeHistory } | { ok: false; reason: "broken" | "version" };

const CATALOG_IDENTIFIERS = ["ISU", "ISU BB", "HU—AAS-50"];

export function cleanCourseCode(text: string): string | null {
  const code = text.trim().toUpperCase().replace(/[—–]/g, "-");
  return normalizeCourseCode(text) ?? CATALOG_IDENTIFIERS.find((item) => item.replace("—", "-") === code) ?? null;
}

export const hasRegistrationCode = (code: string): boolean => normalizeCourseCode(code) !== null;

export function typedCourse(code: string): HistoryCourse {
  return { code, title: "", credits: DEFAULT_CREDITS, status: "taken", apIb: false, source: "typed" };
}

export function foundCourse({ code, title, credits }: Pick<Course, "code" | "title" | "credits">): HistoryCourse {
  return { code, title, credits: credits ?? DEFAULT_CREDITS, status: "taken", apIb: false, source: hasRegistrationCode(code) ? "found" : "typed" };
}

export function parseCredits(text: string): number | null {
  const clean = text.trim();
  if (!/^(\d+(\.\d{1,2})?|\.\d{1,2})$/.test(clean)) return null;
  const credits = Number(clean);
  return credits <= MAX_CREDITS ? credits : null;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function validHistoryTerm(text: string): boolean {
  const term = parseTerm(text);
  return !!term && term.letter !== "E" && term.year >= 2026 && term.year <= 2030;
}

export function parseCourse(value: unknown): HistoryCourse | null {
  if (!isObject(value) || typeof value.code !== "string" || typeof value.title !== "string") return null;
  const code = cleanCourseCode(value.code);
  const { credits, term } = value;
  if (!code || typeof credits !== "number" || !Number.isFinite(credits) || credits < 0 || credits > MAX_CREDITS) return null;
  if (value.title.length > MAX_TITLE_LENGTH || (typeof term === "string" && term.length > MAX_TERM_LENGTH)) return null;
  if (value.status !== undefined && value.status !== "taken" && value.status !== "planned") return null;
  if (value.status !== undefined && term !== undefined && (typeof term !== "string" || !validHistoryTerm(term))) return null;
  return {
    code,
    title: value.title,
    credits,
    ...(typeof term === "string" && validHistoryTerm(term) ? { term } : {}),
    status: value.status === "planned" || (value.status === undefined && value.inProgress === true) ? "planned" : "taken",
    apIb: value.apIb === true,
    source: value.source === "found" ? "found" : "typed",
    ...(CREDIT_SOURCES.includes(value.creditSource as CreditSource) ? { creditSource: value.creditSource as CreditSource } : {}),
  };
}

function parsePin(value: unknown): LinePin | null {
  if (!isObject(value) || typeof value.code !== "string" || !Number.isInteger(value.line) || (value.line as number) < 1) return null;
  const code = cleanCourseCode(value.code);
  return code ? { code, line: value.line as number } : null;
}

const parsePins = (value: unknown): LinePin[] => (Array.isArray(value) ? value.map(parsePin).filter((pin) => pin !== null) : []);

const isSheetId = (value: unknown): value is string => typeof value === "string" && /^[a-z][a-z0-9-]{0,59}-\d{4}$/.test(value);

function parseSheetState(value: unknown): SheetHistory | null {
  if (!isObject(value) || !Array.isArray(value.manual) || !value.manual.every(isManualItem)) return null;
  if (value.pins !== undefined && (!Array.isArray(value.pins) || value.pins.some((pin) => !parsePin(pin)))) return null;
  const pins = parsePins(value.pins);
  if (new Set(pins.map((pin) => pin.code)).size !== pins.length || new Set(pins.map((pin) => pin.line)).size !== pins.length) return null;
  return { manual: [...new Set(value.manual as string[])], ...(pins.length ? { pins } : {}) };
}

function validSheetFields(value: Record<string, unknown>): boolean {
  if (value.sheetId !== undefined && !isSheetId(value.sheetId)) return false;
  if (value.sheets === undefined) return true;
  return isSheetId(value.sheetId) && isObject(value.sheets) && Object.entries(value.sheets).every(([id, state]) => isSheetId(id) && parseSheetState(state) !== null);
}

export function parseHistory(value: unknown): StoredHistory {
  if (!isObject(value) || ![1, HISTORY_VERSION].includes(value.version as number) || !Array.isArray(value.courses)) {
    return { history: EMPTY_HISTORY, damaged: true };
  }
  const courses = new Map<string, HistoryCourse>();
  let damaged = false;
  for (const item of value.courses) {
    const legacy = value.version === 1 && isObject(item) && typeof item.term === "string" && item.term.length <= MAX_TERM_LENGTH && !validHistoryTerm(item.term) ? { ...item, term: undefined } : item;
    const course = value.version === HISTORY_VERSION && (!isObject(item) || (item.status !== "taken" && item.status !== "planned")) ? null : parseCourse(legacy);
    if (!course) damaged = true;
    else if (!courses.has(course.code)) courses.set(course.code, course);
  }
  const manual = Array.isArray(value.manual) ? value.manual.filter((item) => typeof item === "string") : [];
  const pins = parsePins(value.pins);
  const sheets = isObject(value.sheets) ? Object.fromEntries(Object.entries(value.sheets).flatMap(([id, state]) => {
    const clean = parseSheetState(state);
    return isSheetId(id) && clean ? [[id, clean]] : [];
  })) : undefined;
  return { history: { courses: [...courses.values()], manual, ...(pins.length > 0 ? { pins } : {}), ...(isSheetId(value.sheetId) ? { sheetId: value.sheetId } : {}), ...(sheets ? { sheets } : {}) }, damaged: damaged || !validSheetFields(value) };
}

export function serializeHistory(history: DegreeHistory): string {
  return JSON.stringify({ version: HISTORY_VERSION, ...keepSheetState(history) }, null, 2);
}

const hasEveryField = (value: unknown): boolean =>
  isObject(value) &&
  (value.status === "taken" || value.status === "planned" || (value.status === undefined && typeof value.inProgress === "boolean")) &&
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
  if (![1, HISTORY_VERSION].includes(value.version as number)) return { ok: false, reason: "version" };
  const { courses, manual } = value;
  if (!Array.isArray(courses) || !courses.every(hasEveryField)) return broken;
  if (value.version === HISTORY_VERSION && courses.some((course) => !isObject(course) || (course.status !== "taken" && course.status !== "planned"))) return broken;
  if (!Array.isArray(manual) || !manual.every(isManualItem)) return broken;
  if (!validSheetFields(value) || !parseSheetState(value)) return broken;
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
    const value: unknown = JSON.parse(text);
    const parsed = parseHistory(value);
    if (isObject(value) && value.version === 1 && !parsed.damaged) writeHistory(storage, parsed.history);
    return parsed;
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

export function buildAuditRequest({ courses, manual }: DegreeHistory, sheet: TrackingSheet = getRequirements()): AuditRequest {
  return {
    version: ENGINE_API_VERSION,
    requirements: sheet.id,
    sheet,
    taken: courses.filter((course) => course.status === "taken" && hasRegistrationCode(course.code)).map(auditCourse),
    planned: courses.filter((course) => course.status === "planned" && hasRegistrationCode(course.code)).map(auditCourse),
    manual,
  };
}
