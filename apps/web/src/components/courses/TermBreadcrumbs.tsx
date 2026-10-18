"use client";

import { CaretRight } from "@phosphor-icons/react/ssr";
import { usePlanner } from "@/lib/store";
import type { Term } from "@/lib/data";

/** "Spring 2027 > C Term" above the title. The header keeps its height while this is empty. */
export function TermBreadcrumbs({ shownTerm }: { shownTerm?: Pick<Term, "name" | "season" | "year"> }) {
  const current = usePlanner((state) => state.terms.find((item) => item.id === state.termId) ?? null);
  const term = shownTerm ?? current;
  if (!term) return null;

  return (
    <>
      <span>
        {term.season} {term.year}
      </span>
      <CaretRight aria-hidden className="size-10 text-ink" />
      <span className="font-550 text-ink">{term.name}</span>
    </>
  );
}
