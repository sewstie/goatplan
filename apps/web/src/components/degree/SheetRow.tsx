"use client";

import { useId, useState } from "react";
import { CaretDown, CheckCircle, Info } from "@phosphor-icons/react/ssr";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { cx } from "@/components/ui/cx";
import { isTileStack, sectionFinished, stackEmptyTiles, tileMatchesFilter, type DegreeHistory, type SheetSection, type TermName } from "@/lib/degree";
import { SectionProgress } from "./SectionProgress";
import { SheetTile } from "./SheetTile";
import { StackedTile } from "./StackedTile";
import { useDegreeUi } from "./degreeUi";
import type { DegreeView } from "./useDegreeView";

type RowProps = { section: SheetSection; view: DegreeView; history: DegreeHistory; current: TermName | null };

const WIDE_GRID = "tablet:grid-cols-3 wide:grid-cols-6";

function Grid({ section, view, history, current }: RowProps) {
  const filter = useDegreeUi((state) => state.filter);
  const phone = usePhoneViewport();
  const tiles = filter ? section.tiles.filter((tile) => tileMatchesFilter(tile, filter)) : section.tiles;
  // Only a phone still has the project lines in this section. Wider screens give them a row of their own.
  if (section.id === "cs" && tiles.some((tile) => tile.kind === "tick")) {
    const courseTiles = tiles.filter((tile) => tile.kind !== "tick");
    const projectTiles = tiles.filter((tile) => tile.kind === "tick");
    return (
      <div className="grid grid-cols-2 gap-6">
        {courseTiles.map((tile) => <SheetTile key={tile.key} tile={tile} view={view} history={history} current={current} />)}
        <div className="col-span-full grid grid-cols-2 gap-6">
          <p className="col-span-full pt-4 text-8 leading-16 text-ink-muted"><b className="pr-8 font-650 text-ink">MQP</b>Included in the 18 CS lines</p>
          {projectTiles.map((tile) => <SheetTile key={tile.key} tile={tile} view={view} history={history} current={current} />)}
        </div>
      </div>
    );
  }
  return (
    <div className={cx("grid grid-cols-2 gap-6", section.id === "wpe" ? "tablet:grid-cols-4 wide:grid-cols-6" : WIDE_GRID)}>
      {(phone ? tiles : stackEmptyTiles(tiles)).map((item) => (isTileStack(item)
        ? <StackedTile key={item.key} stack={item} view={view} history={history} current={current} />
        : <SheetTile key={item.key} tile={item} view={view} history={history} current={current} />))}
    </div>
  );
}

export function SheetRow({ section, view, history, current }: RowProps) {
  const [open, setOpen] = useState(false);
  const [showFinished, setShowFinished] = useState(false);
  const panelId = useId();
  const filter = useDegreeUi((state) => state.filter);
  const selectedTerm = useDegreeUi((state) => state.selectedTerm);
  const unfolded = open || filter !== null;
  const lit = selectedTerm !== null && section.tiles.some((tile) => tile.term === selectedTerm);
  const finished = sectionFinished(section) && filter === null && !lit;
  const folded = finished && !showFinished;

  return (
    <li className="rounded-tile border border-card-line bg-surface tablet:rounded-none tablet:border-0 tablet:border-t tablet:border-line tablet:bg-transparent">
      <h3 className="tablet:hidden">
        <button type="button" aria-expanded={unfolded} aria-controls={panelId} onClick={() => setOpen(!open)} className="flex w-full cursor-pointer items-center justify-between gap-16 px-14 py-14 text-left">
          <span className="flex min-w-0 flex-1 flex-col gap-6">
            <span className="block text-11 leading-15-95 font-650">{section.name}</span>
            <SectionProgress section={section} />
          </span>
          <CaretDown aria-hidden className={cx("size-13 shrink-0 text-ink-muted transition-transform motion-reduce:transition-none", unfolded && "rotate-180")} />
        </button>
      </h3>
      {finished && (
        <h3 className="hidden tablet:block">
          <button type="button" aria-expanded={!folded} onClick={() => setShowFinished(!showFinished)} className="group flex w-full cursor-pointer items-center gap-20 py-12 text-left">
            <span className="degree-row-label flex w-180 shrink-0 flex-col gap-3">
              <span className="text-17 font-650">{section.name}</span>
              <span className="flex items-center gap-4 text-8 leading-16 font-570 text-success-ink"><CheckCircle aria-hidden weight="fill" className="size-12" />Complete</span>
            </span>
            <span className="min-w-0 flex-1 truncate text-8 leading-16 text-ink-muted">{section.tiles.map((tile) => tile.course ?? tile.label).join(" · ")}</span>
            <span className="flex shrink-0 items-center gap-5 text-8 leading-16 font-570 text-accent group-hover:underline">
              {folded ? "Show" : "Hide"}
              <CaretDown aria-hidden className={cx("size-11 transition-transform motion-reduce:transition-none", !folded && "rotate-180")} />
            </span>
          </button>
        </h3>
      )}
      <div className={cx("flex gap-20 tablet:py-14", folded && "tablet:hidden", finished && "tablet:pt-0")}>
        <div className="degree-row-label hidden w-180 shrink-0 flex-col gap-8 tablet:flex">
          {!finished && <h3 className="text-17 font-650">{section.name}</h3>}
          {!finished && <SectionProgress section={section} />}
        </div>
        <div id={panelId} className={cx("min-w-0 flex-1 flex-col gap-0 px-14 pb-14 tablet:flex tablet:p-0", unfolded ? "flex" : "hidden")}>
          <Grid section={section} view={view} history={history} current={current} />
          {section.note && <p className="flex items-start gap-5 pt-8 text-8 leading-16 text-ink-muted tablet:text-8 tablet:leading-16"><Info aria-hidden className="mt-1 size-12 shrink-0" />{section.note}</p>}
        </div>
      </div>
    </li>
  );
}
