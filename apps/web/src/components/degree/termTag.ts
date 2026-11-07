import { compareTerms, sameTerm, type TermName } from "@/lib/degree";

export function termTag(term: TermName | null, current: TermName): string | null {
  if (!term) return null;
  if (sameTerm(term, current)) return "Now";
  if (term.letter === "E") return "Summer";
  return compareTerms(term, current) < 0 ? "Past" : null;
}
