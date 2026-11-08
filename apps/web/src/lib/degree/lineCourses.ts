import type { Course } from "@/lib/data/types";
import type { HistoryCourse } from "./history";
import { hasRegistrationCode } from "./history";
import { huaProblem, seminarTooEarly } from "./humanities";
import { crossListed, fitsLine, isMajorLine, onlyOneRivals } from "./rules";
import type { TrackingSheet } from "./sheets";
import type { TermName } from "./terms";

const USUAL_CREDITS = 3;

function sortKey(code: string): string {
  const [subject, number = ""] = code.split(" ");
  const level = /^\d{3}[A-Z]$/.test(number) ? Number.parseInt(number, 10) * 10 : Number.parseInt(number, 10) || 0;
  return `${subject} ${String(level).padStart(5, "0")} ${number}`;
}

interface LineCoursesInput {
  line: number;
  courses: readonly (Course & { termLetters?: readonly string[] })[];
  history: readonly HistoryCourse[];
  sheet: TrackingSheet;
  term: TermName | null;
}

export interface LineCourse {
  course: Course;
  name: string;
  others: string[];
  terms: string[];
}

export function matchesLineRequirement(code: string, credits: number, line: number, sheet: TrackingSheet): boolean {
  const area = sheet.lines.find((item) => item.line === line)?.areaTag;
  if (!area) return fitsLine(code, credits, line, sheet);
  const check = sheet.checks.find((item) => item.type === "area" && item.id === area);
  return credits >= USUAL_CREDITS && crossListed(code, sheet).some((name) => check?.courses?.includes(name) && (fitsLine(name, credits, line, sheet) || check.externalCourses?.includes(name)));
}

export function coursesForLine({ line, courses, history, sheet, term }: LineCoursesInput): LineCourse[] {
  const known = new Set(history.flatMap((course) => crossListed(course.code, sheet)));
  const alone = { ...sheet, crossLists: [] };
  const major = isMajorLine(line, sheet);
  const found = new Map<string, LineCourse>();
  for (const course of courses) {
    const names = crossListed(course.code, sheet);
    const credits = course.credits ?? USUAL_CREDITS;
    if (course.level !== "Undergraduate" || !hasRegistrationCode(course.code) || names.some((name) => known.has(name))) continue;
    if (!matchesLineRequirement(course.code, credits, line, sheet)) continue;
    if (major && onlyOneRivals(course.code, sheet).some((rival) => known.has(rival))) continue;
    if (huaProblem(course.code, history, sheet) || (term && seminarTooEarly(course.code, history, term))) continue;
    const name = names.find((item) => matchesLineRequirement(item, credits, line, alone)) ?? course.code;
    const previous = found.get(name);
    const terms = [...new Set([...(previous?.terms ?? []), ...(course.termLetters ?? [])])].filter((term) => /^[ABCDE]$/.test(term)).sort();
    if (previous?.course.code === name) { previous.terms = terms; continue; }
    const entry = course.code === name ? course : { ...course, code: name, subject: name.split(" ")[0] };
    found.set(name, { course: entry, name, others: names.filter((item) => item !== name), terms });
  }
  return [...found.values()].sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name)));
}

export function matchesQuery(course: Pick<Course, "code" | "title">, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const text = `${course.code} ${course.code.replace(" ", "")} ${course.title}`.toLowerCase();
  return words.every((word) => text.includes(word));
}

export function needsPin(code: string, credits: number, line: number, emptyLines: readonly number[], sheet: TrackingSheet): boolean {
  if (!fitsLine(code, credits, line, sheet)) return false;
  const filterOf = (id: number) => {
    const rule = sheet.lines.find((item) => item.line === id);
    return JSON.stringify([rule?.filter, rule?.areaTag]);
  };
  return emptyLines.some((other) => other !== line && filterOf(other) !== filterOf(line) && fitsLine(code, credits, other, sheet));
}
