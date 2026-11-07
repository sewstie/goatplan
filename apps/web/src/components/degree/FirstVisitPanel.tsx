"use client";

import { GraduationCap, MagnifyingGlass, Plus } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { useDegreeUi } from "./degreeUi";

export function FirstVisitPanel() {
  const open = useDegreeUi((state) => state.open);
  return (
    <section className="flex flex-col gap-14 rounded-panel border border-card-line bg-surface px-22 py-20 tablet:flex-row tablet:items-center tablet:justify-between">
      <div className="flex items-center gap-15">
        <span aria-hidden className="flex size-38 shrink-0 items-center justify-center rounded-card bg-accent-soft text-ink [&_svg]:size-22"><GraduationCap /></span>
        <div>
          <h2 className="text-12 leading-19-2 font-700">Your sheet starts here</h2>
          <p className="pt-4 text-8-5 leading-16 text-ink-muted">Add the courses you’ve taken to see it fill up.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-8">
        <Button icon={<MagnifyingGlass aria-hidden />} className="min-h-38 px-14" onClick={() => open({ kind: "history", tab: "search" })}>Find your courses</Button>
        <Button variant="secondary" icon={<Plus aria-hidden />} className="min-h-38 px-14" onClick={() => open({ kind: "manual" })}>Add AP or IB credit</Button>
      </div>
    </section>
  );
}
