import { useEffect, useRef } from "react";
import { ArrowSquareOut, CalendarBlank, CheckCircle } from "@phosphor-icons/react/ssr";
import type { MapNode } from "@/lib/courseMap/courseMap";
import { extraText, type Chain, type Flowchart } from "@/lib/courseMap/flowchart";
import { AREA_NAMES } from "@/lib/courseMap/csLayout";
import { Button } from "@/components/ui/Button";
import { CourseChips } from "./CourseChips";
import type { CourseState } from "./FlowCard";

type MapDetailsPanelProps = {
  node: MapNode | null;
  flow: Flowchart;
  chain: Chain | null;
  state: CourseState;
  select(code: string): void;
  plan(): void;
};

function countCourses(flow: Flowchart, codes: Set<string> | undefined) {
  if (!codes) return 0;
  const doubled = flow.pairs.filter((pair) => pair.codes.every((code) => codes.has(code))).length;
  return flow.courses.filter((item) => codes.has(item.code)).length - doubled;
}

export function MapDetailsPanel({ node, flow, chain, state, select, plan }: MapDetailsPanelProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  const followed = useRef(false);
  const code = node?.code;
  useEffect(() => {
    if (!followed.current || !code) return;
    followed.current = false;
    heading.current?.focus();
  }, [code]);
  const follow = (next: string) => {
    followed.current = true;
    select(next);
  };
  if (!node) {
    return (
      <aside aria-label="Selected course" className="flow-details flow-details-empty">
        <div>
          <h3 className="text-14 font-650">Pick a course</h3>
          <p className="pt-6 text-10 leading-17 text-ink-muted">Click any course to see what it needs and what it leads to.</p>
        </div>
      </aside>
    );
  }
  const course = flow.courses.find((item) => item.code === node.code);
  const before = flow.links.filter((link) => link.to === node.code).map((link) => link.from);
  const after = flow.links.filter((link) => link.from === node.code).map((link) => link.to);
  const earlier = countCourses(flow, chain?.before);
  const later = countCourses(flow, chain?.after);
  return (
    <aside aria-label="Selected course" className="flow-details">
      <div className="flex min-w-0 flex-col items-start">
        <p className="degree-eyebrow">{course?.area ? AREA_NAMES[course.area] : `${course?.band ?? ""} level`}</p>
        <h3 ref={heading} tabIndex={-1} className="pt-2 text-21 leading-26 font-650">{node.code}{node.aliases && <span className="pl-6 text-11 font-450 text-ink-muted">/ {node.aliases.join(" / ")}</span>}</h3>
        <p className="text-11 leading-15">{node.title}</p>
        <p className="flex items-center gap-6 pt-6 text-10 text-ink-muted">
          {state === "taken" ? <><CheckCircle size={13} weight="fill" aria-hidden className="text-success" />Taken</> : state === "planned" ? <><CalendarBlank size={13} aria-hidden className="text-accent" />Planned</> : "Not taken"}
          {chain && <span>· {earlier} before · {later} after</span>}
        </p>
        {state !== "taken" && <div className="pt-10"><Button size="sm" icon={<CalendarBlank aria-hidden />} onClick={plan}>{state === "planned" ? "Change term" : "Plan this"}</Button></div>}
      </div>
      <div className="flex min-w-0 flex-col gap-12 overflow-y-auto">
        <section aria-label="Before this course" className="flex flex-col gap-6">
          <h4 className="text-10 font-650">Before this</h4>
          {before.length ? <CourseChips codes={before} pick={follow} /> : <p className="text-10 text-ink-muted">No CS course is listed.</p>}
          {course && course.extras.length > 0 && <p className="text-caption text-ink-muted">Outside CS: {extraText(course.extras)}</p>}
        </section>
        <section aria-label="What it leads to" className="flex flex-col gap-6">
          <h4 className="text-10 font-650">What it leads to</h4>
          {after.length ? <CourseChips codes={after} pick={follow} /> : <p className="text-10 text-ink-muted">No later CS course lists it.</p>}
        </section>
      </div>
      <section aria-label="Catalog wording" className="flow-details-wording">
        <h4 className="text-10 font-650">WPI catalog says</h4>
        <p className="mt-6 whitespace-pre-line border-l-2 border-accent pl-10 text-10 leading-16 text-ink-muted">{node.wording}</p>
        <a className="mt-6 inline-flex items-center gap-4 text-caption text-accent underline" target="_blank" rel="noreferrer" href={node.source}>Open in WPI catalog<ArrowSquareOut aria-hidden /></a>
        {node.offering?.description && (
          <details className="pt-8 text-10 leading-16 text-ink-muted">
            <summary className="cursor-pointer font-650 text-ink">Course description</summary>
            <p className="pt-6">{node.offering.description}</p>
          </details>
        )}
      </section>
    </aside>
  );
}
