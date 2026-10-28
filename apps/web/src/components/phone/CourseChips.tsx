"use client";

import { LockSimple } from "@phosphor-icons/react/ssr";
import { COURSE_COLORS, courseSlot } from "@/components/ui/courseColors";
import { cx } from "@/components/ui/cx";
import { selectSavedPlan, usePlanner } from "@/lib/store";
import { usePhoneScreen } from "./phoneScreen";

/** The planned courses as chips: "■ AE 2320 🔒". A tap opens the course's details screen. */
export function CourseChips({ className }: { className?: string }) {
  const codes = usePlanner((state) => selectSavedPlan(state)?.courses ?? state.courses);
  const locks = usePlanner((state) => selectSavedPlan(state)?.locks ?? state.locks);
  const selectCourse = usePlanner((state) => state.selectCourse);
  const show = usePhoneScreen((state) => state.show);

  if (codes.length === 0) return null;

  return (
    <ul aria-label="Your courses" className={cx("flex flex-wrap gap-8", className)}>
      {codes.map((code) => {
        const locked = (locks[code]?.length ?? 0) > 0;
        return (
          <li key={code}>
            <button
              type="button"
              data-course-row={code}
              aria-label={`${code}${locked ? ", has locked sections" : ""}. Show details`}
              onClick={() => {
                selectCourse(code);
                show("course");
              }}
              className="relative inline-flex min-h-36 cursor-pointer items-center gap-7 rounded-control border border-line bg-surface px-10 text-9 font-650 hover:bg-surface-selected after:absolute after:inset-x-0 after:-inset-y-4"
            >
              <span aria-hidden className={cx("size-7 shrink-0 rounded-swatch", COURSE_COLORS[courseSlot(codes, code)].swatch)} />
              {code}
              {locked && <LockSimple aria-hidden className="size-11 text-ink-muted" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
