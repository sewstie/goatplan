"use client";

import { sectionsLine } from "./courseSummary";
import { COURSE_COLORS, courseSlot } from "@/components/ui/courseColors";
import { cx } from "@/components/ui/cx";
import { selectSavedPlan, selectViewedCourse, usePlanner } from "@/lib/store";

export function ViewedSavedCourses() {
  const plan = usePlanner(selectSavedPlan);
  const selected = usePlanner(selectViewedCourse);
  const select = usePlanner((state) => state.selectCourse);
  if (!plan) return null;
  return (
    <section aria-label="Your courses" className="flex shrink-0 flex-col">
      <div className="flex items-end justify-between gap-8 pb-10">
        <h2 className="text-11 leading-15-95 font-650">Your courses</h2>
        <span className="text-9 leading-13 text-ink-muted">{plan.courses.length} selected</span>
      </div>
      <ul className="flex flex-col gap-5">
        {plan.courses.map((code) => {
          const course = plan.schedule.find((item) => item.code === code);
          return <li key={code}><button type="button" aria-pressed={selected === code} onClick={() => select(code)} className={cx("flex w-full gap-9 rounded-card border border-transparent px-10 py-12 text-left", selected === code && "bg-surface-selected")}>
            <span aria-hidden className={cx("mt-5 size-8 shrink-0 rounded-swatch", COURSE_COLORS[courseSlot(plan.courses, code)].swatch)} />
            <span className="flex min-w-0 flex-col gap-3">
              <span className="text-11 leading-15-95 font-700">{code}</span>
              {course && <><span className="text-10 leading-16">{course.title}</span><span className="text-9 leading-14-4 text-ink-muted">{sectionsLine(course.sections)}</span></>}
            </span>
          </button></li>;
        })}
      </ul>
    </section>
  );
}
