"use client";

import { BookOpen, ChartBar } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { CheckField } from "@/components/ui/CheckField";
import { graduationMonth, graduationSemester } from "@/lib/degree";
import { DEFAULT_PACE, useDegreeUi } from "./degreeUi";
import { InsightCard } from "./InsightCard";
import type { DegreeView } from "./useDegreeView";

const PACES = [2, 3, 4, 5];

export function PaceCard({ view }: { view: DegreeView }) {
  const whatIf = useDegreeUi((state) => state.whatIf);
  const set = useDegreeUi((state) => state.set);
  const open = useDegreeUi((state) => state.open);
  const { pace } = view;

  if (!pace) {
    return (
      <InsightCard title="Pace & what-if" badge="Estimate">
        <div className="flex flex-1 flex-col items-center justify-center px-16 pt-12 pb-20 text-center">
          <ChartBar aria-hidden className="size-26 text-ink-soft" />
          <p className="pt-12 text-11 leading-20-35 font-650">Add terms to see your pace</p>
          <p className="max-w-300 pt-8 text-8-5 leading-17 text-ink-muted">We need at least two dated history entries. Your course credits still count.</p>
          <Button variant="secondary" icon={<BookOpen aria-hidden />} className="mt-14 min-h-36" onClick={() => open({ kind: "history", tab: "history" })}>Add course terms</Button>
        </div>
      </InsightCard>
    );
  }

  const change = (changes: Partial<typeof whatIf>) => set({ whatIf: { ...whatIf, ...changes } });
  const earlier = graduationSemester(pace.base.finish) - graduationSemester(pace.finish);
  const semesters = (count: number) => `${count} ${count === 1 ? "semester" : "semesters"}`;
  const subtitle = whatIf.perTerm === DEFAULT_PACE
    ? "Estimated graduation · after the current plan"
    : earlier === 0
      ? `Same graduation as ${DEFAULT_PACE} per term`
      : earlier > 0
        ? `${semesters(earlier)} earlier than ${DEFAULT_PACE} per term`
        : `${semesters(-earlier)} later than ${DEFAULT_PACE} per term`;
  const fill = ((whatIf.perTerm - 2) / 3) * 100;

  return (
    <InsightCard title="Pace & what-if" badge="Estimate">
      <p className="text-tile leading-14-4 text-ink-muted">At {whatIf.perTerm} courses per term</p>
      <p className="pt-4 text-25 leading-30 font-650 tracking-title text-accent tablet:text-20 tablet:leading-24-7 tablet:tracking-normal">Graduating {graduationMonth(pace.finish)}</p>
      <p className="pt-2 text-tile leading-14-4 text-ink-muted">{subtitle}</p>
      <div className="pt-20 tablet:pt-8">
        <input
          type="range"
          aria-label="Courses per term"
          min={2}
          max={5}
          step={1}
          value={whatIf.perTerm}
          onChange={(event) => change({ perTerm: Number(event.target.value) })}
          style={{ "--pace-fill": `${fill}%` } as React.CSSProperties}
          className="pace-slider h-16 w-full cursor-pointer appearance-none bg-transparent"
        />
        <div aria-hidden className="flex justify-between pt-3 text-caption leading-14-4 text-ink-muted tablet:text-8">
          {PACES.map((number) => <span key={number} className={number === whatIf.perTerm ? "font-650 text-accent" : undefined}>{number}</span>)}
        </div>
        <p className="pt-4 text-caption leading-14-4 text-ink-muted">Courses per term</p>
      </div>
      <div className="flex flex-col gap-14 pt-14 tablet:flex-row tablet:flex-wrap tablet:gap-x-14 tablet:gap-y-6 tablet:pt-8">
        <CheckField label="Include summer / E-term" labelClassName="text-8 leading-16 font-450" checked={whatIf.summer} onChange={(event) => change({ summer: event.target.checked })} />
      </div>
      <p className="mt-14 border-t border-line pt-14 tablet:mt-8 tablet:pt-8 text-caption leading-14-4 text-ink-muted">Credit pace is an estimate. IQP, MQP, course availability and sequencing can change the date.</p>
    </InsightCard>
  );
}
