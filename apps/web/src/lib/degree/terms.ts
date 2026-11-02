export interface TermName {
  letter: "A" | "B" | "C" | "D" | "E";
  year: number;
}

export const PRIOR_CREDIT = "Prior credit";

/** C and D come first in a calendar year, then summer, then the new academic year's A and B. */
const ORDER: Record<TermName["letter"], number> = { C: 1, D: 2, E: 3, A: 4, B: 5 };
const REGULAR_AFTER: Record<TermName["letter"], TermName["letter"]> = { C: "D", D: "A", E: "A", A: "B", B: "C" };

const fullYear = (text: string) => (text.length === 2 ? 2000 + Number(text) : Number(text));

/** Reads "A Term 2026", "A 2026", "A26" and "2027-C". Null for anything else, like "Prior credit". */
export function parseTerm(text: string | undefined | null): TermName | null {
  if (!text) return null;
  const clean = text.trim();
  const id = /^(\d{4})\s*-\s*([A-E])$/i.exec(clean);
  if (id) return { letter: id[2].toUpperCase() as TermName["letter"], year: Number(id[1]) };
  const named = /^([A-E])(?:\s*-?\s*term)?\s*[-']?\s*(\d{4}|\d{2})$/i.exec(clean);
  if (named) return { letter: named[1].toUpperCase() as TermName["letter"], year: fullYear(named[2]) };
  return null;
}

export const termShort = ({ letter, year }: TermName) => `${letter}${String(year).slice(-2)}`;
export const termLong = ({ letter, year }: TermName) => `${letter} Term ${year}`;
export const termRank = ({ letter, year }: TermName) => year * 10 + ORDER[letter];
export const compareTerms = (a: TermName, b: TermName) => termRank(a) - termRank(b);

export function nextTerm({ letter, year }: TermName, summer = false): TermName {
  if (letter === "D" && summer) return { letter: "E", year };
  const next = REGULAR_AFTER[letter];
  return { letter: next, year: next === "C" ? year + 1 : year };
}

/** Every term from one to the other, both included. Summer terms only show up if asked for. */
export function termsBetween(first: TermName, last: TermName, summer = false): TermName[] {
  const list: TermName[] = [];
  for (let term = first; termRank(term) <= termRank(last); term = nextTerm(term, summer)) list.push(term);
  return list;
}
