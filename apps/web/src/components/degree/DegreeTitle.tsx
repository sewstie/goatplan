"use client";

import { DotsThree, ListDashes, Plus, SquaresFour } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";
import { useDegreeUi } from "./degreeUi";

const VIEWS = [
  { value: "sheet", label: "Sheet", icon: <SquaresFour aria-hidden /> },
  { value: "list", label: "List", icon: <ListDashes aria-hidden /> },
] as const;

export function DegreeTitle({ hasCourses }: { hasCourses: boolean }) {
  const view = useDegreeUi((state) => state.view);
  const set = useDegreeUi((state) => state.set);
  const open = useDegreeUi((state) => state.open);

  return (
    <header className="flex flex-col gap-14 tablet:flex-row tablet:items-start tablet:justify-between tablet:gap-20">
      <div className="min-w-0">
        <div className="flex items-center gap-14">
          <h1 data-screen-heading tabIndex={-1} className="text-25 leading-30 font-700 tracking-title outline-none">My degree</h1>
          <Badge className="text-caption!">Beta</Badge>
        </div>
        <p className="pt-9 text-tile leading-16 text-ink-muted">Unofficial · Check with your advisor and Workday’s Academic Progress.</p>
      </div>
      <div className="flex items-center justify-between gap-10 tablet:justify-end">
        <SegmentedSwitch label="Sheet or list" options={VIEWS} value={view} onChange={(value) => set({ view: value })} />
        <div className="flex items-center gap-10">
          {hasCourses && (
            <Button icon={<Plus aria-hidden />} className="min-h-40 px-15" onClick={() => open({ kind: "history", tab: "search" })}>Add courses</Button>
          )}
          <button type="button" aria-label="Sheet options" onClick={() => open({ kind: "menu" })} className="flex size-36 cursor-pointer items-center justify-center rounded-row text-ink hover:bg-surface-selected">
            <DotsThree aria-hidden weight="bold" className="size-20" />
          </button>
        </div>
      </div>
    </header>
  );
}
