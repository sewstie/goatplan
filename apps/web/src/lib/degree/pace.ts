import { nextTerm, type TermName } from "./terms";

export const SUMMER_COURSES = 2;
export const SEMESTER_LOADS = [5, 6, 7] as const;
export const DEFAULT_SEMESTER_LOAD = 6;
const FIRST_HALF = 3;

export interface PaceInput {
  linesToGo: number;
  coursesPerSemester: number;
  summer: boolean;
  openTerm: TermName;
}

export interface PaceEstimate {
  finish: TermName;
  terms: number;
}

export function termLoad(letter: TermName["letter"], coursesPerSemester: number): number {
  if (letter === "E") return SUMMER_COURSES;
  return letter === "A" || letter === "C" ? FIRST_HALF : Math.max(0, coursesPerSemester - FIRST_HALF);
}

export function estimatePace({ linesToGo, coursesPerSemester, summer, openTerm }: PaceInput): PaceEstimate {
  let left = Math.max(0, linesToGo);
  let finish = openTerm;
  let terms = 0;
  while (left > 0 && coursesPerSemester > 0) {
    finish = nextTerm(finish, summer);
    left -= termLoad(finish.letter, coursesPerSemester);
    terms += 1;
  }
  return { finish, terms };
}

export function earlierThan(fewer: PaceEstimate, more: PaceEstimate): number {
  return more.terms - fewer.terms;
}
