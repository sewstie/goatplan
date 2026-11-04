import type { AuditCheck, AuditLine, AuditSection } from "@/lib/engine/types";
import { DEPTH_COURSES, HUMANITIES_GROUPINGS, MANUAL_ITEMS, SECTIONS } from "./requirements";

export type LineState = "done" | "planned" | "partial" | "missing" | "check";

const CHECK_YOURSELF = "Check this yourself";
const SMALLEST_COUNTED_CREDITS = 0.75;
const FULL_COURSE_CREDITS = 3;

const SECTION_OF_CHECK: Record<string, string> = {
  systems: "cs",
  theory: "cs",
  design: "cs",
  social: "cs",
  "grad-equivalence": "cs",
  "hua-depth": "hua",
  "hua-breadth": "hua",
  "hua-ap-ib-limit": "hua",
  "science-depth": "science",
  "ma-1000-limit": "math",
};

const CHECKS_ABOUT_A_LINE = new Set(["hua-depth", "hua-breadth", "hua-ap-ib-limit", "grad-equivalence"]);

const HELP: Record<string, string> = {
  social: "A course outside CS meets this, but it doesn't count toward your CS units.",
  "hua-depth": "You need 3 related courses in one grouping. Yours are in different groupings so far.",
  "hua-breadth": "You need a course outside your depth grouping. Ask your advisor if all your courses are in languages.",
  "hua-ap-ib-limit": "Only 1 AP/IB course can count toward humanities.",
  residency: "You need 8 units at WPI. A course code can't show where you took it.",
  "grad-equivalence": "Each graduate course counts here as one 4000+ course. The sheet's 2-for-3 rule may give you more.",
};

export const lineText = ({ id, label, course }: Pick<AuditLine, "id" | "label" | "course">) =>
  `${course ? `${course} → ` : ""}${label}, line ${id}`;

export const manualItemForLine = (line: number) => MANUAL_ITEMS.find((item) => item.line === line);

export const isOpenCheck = ({ id, state, courses }: AuditCheck) =>
  state === "check" && (id !== "grad-equivalence" || courses.length > 0);

export const shownChecks = (checks: readonly AuditCheck[]) =>
  checks.filter(({ id, courses }) => id !== "grad-equivalence" || courses.length > 0);

export function coursesInDoubt(checks: readonly AuditCheck[]): Set<string> {
  return new Set(checks.filter((check) => check.state === "check" && CHECKS_ABOUT_A_LINE.has(check.id)).flatMap((check) => check.courses));
}

export function lineState({ state, course }: Pick<AuditLine, "state" | "course">, inDoubt: ReadonlySet<string>): LineState {
  if (state === "empty") return "missing";
  return state === "done" && course && inDoubt.has(course) ? "check" : state;
}

export function sectionProgress({ name, done, planned, total, lines }: AuditSection, checks: readonly AuditCheck[]) {
  const doubted = coursesInDoubt(checks);
  const inDoubt = lines.filter((line) => lineState(line, doubted) === "check").length;
  const sectionId = SECTIONS.find((section) => section.name === name)?.id;
  const open = checks.some((check) => SECTION_OF_CHECK[check.id] === sectionId && isOpenCheck(check));
  return { confirmed: done - inDoubt, inDoubt, planned, open, complete: total > 0 && done >= total && !open };
}

const shortName = (label: string) => label.replace(/ area$/, "");

export function checkSentence({ label, state, courses }: AuditCheck): string {
  const name = shortName(label);
  const list = courses.join(", ");
  if (state === "check") return `${name}: ${CHECK_YOURSELF}`;
  if (state === "not-met") return `${name}: not met yet`;
  if (state === "planned") return `${name}: planned with ${list}`;
  return list ? `${name}: met by ${list}` : `${name}: met`;
}

const groupingOf = (code: string) => {
  const subject = code.split(" ")[0];
  return HUMANITIES_GROUPINGS.findIndex((grouping) => grouping.includes(subject));
};

export function canConfirmDepth({ id, courses }: AuditCheck): boolean {
  if (id !== "hua-depth" || courses.length < DEPTH_COURSES) return false;
  return courses.every((code) => groupingOf(code) === groupingOf(courses[0]));
}

export function checkHelp(check: AuditCheck): string | null {
  if (check.state !== "check" || canConfirmDepth(check)) return null;
  return HELP[check.id] ?? null;
}

export const isSmallCourse = (credits: number) => credits >= SMALLEST_COUNTED_CREDITS && credits < FULL_COURSE_CREDITS;
