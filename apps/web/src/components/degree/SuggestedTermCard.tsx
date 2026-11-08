"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { CalendarBlank, CaretDown, Check, WarningCircle } from "@phosphor-icons/react/ssr";
import { termLong } from "@/lib/degree";
import type { Choice, RecommendedTerm } from "@/lib/degree/recommendations/planner";
import { unitLabel } from "@/lib/degree/units";
import { cx } from "@/components/ui/cx";
import { RecommendationCourse } from "./RecommendationCourse";
import { termLoad } from "./termLoad";

type RowProps = Pick<ComponentProps<typeof RecommendationCourse>, "confirmations" | "onConfirm">;

type SuggestedTermCardProps = RowProps & {
  row: RecommendedTerm;
  cap: number;
  selected: readonly string[];
  keptCodes: readonly string[];
  select(code: string, checked: boolean): void;
  keep(code: string, credits?: number): void;
  exclude(code: string): void;
  planner?: ReactNode;
};

const FIRST_OPTIONS = 5;
const OFFERED_FIRST: Record<Choice["offering"]["state"], number> = { confirmed: 0, estimated: 1, unknown: 2, absent: 3, failed: 4 };

export function SuggestedTermCard({ row, cap, selected, keptCodes, select, keep, exclude, planner, confirmations, onConfirm }: SuggestedTermCardProps) {
  const [showAll, setShowAll] = useState(false);
  const name = termLong(row.term);
  const load = termLoad(row, selected, cap);
  const open = row.state === "open";
  const options = [...row.alternatives].sort((a, b) => OFFERED_FIRST[a.offering.state] - OFFERED_FIRST[b.offering.state]);
  const shown = showAll ? options : options.slice(0, FIRST_OPTIONS);
  const outside = "Courses outside CS aren’t suggested yet, so check other options.";
  return (
    <section aria-label={name} className="flex flex-col rounded-card border border-card-line bg-surface px-14 pt-12 pb-6">
      <header className="flex items-center gap-8">
        <h3 className="text-10 leading-15 font-650">{name}</h3>
        <span className="ml-auto text-8 leading-12 text-ink-muted">{load.label}</span>
      </header>
      <div aria-hidden className="mt-8 h-4 overflow-hidden rounded-full bg-track"><div className={cx("h-full rounded-full", load.over ? "bg-warning" : "bg-accent")} style={{ width: `${load.fill}%` }} /></div>

      {row.existing.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 pt-10">
          <span className="pr-2 text-8 leading-12 text-ink-muted">Already in this term</span>
          {row.existing.map((choice) => (
            <span key={choice.course.code} className="inline-flex items-center gap-3 rounded-badge bg-neutral-soft px-6 py-2 text-8 leading-12 font-570 text-neutral-ink">
              {choice.course.status === "taken" ? <Check aria-hidden weight="bold" className="size-10" /> : <CalendarBlank aria-hidden className="size-10" />}{choice.course.code}
              <span className="sr-only">{choice.course.status === "taken" ? ", taken" : ", planned"}</span>
            </span>
          ))}
        </div>
      )}

      {row.issues.length > 0 && (
        <ul aria-label={`To check in ${name}`} className="mt-10 flex flex-col gap-3 rounded-row bg-notice-warning px-10 py-8 text-8-5 leading-15 text-notice-warning-ink">
          {row.issues.map((issue, index) => <li key={index} className="flex gap-6"><WarningCircle aria-hidden className="mt-2 size-12 shrink-0" />{issue}</li>)}
        </ul>
      )}

      {open && <>
        <h4 className="pt-12 text-8 leading-12 font-650 tracking-[0.04em] text-ink-muted uppercase">Suggested</h4>
        {row.additions.length > 0
          ? <ul aria-label={`Suggested for ${name}`} className="divide-y divide-line">{row.additions.map((choice) => <RecommendationCourse key={choice.course.code} choice={choice} confirmations={confirmations} onConfirm={onConfirm} selected={selected.includes(choice.course.code)} onSelect={(checked) => select(choice.course.code, checked)} onExclude={() => exclude(choice.course.code)} />)}</ul>
          : <p className="py-10 text-8-5 leading-15 text-ink-muted">{row.unused === 0 ? "This term is already full." : `Nothing from CS fit here. ${outside}`}</p>}
        {row.additions.length > 0 && row.unused > 0 && <p className="pb-6 text-8 leading-13 text-ink-muted">Room for {unitLabel(row.unused)} more. {outside}</p>}
      </>}

      {open && options.length > 0 && (
        <details className="group border-t border-line">
          <summary className="flex min-h-36 cursor-pointer list-none items-center justify-between text-8-5 leading-13 font-600 text-accent max-tablet:min-h-44 [&::-webkit-details-marker]:hidden">
            Other options · {options.length}
            <CaretDown aria-hidden className="size-11 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <p className="text-8 leading-13 text-ink-muted">Keep one you like, then suggest again to plan around it.</p>
          <ul aria-label={`Other options for ${name}`} className="divide-y divide-line">{shown.map((choice) => <RecommendationCourse key={choice.course.code} choice={choice} alternative kept={keptCodes.includes(choice.course.code)} confirmations={confirmations} onConfirm={onConfirm} onKeep={(credits) => keep(choice.course.code, credits)} onExclude={() => exclude(choice.course.code)} />)}</ul>
          {options.length > shown.length && <button type="button" onClick={() => setShowAll(true)} className="mb-6 min-h-32 cursor-pointer text-8-5 leading-13 font-600 text-accent max-tablet:min-h-44">Show {options.length - shown.length} more</button>}
        </details>
      )}
      {planner && <div className="border-t border-line py-8">{planner}</div>}
    </section>
  );
}
