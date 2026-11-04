"use client";

import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { sectionsWithMqp, SHEET_CLASS_YEAR, tileMatchesFilter, type DegreeHistory } from "@/lib/degree";
import { CheckPills } from "./CheckPills";
import { SheetRow } from "./SheetRow";
import { useDegreeUi } from "./degreeUi";
import type { DegreeView } from "./useDegreeView";

export function SheetPanel({ view, history }: { view: DegreeView; history: DegreeHistory }) {
  const filter = useDegreeUi((state) => state.filter);
  const phone = usePhoneViewport();
  const all = phone ? view.sheet.sections : sectionsWithMqp(view.sheet.sections);
  const sections = filter ? all.filter((section) => section.tiles.some((tile) => tileMatchesFilter(tile, filter))) : all;

  return (
    <section aria-label="Your sheet" className="tablet:rounded-panel tablet:border tablet:border-card-line tablet:bg-surface tablet:px-18 tablet:pt-14 tablet:pb-12">
      <div className="flex items-center justify-between gap-12 pb-12 tablet:pb-8">
        <h2 className="text-12 leading-19-2 font-650">Your sheet</h2>
        <p className="text-micro leading-13 text-ink-muted tablet:text-caption">Based on the Class of {SHEET_CLASS_YEAR} sheet</p>
      </div>
      <ul className="flex flex-col gap-10 tablet:gap-0">
        {sections.map((section) => <SheetRow key={section.id} section={section} view={view} history={history} />)}
      </ul>
      <div className="pt-20 tablet:mt-0 tablet:border-t tablet:border-line tablet:pt-14">
        <CheckPills pills={view.pills} />
      </div>
    </section>
  );
}
