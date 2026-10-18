import type { Term, TermSummary } from "./types";

const newYorkDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's date in New York as "YYYY-MM-DD", the time zone the data uses. */
export function newYorkDate(now: Date = new Date()): string {
  return newYorkDay.format(now);
}

/** A term counts as current through its last day. */
export function isTermOver(term: Pick<Term, "end">, now: Date = new Date()): boolean {
  return term.end < newYorkDate(now);
}

/** The data can be a day old, so pickers hide terms that ended since it was made. */
export function openTerms<T extends Pick<Term, "end">>(terms: readonly T[], now: Date = new Date()): T[] {
  return terms.filter((term) => !isTermOver(term, now));
}

/** The remembered term if it's still open, else the first upcoming one, else the first open one. */
export function pickDefaultTerm(
  terms: readonly TermSummary[],
  rememberedId: string | null,
  now: Date = new Date(),
): TermSummary | null {
  const open = openTerms(terms, now);
  return (
    open.find((term) => term.id === rememberedId) ??
    open.find((term) => term.status === "upcoming") ??
    open[0] ??
    null
  );
}
