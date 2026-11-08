"use client";

import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { sectionsWithMqp, tileMatchesFilter, type DegreeHistory } from "@/lib/degree";
import { CheckPills } from "./CheckPills";
import { SheetControls } from "./SheetControls";
import { SheetLegend } from "./SheetLegend";
import { SheetRow } from "./SheetRow";
import { useDegreeUi } from "./degreeUi";
import { useCurrentTerm } from "./useCurrentTerm";
import type { DegreeView } from "./useDegreeView";

export function SheetPanel({ view, history }: { view: DegreeView; history: DegreeHistory }) {
  const filter = useDegreeUi((state) => state.filter);
  const phone = usePhoneViewport();
  const current = useCurrentTerm();
  const all = phone ? view.sheet.sections : sectionsWithMqp(view.sheet.sections);
  const sections = filter ? all.filter((section) => section.tiles.some((tile) => tileMatchesFilter(tile, filter))) : all;

  return (
    <section aria-label="Your sheet" className="tablet:rounded-panel tablet:border tablet:border-card-line tablet:bg-surface tablet:px-20 tablet:pt-18 tablet:pb-14">
      <div className="flex flex-wrap items-center justify-between gap-12 pb-12">
        <h2 className="text-12 leading-19-2 font-650">Your sheet</h2>
        <SheetControls view={view} />
      </div>
      <div className="hidden pb-12 tablet:block"><SheetLegend /></div>
      <ul className="flex flex-col gap-10 tablet:gap-0">
        {sections.map((section) => <SheetRow key={section.id} section={section} view={view} history={history} current={current} />)}
      </ul>
      <div className="pt-20 tablet:mt-0 tablet:border-t tablet:border-line tablet:pt-14">
        <CheckPills pills={view.pills} />
      </div>
    </section>
  );
}
