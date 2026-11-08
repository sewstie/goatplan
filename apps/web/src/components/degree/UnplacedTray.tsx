"use client";

import { isPriorCredit, unitLabel, type HistoryCourse, type TermName } from "@/lib/degree";
import { PlanCourseChip } from "./PlanCourseChip";

const count = (courses: readonly HistoryCourse[]) => `${courses.length} ${courses.length === 1 ? "course" : "courses"} · ${unitLabel(courses.reduce((sum, course) => sum + course.credits, 0))}`;

function Group({ title, hint, courses, current }: { title: string; hint: string; courses: HistoryCourse[]; current: TermName | null }) {
  if (courses.length === 0) return null;
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-12 gap-y-2">
        <h4 className="text-9 leading-14-4 font-650">{title} <span className="font-450 text-ink-muted">· {count(courses)}</span></h4>
        <p className="text-8 leading-16 text-ink-muted">{hint}</p>
      </div>
      <div className="flex flex-wrap gap-6">
        {courses.map((course) => <PlanCourseChip key={course.code} course={course} current={current} where="no term" wide />)}
      </div>
    </div>
  );
}

export function UnplacedTray({ courses, current }: { courses: HistoryCourse[]; current: TermName | null }) {
  if (courses.length === 0) return null;
  const prior = courses.filter(isPriorCredit);
  const unplaced = courses.filter((course) => !isPriorCredit(course));
  return (
    <section aria-label="Credit without a term" className="mt-14 flex flex-col gap-14 rounded-tile border border-dashed border-line bg-surface-subtle px-12 py-12">
      <Group title="AP, IB and transfer credit" hint="Counts toward your degree without a term." courses={prior} current={current} />
      <Group title="Not placed in a term yet" hint="Drag one into a term, or pick it to choose a term." courses={unplaced} current={current} />
    </section>
  );
}
