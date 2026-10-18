"use client";

import type { KeyboardEvent, Ref } from "react";
import type { Course } from "@/lib/data/types";
import type { CourseFit } from "./courseFit";
import { courseCount } from "./courseSummary";
import { nextIndex } from "./listNavigation";
import { SearchResultCard } from "./SearchResultCard";

export type ShownResult = { course: Course; fit: CourseFit | null; added: boolean };

type SearchResultsProps = {
  results: ShownResult[];
  total: number;
  onAdd(code: string): void;
  onLeave(): void;
  listRef: Ref<HTMLUListElement>;
};

/** "Search results" and the result cards. Up and down arrows move between the Add buttons. */
export function SearchResults({ results, total, onAdd, onLeave, listRef }: SearchResultsProps) {
  function onKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onLeave();
      return;
    }
    const target = event.target as HTMLElement;
    if (!target.matches("[data-result-action]")) return;
    const actions = [...event.currentTarget.querySelectorAll<HTMLElement>("[data-result-action]")];
    const index = nextIndex(actions.indexOf(target), actions.length, event.key);
    if (index === null) return;
    event.preventDefault();
    if (index < 0) onLeave();
    else actions[index].focus();
  }

  return (
    <section aria-labelledby="search-results-heading" className="flex shrink-0 flex-col pb-18">
      <div className="flex items-end justify-between gap-8 pb-10">
        <h2 id="search-results-heading" className="text-11 leading-15-95 font-650">
          Search results
        </h2>
        <span className="text-9 leading-13 font-450 text-ink-muted">{courseCount(total)}</span>
      </div>
      <ul ref={listRef} onKeyDown={onKeyDown} className="flex flex-col gap-5">
        {results.map((result) => (
          <SearchResultCard key={result.course.code} {...result} onAdd={onAdd} />
        ))}
      </ul>
      {total > results.length && (
        <p className="px-2 pt-8 text-9 leading-14-4 text-ink-muted">
          Showing the first {results.length}. Type more to narrow the list.
        </p>
      )}
    </section>
  );
}
