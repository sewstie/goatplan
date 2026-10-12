// Decides which terms get published. WPI's file always holds every term, old
// and far-off ones included, so the filtering happens here, after fetching.
//
// The rules are explained in docs/data-format.md ("Which terms are published").

// Today's date in New York as "2026-10-11". GitHub's runners use UTC, where
// the last hours of a New York day already count as tomorrow, and that would
// end a term a few hours early.
export function todayInNewYork(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type) => parts.find((p) => p.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

// WPI's academic year starts with A Term in the fall and ends the next
// calendar year, so 2026 Fall and 2027 Spring are both academic year 2026.
const academicYear = (term) => (term.season === "Fall" ? term.year : term.year - 1);
const letter = (term) => term.id.split("-")[1];

// Splits the built terms into the ones to publish on `today` and the rest.
//
//   - A term that has ended is dropped. Its last day still counts as current.
//   - Next academic year's terms are held back until this year's C Term has
//     ended (the C/D break), using the C Term end date from the data.
//   - Every term kept is labelled "in-progress" or "upcoming".
//
// `today` is a New York date like "2026-10-11"; ISO dates compare correctly as
// plain strings. Returns { kept: [{ term, courses, status }], dropped: [{ id, reason }] }.
export function selectTerms(terms, today) {
  const hasEnded = (term) => term.end < today;
  const open = terms.filter(({ term }) => !hasEnded(term));
  const dropped = terms
    .filter(({ term }) => hasEnded(term))
    .map(({ term }) => ({ id: term.id, reason: `ended ${term.end}` }));
  if (open.length === 0) return { kept: [], dropped };

  // "This year" is the academic year of the earliest term that is still open.
  const thisYear = Math.min(...open.map(({ term }) => academicYear(term)));
  const isThisYear = ({ term }) => academicYear(term) === thisYear;
  const cTerm = terms.find((t) => isThisYear(t) && letter(t.term) === "C")?.term;
  // Once WPI removes C Term from its file, it is over if only D Term or later is left.
  const cTermEnded = cTerm
    ? hasEnded(cTerm)
    : open.filter(isThisYear).every(({ term }) => letter(term) > "C");

  const kept = [];
  for (const { term, courses } of open) {
    const yearsAhead = academicYear(term) - thisYear;
    if (yearsAhead === 0 || (yearsAhead === 1 && cTermEnded)) {
      kept.push({ term, courses, status: term.start <= today ? "in-progress" : "upcoming" });
    } else if (yearsAhead === 1) {
      const until = cTerm ? `C Term ends ${cTerm.end}` : "this year's C Term has ended";
      dropped.push({ id: term.id, reason: `next year's term, held back until ${until}` });
    } else {
      dropped.push({ id: term.id, reason: "more than a year ahead" });
    }
  }
  return { kept, dropped };
}
