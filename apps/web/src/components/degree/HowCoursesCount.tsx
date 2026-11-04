"use client";

import { CaretLeft } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { allocationReview, type DegreeHistory } from "@/lib/degree";
import type { AuditCourse } from "@/lib/engine/types";
import { useDegreeUi } from "./degreeUi";
import type { DegreeView } from "./useDegreeView";

const TONES = { counted: "success", kept: "success", skipped: "neutral", small: "accent", elective: "neutral", extra: "neutral" } as const;

export function HowCoursesCount({ history, view, planCourses }: { history: DegreeHistory; view: DegreeView | null; planCourses: readonly AuditCourse[] }) {
  const set = useDegreeUi((state) => state.set);
  const rows = view ? allocationReview(history, planCourses, view.sheet, view.result) : [];
  return (
    <div className="mx-auto flex w-full max-w-1020 flex-col gap-16">
      <header className="flex flex-col gap-12 tablet:flex-row tablet:items-start tablet:justify-between">
        <div>
          <h1 className="text-25 leading-30 font-700 tracking-title">How your courses count</h1>
          <p className="pt-12 text-9 leading-15 text-ink-muted">Review allocations without changing your original course history.</p>
        </div>
        <Button variant="secondary" size="md" icon={<CaretLeft aria-hidden />} className="min-h-38 self-start" onClick={() => set({ screen: "main" })}>Back to My degree</Button>
      </header>
      <Notice title="One course, one allocation" large>Cross-listings, repeated entries and equivalent choices do not create extra credit.</Notice>
      <section aria-labelledby="allocation-review" className="rounded-panel border border-card-line bg-surface px-20 pt-22 pb-14">
        <h2 id="allocation-review" className="pb-10 text-12 leading-19-2 font-650">Allocation review</h2>
        {rows.length === 0 && <p className="py-12 text-8-5 leading-16 text-ink-muted">Every course in your history fills one line, with nothing unusual to explain.</p>}
        <ul>
          {rows.map((row) => (
            <li key={`${row.title}-${row.badge}`} className="flex items-center justify-between gap-16 border-b border-line py-14 last:border-b-0">
              <div className="min-w-0">
                <h3 className="text-9 leading-15 font-600">{row.title}</h3>
                <p className="pt-6 text-8-5 leading-16 text-ink-muted">{row.text}</p>
              </div>
              <Badge tone={TONES[row.kind]} className="shrink-0 px-8! py-5!">{row.badge}</Badge>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-panel border border-card-line bg-surface px-20 py-22">
        <h2 className="text-12 leading-19-2 font-650">Need a different interpretation?</h2>
        <p className="pt-14 text-9 leading-15 text-ink-muted">Check unusual credit or department approval with your advisor. Edit the history record when the entered course or credit is incorrect.</p>
      </section>
    </div>
  );
}
