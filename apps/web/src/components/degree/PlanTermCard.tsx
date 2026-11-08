"use client";

import { useState } from "react";
import { Flag, Plus, Warning } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import { compareTerms, unitLabel, sameTerm, termLong, type HistoryCourse, type TermName } from "@/lib/degree";
import { PLAN_DRAG, PlanCourseChip } from "./PlanCourseChip";

type PlanTermCardProps = {
  term: TermName;
  courses: HistoryCourse[];
  current: TermName | null;
  block: string | undefined;
  after: boolean;
  onMove(code: string, term: TermName): void;
  onAdd(name: string): void;
  onRemoveBlock(name: string): void;
};

export function PlanTermCard({ term, courses, current, block, after, onMove, onAdd, onRemoveBlock }: PlanTermCardProps) {
  const [over, setOver] = useState(false);
  const name = termLong(term);
  if (after) {
    return <section aria-label={name} className="flex min-h-96 items-center justify-center rounded-tile border border-dashed border-line p-8 text-8 leading-16 text-ink-faint">After this plan</section>;
  }
  const now = sameTerm(term, current);
  const past = current !== null && compareTerms(term, current) < 0;
  const summer = term.letter === "E";
  const units = unitLabel(courses.reduce((sum, course) => sum + course.credits, 0));
  return (
    <section
      aria-label={name}
      onDragOver={(event) => { event.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const code = event.dataTransfer.getData(PLAN_DRAG);
        if (code) onMove(code, term);
      }}
      className={cx(
        "flex min-h-96 min-w-0 flex-col gap-5 rounded-tile border p-8 transition-colors motion-reduce:transition-none",
        over ? "border-accent bg-accent-soft" : now ? "border-accent bg-surface shadow-selected" : summer ? "border-dashed border-line bg-surface-subtle" : "border-card-line bg-surface",
      )}
    >
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 pb-2">
        <h3 className={cx("text-9 leading-14-4 font-650", past ? "text-ink-soft" : "text-ink")}>{term.letter} {term.year}</h3>
        {now && <span className="rounded-badge bg-accent px-5 py-1 text-8 leading-16 font-650 text-on-accent">Now</span>}
        <span className="ml-auto text-8 leading-16 whitespace-nowrap text-ink-muted">{courses.length > 0 ? `${courses.length} · ${units}` : summer ? "Summer" : ""}</span>
      </header>
      {courses.length > 3 && <p className="-mt-2 flex items-center gap-4 rounded-badge bg-notice-warning px-6 py-2 text-8 leading-16 font-570 text-notice-warning-ink"><Warning aria-hidden weight="bold" className="size-11 shrink-0" />{courses.length} courses · heavy load</p>}
      {courses.map((course) => <PlanCourseChip key={course.code} course={course} current={current} where={name} />)}
      {block && (
        <button type="button" onClick={() => onRemoveBlock(name)} aria-label={`Remove ${block} project block from ${name}`} className="flex w-full items-center gap-5 rounded-row border border-dashed border-tile-planned-line bg-accent-soft px-7 py-5 text-left text-9 leading-14-4 font-650 text-accent hover:brightness-97">
          <Flag aria-hidden weight="bold" className="size-11 shrink-0" />{block}
        </button>
      )}
      <button type="button" onClick={() => onAdd(name)} aria-label={`${past ? "Add a taken course to" : "Plan a course for"} ${name}`} className="mt-auto flex items-center gap-4 rounded-row border border-dashed border-transparent px-6 py-4 text-8 leading-16 font-570 text-ink-muted hover:border-tile-planned-line hover:bg-accent-soft hover:text-accent">
        <Plus aria-hidden weight="bold" className="size-10 shrink-0" />Add
      </button>
    </section>
  );
}
