// Catches an update that lost a big part of a term. The rule is in docs/data-format.md.

export const MAX_DROP = 0.1;

export function sectionDrops(committed, updated, today) {
  const now = new Map(updated.terms.map((term) => [term.id, term.sections]));
  return committed.terms
    .filter((term) => term.end >= today)
    .map((term) => ({ id: term.id, before: term.sections, after: now.get(term.id) ?? 0 }))
    .filter(({ before, after }) => after < before * (1 - MAX_DROP));
}
