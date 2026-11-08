import type { TermSummary } from "@/lib/data/types";
import { newYorkDate } from "@/lib/data/terms";
import { compareTerms, nextTerm, parseTerm, termAt, type TermName } from "../terms";

export function recommendationTerms(choices: readonly TermName[], start: TermName, count: number): TermName[] {
  if (!Number.isInteger(count) || count < 1 || count > 4 || start.letter === "E") throw new Error("Choose one to four regular terms.");
  const result: TermName[] = [];
  for (let term = start; result.length < count; term = nextTerm(term)) {
    if (!choices.some((choice) => compareTerms(choice, term) === 0)) break;
    result.push(term);
  }
  if (!result.length) throw new Error("Choose a supported starting term.");
  return result;
}
export function defaultRecommendationTerm(choices: readonly TermName[], now: Date, published: readonly TermSummary[] = []): TermName | null {
  const [year, month, day] = newYorkDate(now).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const current = termAt(date);
  const future = published.filter((term) => term.start > newYorkDate(now) && !term.id.endsWith("-E")).sort((a, b) => a.start.localeCompare(b.start))[0];
  const next = current.year > year ? current : nextTerm(current);
  const publishedNext = parseTerm(future?.id);
  const first = publishedNext && compareTerms(publishedNext, next) < 0 ? publishedNext : next;
  return [...choices].filter((term) => term.letter !== "E" && compareTerms(term, first) >= 0).sort(compareTerms)[0] ?? null;
}
