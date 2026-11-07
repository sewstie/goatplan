"use client";

import { Circle, CircleDashed, CheckCircle, Info } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";
import { formatUnits, type SheetFilter } from "@/lib/degree";
import { useDegreeUi } from "./degreeUi";
import { ProgressRing } from "./ProgressRing";
import type { DegreeView } from "./useDegreeView";

function Stat({ icon, value, label, tone, filter }: { icon: ReactNode; value: number; label: string; tone: string; filter: SheetFilter }) {
  const active = useDegreeUi((state) => state.filter === filter);
  const set = useDegreeUi((state) => state.set);
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`${value} ${label}. Show only these lines on the sheet`}
      onClick={() => set({ filter: active ? null : filter, selectedTerm: null })}
      className={cx("flex min-w-0 cursor-pointer flex-col items-start rounded-card border px-2 py-2 tablet:items-center tablet:px-2 tablet:py-4", active ? "border-choice-line bg-accent-soft" : "border-transparent hover:bg-surface-selected")}
    >
      <span className="flex items-center gap-7 text-17 leading-22 font-650">
        <span aria-hidden className="flex text-ink [&_svg]:size-14">{icon}</span>
        <span className={tone}>{value}</span>
      </span>
      <span className="pl-19 text-8 leading-14-4 whitespace-nowrap text-ink-muted tablet:pl-0">{label}</span>
    </button>
  );
}

function Counters({ view }: { view: DegreeView }) {
  const { done, planned, toGo, toCheck } = view.sheet.summary;
  return (
    <>
      <Stat icon={<CheckCircle />} value={done} label="Done" tone="text-success-ink" filter="done" />
      <Stat icon={<CircleDashed />} value={planned} label="Planned" tone="text-accent" filter="planned" />
      <Stat icon={<Circle />} value={toGo} label="To go" tone="text-ink" filter="toGo" />
      <Stat icon={<Info />} value={toCheck} label="To check" tone="text-notice-warning-ink" filter="toCheck" />
    </>
  );
}

export function DegreeProgressCard({ view }: { view: DegreeView }) {
  const { done, planned, total } = view.sheet.summary;
  return (
    <section aria-label="Your progress" className="flex flex-col gap-8 rounded-panel border border-card-line bg-surface px-14 py-12">
      <div className="flex items-center gap-12">
        <ProgressRing done={done} planned={planned} total={total} />
        <div>
          <p className="text-21 leading-24-7 font-650">{done} of {total}</p>
          <p className="text-8 leading-14-4 text-ink-muted">lines completed</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 border-t border-line pt-8">
        <Counters view={view} />
      </div>
    </section>
  );
}

export function DegreeSummary({ view }: { view: DegreeView }) {
  const { done, planned, total } = view.sheet.summary;
  const credits = view.credits.bars.reduce((sum, bar) => sum + bar.done, view.credits.noTerm.done);
  return (
    <section aria-label="Your progress" className="degree-progress rounded-panel border border-card-line bg-surface">
      <div className="degree-progress-total">
        <ProgressRing done={done} planned={planned} total={total} />
        <div><p className="text-17 leading-22 font-650">{done} of {total}</p><p className="pt-4 text-caption text-ink-muted">lines completed</p></div>
      </div>
      <div className="degree-progress-counts"><Counters view={view} /></div>
      <div className="degree-residency">
        <p>{formatUnits(credits)} of 15 units</p>
        <div className="degree-residency-track"><span style={{ width: `${Math.min(100, credits / 135 * 100)}%` }} /></div>
        <p>Earned credit · includes transfer and exam credit</p>
      </div>
    </section>
  );
}
