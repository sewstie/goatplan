"use client";

import { X } from "@phosphor-icons/react/ssr";
import { FILTER_WORDS, tileMatchesFilter } from "@/lib/degree";
import { useDegreeUi } from "./degreeUi";
import type { DegreeView } from "./useDegreeView";

export function FilterBar({ view }: { view: DegreeView }) {
  const filter = useDegreeUi((state) => state.filter);
  const set = useDegreeUi((state) => state.set);
  if (!filter) return null;
  const count = view.sheet.sections.flatMap((section) => section.tiles).filter((tile) => tile.line !== 7 && tileMatchesFilter(tile, filter)).length;
  const { chip, sentence } = FILTER_WORDS[filter];
  return (
    <div className="-mb-8 flex flex-wrap items-center justify-between gap-8" role="status">
      <p className="flex items-center gap-12">
        <span className="rounded-row bg-accent-soft px-8 py-5 text-8 leading-12 font-600 text-accent">{chip} · {count} lines</span>
        <span className="text-8-5 leading-16 text-ink-muted">{sentence}</span>
      </p>
      <button type="button" onClick={() => set({ filter: null })} className="flex cursor-pointer items-center gap-6 rounded-badge text-8 leading-12 font-600 text-accent hover:underline">
        Clear filter
        <X aria-hidden className="size-11 text-ink" />
      </button>
    </div>
  );
}
