"use client";

import { DotsThree, ListDashes, Plus, SquaresFour } from "@phosphor-icons/react/ssr";
import { TermPicker } from "@/components/courses/TermPicker";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";
import { useDegreeUi } from "./degreeUi";
import { SHEETS } from "@/lib/degree/sheets";
import { MajorPicker } from "./MajorPicker";

const VIEWS = [
  { value: "sheet", label: "Sheet", icon: <SquaresFour aria-hidden /> },
  { value: "list", label: "List", icon: <ListDashes aria-hidden /> },
] as const;

export function DegreeTitle({ hasCourses, selectedSheetId, showSheetControls = true }: { hasCourses: boolean; selectedSheetId: string | null; showSheetControls?: boolean }) {
  const view = useDegreeUi((state) => state.view);
  const set = useDegreeUi((state) => state.set);
  const open = useDegreeUi((state) => state.open);
  const phone = usePhoneViewport();
  const sheet = SHEETS.find((item) => item.id === selectedSheetId);

  return (
    <header className="flex flex-col gap-14 tablet:flex-row tablet:items-center tablet:justify-between tablet:gap-20">
      <div className="min-w-0">
        <div className="flex items-center gap-14">
          <h1 data-screen-heading tabIndex={-1} className="text-25 leading-30 font-700 tracking-title outline-none">My degree</h1>
          {sheet?.status === "beta" && <Badge className="text-caption!">Beta</Badge>}
        </div>
        <p className="pt-4 text-tile leading-16 text-ink-muted">Unofficial · Check with your advisor and Workday’s Academic Progress.</p>
        <div className="flex flex-wrap items-center gap-x-10 gap-y-4 pt-6">
          <p className="text-9 leading-17 text-ink-soft">{sheet ? `${sheet.major} · Class of ${sheet.classYear}${sheet.status === "beta" ? " · Beta" : ""}` : "Saved major unavailable"}</p>
          <MajorPicker selected={selectedSheetId} />
        </div>
        {sheet?.status === "beta" && <p className="text-8-5 leading-17 text-ink-muted">Not yet checked by {"AEFHILMNORSX".includes(sheet.abbreviation[0]) ? "an" : "a"} {sheet.abbreviation} student. <a className="rounded-badge underline hover:text-ink" href="https://github.com/sewstie/goatplan/issues/new?title=Degree%20sheet%20feedback" target="_blank" rel="noreferrer">Tell us if something looks wrong.</a></p>}
      </div>
      {showSheetControls && <div className="flex items-center justify-between gap-10 tablet:justify-end">
        {!phone && <div className="hidden tablet:block"><TermPicker inline /></div>}
        <SegmentedSwitch label="Sheet or list" options={VIEWS} value={view} onChange={(value) => set({ view: value })} />
        <div className="flex items-center gap-10">
          {hasCourses && (
            <Button icon={<Plus aria-hidden />} className="min-h-36 px-12" onClick={() => open({ kind: "history", tab: "search" })}>Add courses</Button>
          )}
          <button type="button" aria-label="Sheet options" onClick={() => open({ kind: "menu" })} className="flex size-36 cursor-pointer items-center justify-center rounded-row text-ink hover:bg-surface-selected">
            <DotsThree aria-hidden weight="bold" className="size-20" />
          </button>
        </div>
      </div>}
    </header>
  );
}
