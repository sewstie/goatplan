"use client";

import { X } from "@phosphor-icons/react/ssr";
import { FILTER_WORDS } from "@/lib/degree";
import { useDegreeUi } from "./degreeUi";
import { useFilterCount } from "./useFilterCount";
import type { DegreeView } from "./useDegreeView";

export function FilterBar({ view }: { view: DegreeView }) {
  const filter = useDegreeUi((state) => state.filter);
  const set = useDegreeUi((state) => state.set);
  const count = useFilterCount(view);
  if (!filter || filter === "remaining") return null;
  return (
    <div role="status" className="-mb-8 flex items-center gap-8">
      <span className="rounded-row bg-accent-soft px-8 py-5 text-8 leading-12 font-600 text-accent">{FILTER_WORDS[filter].chip} · {count} {count === 1 ? "line" : "lines"}</span>
      <button type="button" aria-label="Clear filter" onClick={() => set({ filter: null })} className="flex cursor-pointer items-center gap-4 rounded-badge text-8 leading-12 font-600 text-accent hover:underline">
        <X aria-hidden className="size-11" />
        Clear
      </button>
    </div>
  );
}
