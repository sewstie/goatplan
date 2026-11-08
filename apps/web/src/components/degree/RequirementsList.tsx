"use client";

import { useState } from "react";
import { CaretDown, Info } from "@phosphor-icons/react/ssr";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { cx } from "@/components/ui/cx";
import { isTileStack, sectionFinished, sectionsWithMqp, stackEmptyTiles, tileMatchesFilter, type DegreeHistory, type SheetSection, type TermName } from "@/lib/degree";
import { CheckPills } from "./CheckPills";
import { RequirementLine, RequirementStack } from "./RequirementLine";
import { SectionProgress } from "./SectionProgress";
import { SheetControls } from "./SheetControls";
import { useDegreeUi } from "./degreeUi";
import { useCurrentTerm } from "./useCurrentTerm";
import type { DegreeView } from "./useDegreeView";

function Section({ section, history, current }: { section: SheetSection; history: DegreeHistory; current: TermName | null }) {
  const filter = useDegreeUi((state) => state.filter);
  const finished = sectionFinished(section) && filter === null;
  const [shown, setShown] = useState(!finished);
  const lines = filter ? section.tiles.filter((tile) => tileMatchesFilter(tile, filter)) : section.tiles;
  const visible = shown || !finished;
  return (
    <li className="border-t border-line py-14">
      <div className="flex flex-wrap items-center gap-x-20 gap-y-8">
        <h3 className="w-full text-17 font-650 tablet:w-180">{section.name}</h3>
        <SectionProgress section={section} className="min-w-0 flex-1 tablet:max-w-320" />
        {finished && (
          <button type="button" aria-expanded={visible} onClick={() => setShown(!shown)} className="ml-auto flex cursor-pointer items-center gap-5 rounded-badge text-8 leading-16 font-570 text-accent hover:underline">
            {visible ? "Hide lines" : `Show ${section.tiles.length} lines`}
            <CaretDown aria-hidden className={cx("size-11 transition-transform motion-reduce:transition-none", visible && "rotate-180")} />
          </button>
        )}
      </div>
      {visible && (
        <>
          <ul className="mt-10 flex flex-col">
            {stackEmptyTiles(lines).map((item) => <li key={item.key} className="border-t border-line first:border-t-0">
              {isTileStack(item) ? <RequirementStack stack={item} /> : <RequirementLine tile={item} history={history} current={current} />}
            </li>)}
          </ul>
          {section.note && <p className="flex items-start gap-5 pt-8 pl-6 text-8 leading-16 text-ink-muted"><Info aria-hidden className="mt-1 size-12 shrink-0" />{section.note}</p>}
        </>
      )}
    </li>
  );
}

export function RequirementsList({ view, history }: { view: DegreeView; history: DegreeHistory }) {
  const phone = usePhoneViewport();
  const current = useCurrentTerm();
  const all = phone ? view.sheet.sections : sectionsWithMqp(view.sheet.sections);
  const filter = useDegreeUi((state) => state.filter);
  const sections = filter ? all.filter((section) => section.tiles.some((tile) => tileMatchesFilter(tile, filter))) : all;
  return (
    <section aria-label="Your requirements" className="rounded-panel border border-card-line bg-surface px-16 pt-18 pb-14 tablet:px-20">
      <div className="degree-sheet-heading flex flex-wrap items-center justify-between gap-12 pb-12">
        <h2 className="text-12 leading-19-2 font-650">Your sheet</h2>
        <SheetControls view={view} />
      </div>
      <div aria-hidden className="hidden grid-cols-[2rem_minmax(0,10rem)_minmax(0,1fr)_minmax(0,7rem)_7.25rem] gap-x-14 border-t border-line px-6 pt-10 pb-2 text-8 leading-16 font-570 tracking-[0.04em] text-ink-muted uppercase tablet:grid">
        <span>Line</span><span>Requirement</span><span>Course</span><span>When</span><span>Status</span>
      </div>
      <ul>
        {sections.map((section) => <Section key={section.id} section={section} history={history} current={current} />)}
      </ul>
      <div className="border-t border-line pt-14">
        <CheckPills pills={view.pills} />
      </div>
    </section>
  );
}
