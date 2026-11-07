"use client";

import { useEffect, useState } from "react";
import { CalendarBlank, Info } from "@phosphor-icons/react/ssr";
import { buildCourseMap } from "@/lib/courseMap/courseMap";
import { useMapOfferings } from "@/components/courseMap/useMapOfferings";
import { BackgroundExpression } from "@/components/courseMap/BackgroundExpression";
import { CourseMapDiagram } from "@/components/courseMap/CourseMapDiagram";
import { Button } from "@/components/ui/Button";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { cx } from "@/components/ui/cx";
import { foundCourse, getDegreeSource, typedCourse, parseTerm, type DegreeHistory } from "@/lib/degree";
import { useDegreeUi } from "./degreeUi";
import { DegreeMapDiagram } from "./DegreeMapDiagram";
import { OpenInPlanner } from "./OpenInPlanner";
import { usePublishedTerms } from "./usePublishedTerms";
import { termChoices } from "./termChoices";

const MAJOR = new Set(["CS 1101", "CS 2102", "CS 2103", "CS 2022", "CS 2303", "CS 2223", "CS 3013", "CS 3041", "CS 4341"]);

export function DegreeCourseMap({ history }: { history: DegreeHistory }) {
  const [mode, setMode] = useState<"map" | "list">("map");
  const [scope, setScope] = useState("major");
  const [selected, setSelected] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [term, setTerm] = useState("C Term 2027");
  const published = usePublishedTerms();
  const named = parseTerm(term)!;
  const termId = `${named.year}-${named.letter}`;
  const { courses, load } = useMapOfferings();
  const set = useDegreeUi((state) => state.set);
  useEffect(() => { void load(); }, [load]);
  const full = buildCourseMap(courses);
  const nodes = full.nodes.filter((node) => scope === "all" || MAJOR.has(node.code));
  const shown = new Set(nodes.map((node) => node.code));
  const map = { nodes, connections: full.connections.filter((edge) => shown.has(edge.from) && shown.has(edge.to)) };
  const node = full.nodes.find((item) => item.code === selected);
  const leads = full.connections.filter((edge) => edge.from === node?.code);
  const primaryLeads = scope === "all" ? leads : leads.slice(0, 1);
  const state = (code: string) => history.courses.find((course) => course.code === code)?.status ?? "needed";
  const stateWord = (code: string) => state(code) === "taken" ? "Taken" : state(code) === "planned" ? "Planned" : "Still needed";
  return <section className="degree-course-map flex min-w-0 flex-col gap-20" aria-label="Course map">
    <header className="flex items-start justify-between gap-16"><div><h2 className="text-17 font-650">Course map</h2><p className="pt-4 text-caption text-ink-muted">Arrows show recommended background.</p></div><button type="button" onClick={() => setHelp(true)} className="flex cursor-pointer items-center gap-8 text-caption font-650 text-accent"><Info aria-hidden />How to read this</button></header>
    <div className="flex flex-wrap items-end justify-between gap-16"><SegmentedSwitch<"map" | "list"> label="Course map view" value={mode} options={[{ value: "map", label: "Map", icon: null }, { value: "list", label: "List", icon: null }]} onChange={setMode} /><Select label="Show" hideLabel={false} variant="box" value={scope} options={[{ value: "major", label: "Only my major’s requirements" }, { value: "all", label: "Everything connected" }]} onChange={(event) => setScope(event.target.value)} /></div>
    <div className={cx("degree-map-layout", node && "degree-map-selected")}>
      <div className="degree-map-surface">
        {mode === "map" ? scope === "all" ? <CourseMapDiagram map={map} selected={selected} select={setSelected} /> : <><p className="degree-map-legend">✓ Taken　 ◌ Planned　 ○ Still needed</p><DegreeMapDiagram map={map} history={history} selected={selected} select={setSelected} /></> : <>
          <div className="degree-map-list">
            {[1000, 2000, 3000, 4000].map((band) => <section key={band} aria-label={`${band}-level courses`} className="degree-map-band"><h3>{band} level</h3><div className="degree-map-nodes">
              {nodes.filter((item) => item.band === band).map((item) => <button key={item.code} type="button" aria-label={item.code} aria-pressed={selected === item.code} onClick={() => setSelected(item.code)} className={cx("degree-map-node", `degree-map-${state(item.code)}`, selected === item.code && "degree-map-node-selected")}><strong>{item.code}</strong><span>{stateWord(item.code)}</span>{mode === "list" && item.background && <span><BackgroundExpression value={item.background} /></span>}</button>)}

            </div></section>)}
          </div>
        </>}
        <p className="pt-14 text-caption text-ink-muted">Recommended background · <a className="text-accent underline" target="_blank" rel="noreferrer" href="https://wpi.cleancatalog.net/computer-science">WPI catalog</a></p>
      </div>
      {node && <article className="degree-map-details"><p className="degree-eyebrow">Selected course</p><h3 className="pt-4 text-21 font-650">{node.code}</h3><p className="pt-4 text-10 text-ink-muted">{node.title}</p>
        <h4 className="pt-16 text-12 font-650">What it leads to</h4><div className="flex flex-col gap-6 pt-8">{primaryLeads.map((edge) => <button key={edge.to} type="button" className="cursor-pointer rounded-row bg-accent-soft px-12 py-10 text-left text-10 text-accent" onClick={() => setSelected(edge.to)}>↳ {edge.to}　{full.nodes.find((item) => item.code === edge.to)?.title}</button>)}</div>
        {scope !== "all" && leads.length > 1 && <details className="pt-12 text-caption text-ink-muted"><summary className="cursor-pointer text-accent">{leads.length - 1} more connections</summary><div className="flex flex-col gap-8 pt-10">{leads.slice(1).map((edge) => <button key={edge.to} type="button" className="cursor-pointer text-left text-accent" onClick={() => setSelected(edge.to)}>{edge.to} · {full.nodes.find((item) => item.code === edge.to)?.title}</button>)}</div></details>}
        {node.background && <div className="pt-14 text-caption text-ink-muted"><BackgroundExpression value={node.background} /></div>}
        <p className="pt-12 text-caption leading-17 text-ink-muted">{node.wording}</p>
        <a className="mt-12 block text-caption text-accent underline" target="_blank" rel="noreferrer" href={node.source}>Recommended background · WPI</a>
        <div className="flex flex-wrap gap-8 pt-14"><Button icon={<CalendarBlank aria-hidden />} onClick={() => setPlanning(true)}>Plan this</Button><Button variant="secondary" onClick={() => setPlanning(true)}>Choose a term</Button></div>
      </article>}
    </div>
    <Dialog open={planning} onClose={() => setPlanning(false)} title={`Plan ${node?.code ?? "course"}`}>
      <Select label="Term" hideLabel={false} options={termChoices().filter((option) => option.value)} value={term} onChange={(event) => setTerm(event.target.value)} />
      {node && <Button onClick={() => {
        const result = getDegreeSource().addCourse({ ...(node.offering ? foundCourse(node.offering) : { ...typedCourse(node.code), title: node.title }), status: "planned", term });
        set({ toast: { message: result === "duplicate" ? `${node.code} is already in your history.` : result === "invalid" ? "This course couldn’t be added." : result === "unsaved" ? `${node.code} planned for this visit. Browser storage is unavailable.` : `${node.code} planned for ${term}.` } });
        setPlanning(false);
      }}>Plan for {term}</Button>}
      {node && published.terms.some((item) => item.id === termId) && <OpenInPlanner termId={termId} code={node.code} />}
    </Dialog>
    <Dialog open={help} onClose={() => setHelp(false)} title="How to read this"><p className="text-10 leading-18 text-ink-muted">Arrows point from recommended background to the course that uses it. Course levels are number bands, not terms or years. These recommendations do not establish prerequisites or enrollment eligibility. Select a course to read its catalog source, or use List for the same connections.</p></Dialog>
  </section>;
}
