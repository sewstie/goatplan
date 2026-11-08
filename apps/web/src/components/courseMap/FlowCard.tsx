import { CalendarBlank, CheckCircle } from "@phosphor-icons/react/ssr";
import { extraText, type FlowCourse } from "@/lib/courseMap/flowchart";
import type { Box } from "@/lib/courseMap/routing";
import { AREA_NAMES } from "@/lib/courseMap/csLayout";
import { cx } from "@/components/ui/cx";

export type CourseState = "taken" | "planned" | null;

type FlowCardProps = {
  course: FlowCourse;
  box: Box;
  state: CourseState;
  selected: boolean;
  dimmed: boolean;
  select(code: string): void;
  preview(code: string | null): void;
};

export function FlowCard({ course, box, state, selected, dimmed, select, preview }: FlowCardProps) {
  const label = [
    course.code,
    course.aliases.length ? `also ${course.aliases.join(" and ")}` : null,
    course.title,
    course.extras.length ? `other background ${extraText(course.extras)}` : null,
    course.area && AREA_NAMES[course.area],
    state,
  ].filter(Boolean).join(", ");
  return (
    <button
      type="button"
      data-code={course.code}
      aria-label={label}
      aria-pressed={selected}
      onClick={() => select(course.code)}
      onMouseMove={(event) => { if (event.movementX || event.movementY) preview(course.code); }}
      onMouseLeave={() => preview(null)}
      style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
      className={cx("flow-card", course.area && `flow-area-${course.area}`, state && `flow-${state}`, selected && "flow-card-selected", dimmed && "flow-dimmed")}
    >
      <span className="flow-card-code">
        <strong>{course.code}</strong>
        {course.aliases.length > 0 && <span>/ {course.aliases.join(" / ")}</span>}
        {state === "taken" && <CheckCircle weight="fill" aria-hidden className="flow-card-state" />}
        {state === "planned" && <CalendarBlank aria-hidden className="flow-card-state" />}
      </span>
      <span className="flow-card-title" title={course.title}>{course.title}</span>
      {course.extras.length > 0 && <span className="flow-card-extra" title={extraText(course.extras)}>{extraText(course.extras)}</span>}
    </button>
  );
}
