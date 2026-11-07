"use client";

import { useEffect, useMemo, useState } from "react";
import { Graph, Info, ListDashes } from "@phosphor-icons/react/ssr";
import { buildCourseMap } from "@/lib/courseMap/courseMap";
import { buildFlowchart, chainOf } from "@/lib/courseMap/flowchart";
import { routeFlowchart } from "@/lib/courseMap/routing";
import type { DegreeHistory } from "@/lib/degree";
import { Dialog } from "@/components/ui/Dialog";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";
import { useMapOfferings } from "@/components/courseMap/useMapOfferings";
import { MapView } from "@/components/courseMap/MapView";
import { MapList } from "@/components/courseMap/MapList";
import { MapLegend } from "@/components/courseMap/MapLegend";
import { MapDetailsPanel } from "@/components/courseMap/MapDetailsPanel";
import { PlanCourseDialog } from "@/components/courseMap/PlanCourseDialog";
import type { CourseState } from "@/components/courseMap/FlowCard";

const flow = buildFlowchart();
const layout = routeFlowchart(flow);
const VIEWS = [{ value: "map", label: "Map", icon: <Graph aria-hidden /> }, { value: "list", label: "List", icon: <ListDashes aria-hidden /> }] as const;

export function DegreeCourseMap({ history }: { history: DegreeHistory }) {
  const [mode, setMode] = useState<"map" | "list">("map");
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [planning, setPlanning] = useState(false);
  const { courses, load } = useMapOfferings();
  useEffect(() => { void load(); }, [load]);
  const map = useMemo(() => buildCourseMap(courses), [courses]);
  const focus = hovered ?? selected;
  const chain = useMemo(() => (focus ? chainOf(flow, focus) : null), [focus]);
  const selectedChain = useMemo(() => (selected ? chainOf(flow, selected) : null), [selected]);
  const node = map.nodes.find((item) => item.code === selected) ?? null;
  const stateOf = (code: string): CourseState => {
    const names = [code, ...(flow.courses.find((course) => course.code === code)?.aliases ?? [])];
    return history.courses.find((course) => names.includes(course.code))?.status ?? null;
  };
  const select = (code: string) => {
    setSelected((current) => (current === code ? null : code));
    setHovered(null);
  };
  const show = (code: string) => {
    setSelected(code);
    setHovered(null);
  };

  return (
    <section className="flex min-w-0 flex-col gap-16" aria-label="Course map">
      <header className="flex items-center justify-between gap-16">
        <h2 className="text-17 font-650">Course map</h2>
        <button type="button" onClick={() => setHelp(true)} className="flex min-h-32 cursor-pointer items-center gap-8 text-caption font-650 text-accent"><Info aria-hidden />How to read this</button>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-12">
        <SegmentedSwitch<"map" | "list"> label="Course map view" value={mode} options={VIEWS} onChange={setMode} />
        <MapLegend />
      </div>
      <p className="sr-only" aria-live="polite">{node ? `${node.code} selected` : ""}</p>
      <MapDetailsPanel node={node} flow={flow} chain={selectedChain} state={selected ? stateOf(selected) : null} select={show} plan={() => setPlanning(true)} />
      <div className="flow-surface">
        {mode === "map"
          ? <MapView flow={flow} layout={layout} stateOf={stateOf} selected={selected} chain={chain} select={select} preview={setHovered} clear={() => setSelected(null)} />
          : <MapList flow={flow} map={map} selected={selected} stateOf={stateOf} select={show} />}
        <p className="pt-10 text-micro text-ink-muted">
          Source: <a className="underline" target="_blank" rel="noreferrer" href="https://wpi.cleancatalog.net/computer-science">WPI catalog 2026–27</a>. Recommended, not required. Not shown: {flow.hidden.join(", ")} (don’t count toward the major).
        </p>
      </div>
      <PlanCourseDialog node={node} open={planning} close={() => setPlanning(false)} />
      <Dialog open={help} onClose={() => setHelp(false)} title="How to read this">
        <div className="flex flex-col gap-10 text-10 leading-18 text-ink-muted">
          <p>1000 level is at the top, 4000 at the bottom. Levels are course numbers, not years.</p>
          <p>Arrows point to the courses that build on a course. Dashed means any one of them is enough. “or” means either course works.</p>
          <p>If a longer chain already links two courses, the direct arrow is left out. Click a course to see the full list.</p>
          <p>Colors are the four areas the major needs one course from, plus Cybersecurity.</p>
          <p>Ctrl + scroll or pinch to zoom. Drag to move around.</p>
          <p>These are WPI’s recommendations, not enforced prerequisites.</p>
        </div>
      </Dialog>
    </section>
  );
}
