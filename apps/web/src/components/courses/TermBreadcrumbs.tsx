"use client";

import { usePlanner } from "@/lib/store";
import type { Term } from "@/lib/data";

/** "Spring 2027 / C Term" above the title. The header keeps its height while this is empty. */
export function TermBreadcrumbs({ shownTerm }: { shownTerm?: Pick<Term, "name" | "season" | "year"> }) {
  const current = usePlanner((state) => state.terms.find((item) => item.id === state.termId) ?? null);
  const term = shownTerm ?? current;
  if (!term) return null;

  return (
    <>
      <span>
        {term.season} {term.year}
      </span>
      <span aria-hidden>/</span>
      <span>{term.name}</span>
    </>
  );
}
