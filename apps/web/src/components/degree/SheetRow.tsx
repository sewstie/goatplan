"use client";

import { useId, useState } from "react";
import { CaretDown, Check } from "@phosphor-icons/react/ssr";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { cx } from "@/components/ui/cx";
import { isTileStack, sectionFinished, stackEmptyTiles, tileMatchesFilter, type DegreeHistory, type SheetSection } from "@/lib/degree";
import { SheetTile } from "./SheetTile";
import { StackedTile } from "./StackedTile";
import { useDegreeUi } from "./degreeUi";
import type { DegreeView } from "./useDegreeView";

const lines = (count: number) => `${count} ${count === 1 ? "line" : "lines"}`;
const WIDE_GRID = "tablet:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]";

function Grid({ section, view, history }: { section: SheetSection; view: DegreeView; history: DegreeHistory }) {
  const filter = useDegreeUi((state) => state.filter);
  const phone = usePhoneViewport();
  const tiles = filter ? section.tiles.filter((tile) => tileMatchesFilter(tile, filter)) : section.tiles;
  // Only a phone still has the project lines in this section. Wider screens give them a row of their own.
  if (section.id === "cs" && tiles.some((tile) => tile.kind === "tick")) {
    const courseTiles = tiles.filter((tile) => tile.kind !== "tick");
    const projectTiles = tiles.filter((tile) => tile.kind === "tick");
    return (
      <div className="grid grid-cols-2 gap-6">
        {courseTiles.map((tile) => <SheetTile key={tile.key} tile={tile} view={view} history={history} />)}
        <div className="col-span-full grid grid-cols-3 gap-6">
          <p className="col-span-full pt-4 text-caption leading-14-4 text-ink-muted"><b className="pr-8 font-650 text-ink">MQP</b>Included in the 18 CS lines</p>
          {projectTiles.map((tile) => <SheetTile key={tile.key} tile={tile} view={view} history={history} />)}
        </div>
      </div>
    );
  }
  return (
    <div className={cx("grid grid-cols-2 gap-6", WIDE_GRID)}>
      {(phone ? tiles : stackEmptyTiles(tiles)).map((item) => (isTileStack(item)
        ? <StackedTile key={item.key} stack={item} view={view} history={history} />
        : <SheetTile key={item.key} tile={item} view={view} history={history} />))}
    </div>
  );
}

export function SheetRow({ section, view, history }: { section: SheetSection; view: DegreeView; history: DegreeHistory }) {
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
        <button type="button" aria-expanded={unfolded} aria-controls={panelId} onClick={() => setOpen(!open)} className="flex w-full cursor-pointer items-center justify-between gap-12 px-14 py-14 text-left">
          <span className="min-w-0">
            <span className="block text-11 leading-15-95 font-650">{section.name}</span>
            <span className="block pt-3 text-8 leading-14-4 text-ink-muted">{section.caption ?? section.lineRange}</span>
          </span>
          <span className="flex shrink-0 items-center gap-16">
            <span className="text-8 leading-14-4 text-ink-muted"><b className="font-650 text-ink">{section.done}</b> / {lines(section.total)}</span>
            <CaretDown aria-hidden className={cx("size-13 text-ink-muted transition-transform motion-reduce:transition-none", unfolded && "rotate-180")} />
          </span>
        </button>
      </h3>
      {finished && (
        <h3 className="hidden tablet:block">
          <button type="button" aria-expanded={!folded} onClick={() => setShowFinished(!showFinished)} className="flex w-full cursor-pointer items-center gap-8 py-8 text-left">
            <span className="shrink-0 text-14 leading-22 font-650">{section.name}</span>
            <Check aria-label="finished" className="size-14 shrink-0 text-success" />
            <span className="min-w-0 flex-1 truncate text-caption leading-14-4 text-ink-muted">{section.tiles.map((tile) => tile.course ?? tile.label).join(" · ")}</span>
            <CaretDown aria-hidden className={cx("size-13 shrink-0 text-ink-muted transition-transform motion-reduce:transition-none", !folded && "rotate-180")} />
          </button>
        </h3>
      )}
      <div className={cx("flex gap-16 tablet:py-8", folded && "tablet:hidden", finished && "tablet:pt-0")}>
        <div className="hidden w-120 shrink-0 tablet:block">
          {!finished && <h3 className="text-14 leading-22 font-650">{section.name}</h3>}
          <p className="pt-2 text-caption leading-14-4 text-ink-muted">
            <b className="font-650 text-ink">{section.done}</b> / {lines(section.total)}
            {section.planned > 0 && <span className="block text-accent">+{section.planned} planned</span>}
          </p>
        </div>
        <div id={panelId} className={cx("min-w-0 flex-1 flex-col gap-0 px-14 pb-14 tablet:flex tablet:p-0", unfolded ? "flex" : "hidden")}>
          <Grid section={section} view={view} history={history} />
          {section.note && <p className="pt-6 text-micro leading-13 text-ink-muted tablet:text-caption tablet:leading-14-4">{section.note}</p>}
        </div>
      </div>
    </li>
  );
}
