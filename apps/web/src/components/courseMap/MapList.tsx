import type { CourseMap } from "@/lib/courseMap/courseMap";
import type { Flowchart } from "@/lib/courseMap/flowchart";
import { AREA_NAMES } from "@/lib/courseMap/csLayout";
import { cx } from "@/components/ui/cx";
import { BackgroundExpression } from "./BackgroundExpression";
import type { CourseState } from "./FlowCard";

type MapListProps = { flow: Flowchart; map: CourseMap; selected: string | null; stateOf(code: string): CourseState; select(code: string): void };

export function MapList({ flow, map, selected, stateOf, select }: MapListProps) {
  return (
    <div className="flex flex-col gap-14">
      {[1000, 2000, 3000, 4000].map((band) => (
        <section key={band} aria-label={`${band}-level courses`} className="flow-list-band">
          <h3 className="text-12 font-650">{band} level</h3>
          <ul>
            {flow.courses.filter((course) => course.band === band).sort((a, b) => a.code.localeCompare(b.code)).map((course) => {
              const node = map.nodes.find((item) => item.code === course.code);
              const leads = flow.links.filter((link) => link.from === course.code).map((link) => link.to);
              const state = stateOf(course.code);
              return (
                <li key={course.code} className={cx("flow-list-row", selected === course.code && "flow-list-row-selected")}>
                  <button type="button" aria-pressed={selected === course.code} onClick={() => select(course.code)} className="flow-list-name text-11">
                    <strong>{course.code}</strong> {course.title}
                  </button>
                  {(course.area || state) && <p className="text-caption text-ink-muted">{[course.area && AREA_NAMES[course.area], state === "taken" ? "Taken" : state === "planned" ? "Planned" : null].filter(Boolean).join(" · ")}</p>}
                  <p className="text-10 text-ink-muted">Before this: {node?.background ? <BackgroundExpression value={node.background} /> : "Nothing listed"}</p>
                  <p className="text-10 text-ink-muted">Leads to: {leads.join(", ") || "No later course on this map lists it"}</p>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
