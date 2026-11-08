import { termLong } from "@/lib/degree";
import { planTerms } from "@/lib/degree/planGrid";

export function termChoices(startYear = 2026) {
  return [{ value: "", label: "No term" }, ...planTerms(startYear).map((term) => ({ value: termLong(term), label: termLong(term) }))];
}
