"use client";

import { BookOpen, ChartBar } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { CheckField } from "@/components/ui/CheckField";
import { DEFAULT_SEMESTER_LOAD, graduationMonth, graduationSemester, SEMESTER_LOADS } from "@/lib/degree";
import { useDegreeUi } from "./degreeUi";
import { InsightCard } from "./InsightCard";
import type { DegreeView } from "./useDegreeView";

const loadCredits = (courses: number) => courses * 3;

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
  const usual = `${loadCredits(DEFAULT_SEMESTER_LOAD)} credits`;
  const subtitle = whatIf.perSemester === DEFAULT_SEMESTER_LOAD
    ? "Estimated graduation · after the current plan"
    : earlier === 0
      ? `Same graduation as ${usual}`
      : earlier > 0
        ? `${semesters(earlier)} earlier than ${usual}`
        : `${semesters(-earlier)} later than ${usual}`;

  return (
    <InsightCard title="Pace & what-if" badge="Estimate">
      <p className="text-tile leading-14-4 text-ink-muted">At {loadCredits(whatIf.perSemester)} credits a semester</p>
      <p className="pt-4 text-25 leading-30 font-650 tracking-title text-accent tablet:text-20 tablet:leading-24-7 tablet:tracking-normal">Graduating {graduationMonth(pace.finish)}</p>
      <p className="pt-2 text-tile leading-14-4 text-ink-muted">{subtitle}</p>
      <div className="pt-20 tablet:pt-8">
        <input
          type="range"
          aria-label="Credits per semester"
          aria-valuetext={`${loadCredits(whatIf.perSemester)} credits`}
          min={SEMESTER_LOADS[0]}
          max={SEMESTER_LOADS[SEMESTER_LOADS.length - 1]}
          step={1}
          value={whatIf.perSemester}
          onChange={(event) => change({ perSemester: Number(event.target.value) })}
          style={{ "--pace-fill": `${((whatIf.perSemester - SEMESTER_LOADS[0]) / (SEMESTER_LOADS.length - 1)) * 100}%` } as React.CSSProperties}
          className="pace-slider h-16 w-full cursor-pointer appearance-none bg-transparent"
        />
        <div aria-hidden className="flex justify-between pt-3 text-8 leading-16 text-ink-muted">
          {SEMESTER_LOADS.map((load) => <span key={load} className={load === whatIf.perSemester ? "font-650 text-accent" : undefined}>{loadCredits(load)}</span>)}
        </div>
        <p className="pt-4 text-8 leading-16 text-ink-muted">Credits per semester</p>
      </div>
      <div className="flex flex-col gap-14 pt-14 tablet:flex-row tablet:flex-wrap tablet:gap-x-14 tablet:gap-y-6 tablet:pt-8">
        <CheckField label="Include summer / E-term" labelClassName="text-8 leading-16 font-450" checked={whatIf.summer} onChange={(event) => change({ summer: event.target.checked })} />
      </div>
      <p className="mt-14 border-t border-line pt-14 tablet:mt-8 tablet:pt-8 text-caption leading-14-4 text-ink-muted">Credit pace is an estimate. IQP, MQP, course availability and sequencing can change the date.</p>
    </InsightCard>
  );
}
