import { LockSimple } from "@phosphor-icons/react/ssr";
import { sectionsLine } from "@/components/courses/courseSummary";
import { COURSE_COLORS, courseSlot } from "@/components/ui/courseColors";
import { cx } from "@/components/ui/cx";
import type { SavedPlan } from "@/lib/plans";

export function SavedPlanCourses({ plan }: { plan: SavedPlan }) {
  return (
    <section aria-label="Your courses" className="flex shrink-0 flex-col">
      <div className="flex items-end justify-between gap-8 pb-10">
        <h2 className="text-11 leading-15-95 font-650">Your courses</h2>
        <span className="text-9 leading-13 font-450 text-ink-muted">{plan.courses.length} selected</span>
      </div>
      <ul className="flex flex-col gap-5">
        {plan.courses.map((code) => {
          const course = plan.schedule.find((item) => item.code === code);
          return (
            <li key={code} className="flex gap-9 rounded-card border border-transparent px-10 py-12">
              <span
                aria-hidden
                className={cx("mt-5 size-8 shrink-0 rounded-swatch", COURSE_COLORS[courseSlot(plan.courses, code)].swatch)}
              />
              <div className="flex min-w-0 flex-col gap-3">
                <span className="flex items-center gap-4 text-11 leading-15-95 font-700">
                  {code}
                  {(plan.locks[code]?.length ?? 0) > 0 && (
                    <>
                      <LockSimple aria-hidden className="size-11 shrink-0" />
                      <span className="sr-only">, has a locked section</span>
                    </>
                  )}
                </span>
                {course && (
                  <>
                    <span className="text-10 leading-16">{course.title}</span>
                    <span className="text-9 leading-14-4 text-ink-muted">{sectionsLine(course.sections)}</span>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
