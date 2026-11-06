"use client";

import { useEffect, useState } from "react";
import { ListDashes, Graph } from "@phosphor-icons/react/ssr";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";
import { buildCourseMap } from "@/lib/courseMap/courseMap";
import { useMapOfferings } from "./useMapOfferings";
import { CourseMapDiagram } from "./CourseMapDiagram";
import { CourseMapList } from "./CourseMapList";
import { MapCourseDetails } from "./MapCourseDetails";

const VIEWS = [{ value: "map", label: "Map view", icon: <Graph aria-hidden /> }, { value: "list", label: "List view", icon: <ListDashes aria-hidden /> }] as const;

export function CourseBackgroundMap() {
  const [mode, setMode] = useState<"map" | "list">("map");
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState(false);
  const { courses, ready, load } = useMapOfferings();
  useEffect(() => { void load(); }, [load]);
  const map = buildCourseMap(courses);
  const select = (code: string) => { setSelected(code); setDetails(true); };

  return <section aria-label="CS course background" className="flex min-w-0 flex-col gap-16">
    <header className="flex flex-wrap items-start justify-between gap-16">
      <div className="max-w-640">
        <h2 className="text-21 leading-30 font-700">CS course background</h2>
        <p className="pt-6 text-10 leading-18 text-ink-soft">Computer Science · 2026–27 catalog · Class of 2030</p>
        <p className="pt-8 text-10 leading-18 text-ink-muted">Explore recommended background, not prerequisites. This map does not decide readiness or confirm degree requirements.</p>
      </div>
      <SegmentedSwitch<"map" | "list"> label="Course map view" options={VIEWS} value={mode} onChange={setMode} />
    </header>
    <div className="rounded-card border border-card-line bg-surface p-14 text-10 leading-18 text-ink-soft">
      <p>1000–4000 are course-number bands, not terms or years. Connections can stay within a band or go in either direction.</p>
      <p>Select a course to highlight its connections and read the source. Use Tab and Enter, or choose List view for the same background information.</p>
      <p>Arrows point from background courses to the course that mentions them. AND and OR alternatives appear in the details and list.</p>
      {!ready && <p role="status">Loading offering details… The sourced background is available now.</p>}
    </div>
    {mode === "map" ? <CourseMapDiagram map={map} selected={selected} select={select} /> : <CourseMapList map={map} selected={selected} select={select} />}
    <MapCourseDetails node={details ? map.nodes.find((node) => node.code === selected) ?? null : null} map={map} close={() => setDetails(false)} select={select} />
  </section>;
}
