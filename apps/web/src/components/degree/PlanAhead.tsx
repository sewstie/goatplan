"use client";

import { useState } from "react";
import { CalendarBlank, Flag } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { getDegreeSource, parseTerm, termLong, unitLabel, type DegreeSnapshot, type TermName } from "@/lib/degree";
import { coursePlanState, coursesInTerm, moveCourseTerm, planYears } from "@/lib/degree/planGrid";
import { savePlanStart, usePlanStart } from "./usePlanStart";
import { NextTermsSuggestions } from "./NextTermsSuggestions";
import { CreditsCard } from "./CreditsCard";
import { PaceCard } from "./PaceCard";
import { PlanTermCard } from "./PlanTermCard";
import { UnplacedTray } from "./UnplacedTray";
import { useCurrentTerm } from "./useCurrentTerm";
import { useDegreeUi } from "./degreeUi";
import { TILE_LOOK } from "./tileState";
import type { DegreeView } from "./useDegreeView";
import { keepClickFocus } from "./keepClickFocus";

const COLUMNS = ["A Term", "B Term", "C Term", "D Term", "E Term · Summer"];
const ROW = "grid grid-cols-[5.5rem_repeat(5,minmax(0,1fr))] gap-6 wide:grid-cols-[6.5rem_repeat(5,minmax(0,1fr))] wide:gap-8";
const LEGEND = [
  { word: "Taken", look: TILE_LOOK.done },
  { word: "In progress", look: TILE_LOOK.progress },
  { word: "Planned", look: TILE_LOOK.planned },
];

export function PlanAhead({ degree, view }: { degree: DegreeSnapshot; view: DegreeView | null }) {
  const open = useDegreeUi((state) => state.open);
  const set = useDegreeUi((state) => state.set);
  const current = useCurrentTerm();
  const start = usePlanStart();
  const [startOpen, setStartOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [project, setProject] = useState("IQP");
  const [projectTerm, setProjectTerm] = useState("B Term 2028");
  const [blocks, setBlocks] = useState<Record<string, string>>(() => {
    try { const saved: unknown = JSON.parse(localStorage.getItem("goatplan:degree:projects") ?? "{}"); return saved && typeof saved === "object" && !Array.isArray(saved) ? Object.fromEntries(Object.entries(saved).filter(([term, name]) => parseTerm(term) && (name === "IQP" || name === "MQP"))) : {}; } catch { return {}; }
  });
  const years = planYears(start);
  const options = years.flatMap(({ terms }) => terms.filter((term) => term.letter !== "E").map((term) => ({ value: termLong(term), label: termLong(term) })));
  const { courses } = degree.history;
  const undated = courses.filter((course) => !parseTerm(course.term));
  const counts = { taken: 0, progress: 0, planned: 0 };
  for (const course of courses) if (parseTerm(course.term)) counts[coursePlanState(course, current)] += 1;

  function saveBlocks(next: Record<string, string>) {
    setBlocks(next);
    try { localStorage.setItem("goatplan:degree:projects", JSON.stringify(next)); } catch { set({ toast: { message: "Project blocks are kept for this visit. Browser storage is unavailable." } }); }
  }

  function moveTo(code: string, term: TermName) {
    if (!courses.some((course) => course.code === code)) return;
    const previous = degree.history;
    getDegreeSource().replaceHistory(moveCourseTerm(previous, code, term));
    set({ toast: { message: `${code} moved to ${termLong(term)}.`, undo: previous } });
  }

  function addTo(name: string) {
    set({ addingTerm: name, lastAddTerm: name });
    open({ kind: "history", tab: "search" });
  }

  function removeBlock(name: string) {
    const next = { ...blocks };
    delete next[name];
    saveBlocks(next);
  }

  return <div className="degree-plan flex min-w-0 flex-col gap-14">
    <section aria-label="Four-year plan" className="rounded-panel border border-card-line bg-surface px-20 pt-18 pb-16">
      <header className="flex flex-wrap items-start justify-between gap-12 pb-14">
        <div className="flex flex-col gap-4">
          <h2 className="text-12 leading-19-2 font-650">Four-year plan</h2>
          <p className="text-8-5 leading-16 text-ink-muted">Drag courses between terms, or pick a term to add one.</p>
        </div>
        <div className="flex flex-wrap gap-8">
          <NextTermsSuggestions degree={degree} startYear={start} blocks={blocks} />
          <Button variant="secondary" size="sm" icon={<CalendarBlank aria-hidden />} onClick={() => setStartOpen(true)}>Start: A {start}</Button>
          <Button variant="secondary" size="sm" icon={<Flag aria-hidden />} onClick={() => setProjectOpen(true)}>Add project block</Button>
        </div>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-x-16 gap-y-6 pb-12">
        <ul aria-label="What the colors mean" className="flex flex-wrap items-center gap-x-14 gap-y-6 text-8 leading-16 text-ink-muted">
          {LEGEND.map(({ word, look }) => <li key={word} className="flex items-center gap-5"><look.Icon aria-hidden weight="bold" className={`size-12 ${look.ink}`} />{word}</li>)}
          <li className="flex items-center gap-5"><Flag aria-hidden weight="bold" className="size-12 text-accent" />Project block</li>
        </ul>
        <p className="text-8 leading-16 text-ink-muted">{counts.taken} taken · {counts.progress} in progress · {counts.planned} planned</p>
      </div>
      <div className="degree-plan-scroll -mx-4 overflow-x-auto px-4 pb-4" tabIndex={0} role="group" aria-label="Four-year plan terms" onMouseDown={keepClickFocus}>
        <div className="flex min-w-[45rem] flex-col">
          <div aria-hidden className={`${ROW} border-t border-line pt-10 pb-6`}>
            <span />
            {COLUMNS.map((label) => <span key={label} className="px-2 text-8 leading-16 font-570 tracking-[0.04em] text-ink-muted uppercase">{label}</span>)}
          </div>
          <ul>
            {years.map(({ year, terms }, index) => {
              const inYear = terms.flatMap((term) => coursesInTerm(degree.history, term));
              const units = unitLabel(inYear.reduce((sum, course) => sum + course.credits, 0));
              return (
                <li key={year} className={`${ROW} border-t border-line py-10 first:border-t-0`}>
                  <div className="flex flex-col gap-2 pt-4">
                    <h3 className="text-10 leading-15 font-650">Year {index + 1}</h3>
                    <p className="text-8 leading-16 text-ink-muted">{year}–{String(year + 1).slice(-2)}</p>
                    {inYear.length > 0 && <p className="pt-4 text-8 leading-16 text-ink-muted">{inYear.length} {inYear.length === 1 ? "course" : "courses"} · {units}</p>}
                  </div>
                  {terms.map((term) => (
                    <PlanTermCard
                      key={termLong(term)}
                      term={term}
                      courses={coursesInTerm(degree.history, term)}
                      current={current}
                      block={blocks[termLong(term)]}
                      after={term.year > 2030 || (index === 3 && term.letter === "E")}
                      onMove={moveTo}
                      onAdd={addTo}
                      onRemoveBlock={removeBlock}
                    />
                  ))}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <UnplacedTray courses={undated} current={current} />
      <p className="pt-10 text-8 leading-16 text-ink-muted">Project blocks reserve a term. They add no credit until confirmed.</p>
    </section>
    {view && <div className="degree-plan-insights"><CreditsCard view={view} degree={degree} /><PaceCard view={view} /></div>}
    <Dialog open={startOpen} onClose={() => setStartOpen(false)} title="When did you start?" description="Your plan grid and term choices start here.">
      <Select label="Start year" hideLabel={false} value={String(start)} options={[2026, 2027].map((year) => ({ value: String(year), label: `A Term ${year}` }))} onChange={(event) => { const year = Number(event.target.value); if (!savePlanStart(year)) set({ toast: { message: "Start year changed for this visit. Browser storage is unavailable." } }); }} />
      <Button onClick={() => setStartOpen(false)}>Done</Button>
    </Dialog>
    <Dialog open={projectOpen} onClose={() => setProjectOpen(false)} title="Add project block" description="Reserve a term for IQP or MQP. This adds no credit.">
      <Select label="Project" hideLabel={false} value={project} options={[{ value: "IQP", label: "IQP" }, { value: "MQP", label: "MQP" }]} onChange={(event) => setProject(event.target.value)} />
      <Select label="Term" hideLabel={false} value={projectTerm} options={options} onChange={(event) => setProjectTerm(event.target.value)} />
      <Button onClick={() => { saveBlocks({ ...blocks, [projectTerm]: project }); setProjectOpen(false); }}>Add project block</Button>
    </Dialog>
  </div>;
}
