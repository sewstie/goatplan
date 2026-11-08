"use client";

import { ListBullets, SquaresFour } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";
import { useDegreeUi } from "./degreeUi";
import { useFilterCount } from "./useFilterCount";
import type { DegreeView } from "./useDegreeView";

export function SheetControls({ view: sheet }: { view: DegreeView }) {
  const view = useDegreeUi((state) => state.view);
  const filter = useDegreeUi((state) => state.filter);
  const set = useDegreeUi((state) => state.set);
  const left = filter === "remaining";
  const count = useFilterCount(sheet);
  return (
    <div className="degree-sheet-controls flex flex-wrap items-center gap-10">
      <label className={cx("flex min-h-32 cursor-pointer items-center gap-7 rounded-pill border px-12 text-8-5 leading-13 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus", left ? "border-accent bg-accent-soft font-600 text-accent" : "border-line-button bg-surface text-ink-soft hover:bg-surface-selected")}>
        <input type="checkbox" className="sr-only" checked={left} onChange={(event) => set({ filter: event.target.checked ? "remaining" : null })} />
        {left ? `What’s left · ${count}` : "What’s left"}
      </label>
      <SegmentedSwitch label="Sheet or list" options={[{ value: "sheet", label: "Sheet", icon: <SquaresFour aria-hidden /> }, { value: "list", label: "List", icon: <ListBullets aria-hidden /> }]} value={view} onChange={(value) => set({ view: value })} />
    </div>
  );
}
