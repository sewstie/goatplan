"use client";

import { Circle, CircleDashed, CheckCircle, Info } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";
import { termLong, type SheetFilter } from "@/lib/degree";
import { DEFAULT_PACE, useDegreeUi } from "./degreeUi";
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
      className={cx("flex min-w-0 cursor-pointer flex-col items-start rounded-card border px-2 py-2 tablet:items-center tablet:px-17 tablet:py-6", active ? "border-choice-line bg-accent-soft" : "border-transparent hover:bg-surface-selected")}
    >
      <span className="flex items-center gap-7 text-17 leading-22 font-650 tablet:text-20">
        <span aria-hidden className="flex text-ink [&_svg]:size-14">{icon}</span>
        <span className={tone}>{value}</span>
      </span>
      <span className="pl-19 text-8 leading-14-4 whitespace-nowrap text-ink-muted tablet:pl-0">{label}</span>
    </button>
  );
}

export function DegreeSummary({ view }: { view: DegreeView }) {
  const whatIf = useDegreeUi((state) => state.whatIf);
  const { done, planned, toGo, toCheck, total } = view.sheet.summary;
  const trying = whatIf.perTerm !== DEFAULT_PACE || whatIf.summer;
  const finish = view.pace
    ? {
        eyebrow: trying ? "What-if credit finish" : "Estimated credit finish",
        title: termLong(view.pace.finish),
        text: `${whatIf.perTerm} courses / term · ${whatIf.summer ? "with summer" : "fall–spring"}`,
      }
    : { eyebrow: "Your pace", title: "Add terms to see your pace", text: "Add terms to completed courses" };

  return (
    <section aria-label="Your progress" className="rounded-panel border border-card-line bg-surface shadow-guide">
      <div className="flex flex-wrap items-center gap-x-16 px-17 py-14 tablet:flex-nowrap tablet:py-18 tablet:pl-25 tablet:pr-22">
        <div className="flex flex-1 items-center gap-12 tablet:flex-none wide:w-208 wide:border-r wide:border-line wide:py-4">
          <ProgressRing done={done} planned={planned} total={total} />
          <div>
            <p className="text-17 leading-22 font-650 tablet:text-21">{done} of {total}</p>
            <p className="pt-1 text-8 leading-14-4 text-ink-muted">lines completed</p>
          </div>
        </div>
        <div className="order-last mt-12 grid w-full grid-cols-4 gap-4 border-t border-line pt-12 tablet:order-none tablet:mt-0 tablet:flex-1 tablet:border-t-0 tablet:pt-0 wide:w-auto">
          <Stat icon={<CheckCircle />} value={done} label="Done" tone="text-accent" filter="done" />
          <Stat icon={<CircleDashed />} value={planned} label="Planned" tone="text-ink" filter="planned" />
          <Stat icon={<Circle />} value={toGo} label="To go" tone="text-ink" filter="toGo" />
          <Stat icon={<Info />} value={toCheck} label="To check" tone="text-notice-warning-ink" filter="toCheck" />
        </div>
        <div className="max-w-44/100 text-right tablet:hidden wide:block wide:w-258 wide:max-w-none wide:border-l wide:border-line wide:py-1 wide:pl-22 wide:text-left">
            <p className="text-micro leading-13 text-ink-muted wide:text-caption wide:leading-14-4">{finish.eyebrow}</p>
            <p className="pt-3 text-9 leading-15 font-650 wide:text-21 wide:leading-24-7">{finish.title}</p>
            <p className="pt-3 text-micro leading-13 text-ink-muted wide:text-caption wide:leading-14-4">{finish.text}</p>
        </div>
      </div>
      <div className="hidden items-center justify-between gap-12 border-t border-line px-14 py-10 tablet:flex wide:hidden">
        <p className="flex items-baseline gap-10"><span className="text-8 leading-14-4 text-ink-muted">{finish.eyebrow}</span><span className="text-9 leading-15 font-650">{finish.title}</span></p>
        <p className="text-8 leading-14-4 text-ink-muted">{finish.text}</p>
      </div>
    </section>
  );
}
