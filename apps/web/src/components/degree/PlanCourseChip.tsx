"use client";

import { cx } from "@/components/ui/cx";
import type { HistoryCourse, TermName } from "@/lib/degree";
import { coursePlanState } from "@/lib/degree/planGrid";
import { useDegreeUi } from "./degreeUi";
import { TILE_LOOK } from "./tileState";

export const PLAN_DRAG = "application/goatplan-course";

const LOOKS = { taken: TILE_LOOK.done, progress: TILE_LOOK.progress, planned: TILE_LOOK.planned };

export function PlanCourseChip({ course, current, where, wide = false }: { course: HistoryCourse; current: TermName | null; where: string; wide?: boolean }) {
  const open = useDegreeUi((state) => state.open);
  const state = coursePlanState(course, current);
  const { Icon, box, ink } = LOOKS[state];
  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => event.dataTransfer.setData(PLAN_DRAG, course.code)}
      onClick={() => open({ kind: "details", code: course.code })}
      aria-label={`Edit ${course.code}, ${where}`}
      title={course.title || undefined}
      className={cx("flex min-w-0 cursor-grab items-center gap-5 rounded-row border px-7 py-5 text-left hover:brightness-97 active:cursor-grabbing", box, wide ? "max-w-full" : "w-full")}
    >
      <Icon aria-hidden weight="bold" className={cx("size-11 shrink-0", ink)} />
      <span className={cx("shrink-0 text-9 leading-14-4 font-650", ink)}>{course.code}</span>
      {wide && course.title && <span className="truncate text-8 leading-16 text-ink-muted">{course.title}</span>}
    </button>
  );
}
