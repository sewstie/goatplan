"use client";

import { ClockCounterClockwise, Plus } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDegreeUi } from "./degreeUi";
import { SHEETS } from "@/lib/degree/sheets";
import { MajorPicker } from "./MajorPicker";

export function DegreeTitle({ selectedSheetId, showSheetControls = true }: { hasCourses: boolean; selectedSheetId: string | null; showSheetControls?: boolean }) {
  const open = useDegreeUi((state) => state.open);
  const sheet = SHEETS.find((item) => item.id === selectedSheetId);

  return (
    <header className="degree-title flex flex-col gap-14 tablet:flex-row tablet:items-center tablet:justify-between tablet:gap-20">
      <div className="min-w-0">
        <div className="flex items-center gap-14">
          <h1 data-screen-heading tabIndex={-1} className="text-25 leading-30 font-700 tracking-title outline-none">My degree</h1>
          {sheet?.status === "beta" && <Badge className="text-caption!">Beta</Badge>}
        </div>
        <div className="degree-major flex flex-wrap items-center gap-x-10 gap-y-4 pt-6">
          <p className="text-9 leading-17 text-ink-soft"><strong>{sheet?.major ?? "Saved major unavailable"}</strong> <span className="ml-8">Class of {sheet?.classYear ?? 2030}</span></p>
          <MajorPicker selected={selectedSheetId} />
        </div>
        <p className="pt-4 text-tile leading-16 text-ink-muted">Unofficial · Check with your advisor and Workday’s Academic Progress.</p>
      </div>
      {showSheetControls && <div className="flex items-center justify-between gap-10 tablet:justify-end">
        <Button variant="secondary" icon={<ClockCounterClockwise aria-hidden />} onClick={() => open({ kind: "history", tab: "history" })}>Course history</Button>
        <div className="flex items-center gap-10">
          {(
            <Button icon={<Plus aria-hidden />} className="min-h-36 px-12" onClick={() => open({ kind: "history", tab: "search" })}>Add courses</Button>
          )}
        </div>
      </div>}
    </header>
  );
}
