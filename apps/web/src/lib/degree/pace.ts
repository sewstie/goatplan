import { nextTerm, type TermName } from "./terms";

export const SUMMER_COURSES = 2;

export interface PaceInput {
  linesToGo: number;
  coursesPerTerm: number;
  summer: boolean;
  openTerm: TermName;
}

export interface PaceEstimate {
  finish: TermName;
  terms: number;
}

export function estimatePace({ linesToGo, coursesPerTerm, summer, openTerm }: PaceInput): PaceEstimate {
  let left = Math.max(0, linesToGo);
  let finish = openTerm;
  let terms = 0;
  while (left > 0) {
    finish = nextTerm(finish, summer);
    left -= finish.letter === "E" ? Math.min(SUMMER_COURSES, coursesPerTerm) : coursesPerTerm;
    terms += 1;
  }
  return { finish, terms };
}

export function earlierThan(fewer: PaceEstimate, more: PaceEstimate): number {
  return more.terms - fewer.terms;
}
