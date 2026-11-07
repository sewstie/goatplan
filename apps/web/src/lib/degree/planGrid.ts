import { compareTerms, parseTerm, termLong, type TermName } from "./terms";
import type { DegreeHistory, HistoryCourse } from "./history";

export function planYears(startYear: number) {
  return Array.from({ length: 4 }, (_, index) => {
    const year = startYear + index;
    return { year, terms: (["A", "B", "C", "D", "E"] as const).map((letter) => ({ letter, year: year + ("CDE".includes(letter) ? 1 : 0) })) };
  });
}

export function coursesInTerm(history: DegreeHistory, term: TermName): HistoryCourse[] {
  return history.courses.filter((course) => {
    const named = parseTerm(course.term);
    return named?.year === term.year && named.letter === term.letter;
  });
}

export type PlanState = "taken" | "progress" | "planned";

export function coursePlanState(course: HistoryCourse, current: TermName | null): PlanState {
  const named = parseTerm(course.term);
  if (course.status === "taken") return "taken";
  return named && current && compareTerms(named, current) === 0 ? "progress" : "planned";
}

export function stateForTerm(term: TermName | null, current: TermName | null): PlanState {
  if (!term || !current) return "taken";
  const order = compareTerms(term, current);
  return order < 0 ? "taken" : order === 0 ? "progress" : "planned";
}

export const statusOfState = (state: PlanState): HistoryCourse["status"] => (state === "taken" ? "taken" : "planned");

export function planTerms(startYear: number): TermName[] {
  return planYears(startYear).flatMap(({ terms }, index) => (index === 3 ? terms.slice(0, 4) : terms));
}

export function moveCourseTerm(history: DegreeHistory, code: string, term: TermName): DegreeHistory {
  return { ...history, courses: history.courses.map((course) => course.code === code ? { ...course, term: termLong(term) } : course) };
}

export function defaultAddTerm(startYear: number, current: TermName): TermName {
  const terms = planTerms(startYear).filter((term) => term.letter !== "E");
  const index = terms.findIndex((term) => compareTerms(term, current) >= 0);
  if (index === -1) return terms[terms.length - 1];
  return terms[Math.max(0, index - 1)];
}
