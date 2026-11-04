import { nextTerm, parseTerm, PRIOR_CREDIT, termLong, termsBetween, type TermName } from "@/lib/degree";

const YEARS_BACK = 4;

export function termChoices(openTerm: TermName | null, current?: string) {
  const end = openTerm ? nextTerm(openTerm) : null;
  const terms = end ? termsBetween({ letter: "A", year: end.year - YEARS_BACK }, end, true).reverse().map(termLong) : [];
  const options = [{ value: "", label: "No term" }, { value: PRIOR_CREDIT, label: PRIOR_CREDIT }, ...terms.map((term) => ({ value: term, label: term }))];
  if (current && !options.some((option) => option.value === current)) {
    const named = parseTerm(current);
    options.splice(2, 0, { value: current, label: named ? termLong(named) : current });
  }
  return options;
}
