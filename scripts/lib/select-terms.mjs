// Picks which terms get published. The rules are in docs/data-format.md.

// GitHub's runners are on UTC, which would end a term a few hours early.
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

// 2026 Fall and 2027 Spring are both academic year 2026.
const academicYear = (term) => (term.season === "Fall" ? term.year : term.year - 1);
const letter = (term) => term.id.split("-")[1];

export function selectTerms(terms, today) {
  const hasEnded = (term) => term.end < today;
  const open = terms.filter(({ term }) => !hasEnded(term));
  const dropped = terms
    .filter(({ term }) => hasEnded(term))
    .map(({ term }) => ({ id: term.id, reason: `ended ${term.end}` }));
  if (open.length === 0) return { kept: [], dropped };

  // "This year" is the academic year of the earliest term still open.
  const thisYear = Math.min(...open.map(({ term }) => academicYear(term)));
  const isThisYear = ({ term }) => academicYear(term) === thisYear;
  const cTerm = terms.find((t) => isThisYear(t) && letter(t.term) === "C")?.term;
  // If WPI already removed C Term from its file, it's over once only D Term or later is left.
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
