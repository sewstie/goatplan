import requirements from "./cs-2030.json";

type Filter = (typeof requirements.lines)[number]["filter"] & {
  subject?: string;
  subjects?: string[];
  courses?: string[];
  minLevel?: number;
  additionalCourses?: string[];
  excludedCourses?: string[];
};

export const SMALLEST_FULL_COURSE_CREDITS = 3;

const FILTERS = new Map(requirements.lines.map((line) => [line.line, line.filter as Filter]));
const SECTION_OF_LINE = new Map(requirements.lines.map((line) => [line.line, line.section]));
const EXCLUDED_FROM_CS = new Set(["CS 2119"]);
const EXCLUDED_FROM_ADVANCED = new Set(["CS 5007"]);

export const FREE_ELECTIVE_LINES = requirements.sections.find((section) => section.id === "free-electives")!.lines;
export const CS_LINES = requirements.sections.find((section) => section.id === "cs")!.lines;
export const WPE_LINE = 7;

export function crossListed(code: string): string[] {
  return requirements.crossLists.find((codes) => codes.includes(code)) ?? [code];
}

const parts = (code: string) => {
  const [subject, number = ""] = code.split(" ");
  return { subject, level: /^\d{3}[A-Z]?$/.test(number) ? 5000 : Number.parseInt(number, 10) || 0 };
};

function codeFits(code: string, filter: Filter): boolean {
  const { subject, level } = parts(code);
  switch (filter.type) {
    case "huaSubjects":
      return requirements.huaSubjects.includes(subject);
    case "courses":
      return filter.courses?.includes(code) ?? false;
    case "subjects":
      return (filter.subjects?.includes(subject) ?? false) || (filter.additionalCourses?.includes(code) ?? false);
    case "csIntro":
      return (filter.courses?.includes(code) ?? false) || (subject === "CS" && level >= (filter.minLevel ?? 2000) && !EXCLUDED_FROM_CS.has(code));
    case "subjectMinLevel":
      return subject === filter.subject && level >= (filter.minLevel ?? 0) && !EXCLUDED_FROM_CS.has(code);
    case "cs4000plus":
      return subject === "CS" && level >= 4000 && !EXCLUDED_FROM_ADVANCED.has(code);
    case "scienceElective":
      return (filter.subjects?.includes(subject) ?? false) && !(filter.excludedCourses?.includes(code) ?? false);
    case "any":
      return true;
    default:
      return false;
  }
}

export function fitsLine(code: string, credits: number, line: number): boolean {
  const filter = FILTERS.get(line);
  if (!filter) return false;
  if (filter.type !== "any" && credits < SMALLEST_FULL_COURSE_CREDITS) return false;
  return crossListed(code).some((name) => codeFits(name, filter));
}

export const isCsLine = (line: number) => SECTION_OF_LINE.get(line) === "cs";

export function onlyOneRivals(code: string): string[] {
  const names = crossListed(code);
  const set = requirements.onlyOneSets.find((item) => item.courses.some((course) => names.includes(course)));
  return set ? set.courses.filter((course) => !names.includes(course)) : [];
}

const AREA_CHECKS = requirements.checks.filter((check) => check.type === "area");

export function areaCourses(checkId: string): readonly string[] {
  return AREA_CHECKS.find((check) => check.id === checkId)?.courses ?? [];
}

export const AREA_CHECK_IDS = AREA_CHECKS.map((check) => check.id);
