import { getRequirements, loadedRequirements } from "./requirements";
import type { TrackingSheet } from "./sheets";
import type { LineFilter } from "./sheets/types";

export { AREA_CHECK_IDS, FREE_ELECTIVE_LINES, MAJOR_LINES, WPE_LINE } from "./requirements";
export const SMALLEST_FULL_COURSE_CREDITS = 3;

export function crossListed(code: string, sheet = loadedRequirements()): string[] {
  return sheet?.crossLists.find((codes) => codes.includes(code)) ?? [code];
}

const parts = (code: string) => {
  const [subject, number = ""] = code.split(" ");
  const graduate = /^\d{3}$/.test(number);
  const level = /^\d{3}[A-Z]$/.test(number) ? Number.parseInt(number, 10) * 10 : Number.parseInt(number, 10) || 0;
  return { subject, level: graduate ? 4000 : level };
};

function codeFits(code: string, filter: LineFilter): boolean {
  const { subject, level } = parts(code);
  if (filter.excludedCourses?.includes(code)) return false;
  if (filter.additionalCourses?.includes(code)) return true;
  switch (filter.type) {
    case "courses": return filter.courses?.includes(code) ?? false;
    case "subjects": return filter.subjects?.includes(subject) ?? false;
    case "subjectMinLevel": return subject === filter.subject && level >= (filter.minLevel ?? 0);
    case "any": return true;
    default: return false;
  }
}

export function fitsLine(code: string, credits: number, line: number, sheet: TrackingSheet = getRequirements()): boolean {
  const rule = sheet.lines.find((item) => item.line === line);
  if (!rule || rule.subSlots) return false;
  if (rule.filter.type !== "any" && credits < SMALLEST_FULL_COURSE_CREDITS) return false;
  return crossListed(code, sheet).some((name) => codeFits(name, rule.filter));
}

export const isMajorLine = (line: number, sheet = getRequirements()) => {
  const section = sheet.lines.find((item) => item.line === line)?.section;
  return sheet.checks.some((check) => check.type === "area" && check.section === section);
};

export function onlyOneRivals(code: string, sheet = getRequirements()): string[] {
  const names = crossListed(code, sheet);
  const set = sheet.onlyOneSets.find((item) => item.courses.some((course) => names.includes(course)));
  return set ? set.courses.filter((course) => !names.includes(course)) : [];
}

export function areaCourses(checkId: string, sheet = getRequirements()): readonly string[] {
  return sheet.checks.find((check) => check.type === "area" && check.id === checkId)?.courses ?? [];
}
