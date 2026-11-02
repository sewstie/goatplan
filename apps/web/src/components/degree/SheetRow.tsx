"use client";

import { useId, useState } from "react";
import { CaretDown } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import { tileMatchesFilter, type DegreeHistory, type SheetSection } from "@/lib/degree";
import { SheetTile } from "./SheetTile";
import { useDegreeUi } from "./degreeUi";
import type { DegreeView } from "./useDegreeView";

const lines = (count: number) => `${count} lines`;

function Grid({ section, view, history }: { section: SheetSection; view: DegreeView; history: DegreeHistory }) {
  const filter = useDegreeUi((state) => state.filter);
  const tiles = filter ? section.tiles.filter((tile) => tileMatchesFilter(tile, filter)) : section.tiles;
  if (section.id === "cs") {
    const courseTiles = tiles.filter((tile) => tile.kind !== "tick");
    const projectTiles = tiles.filter((tile) => tile.kind === "tick");
    return (
      <div className="grid grid-cols-2 gap-6 tablet:grid-cols-3 wide:grid-cols-6">
        {courseTiles.map((tile) => <SheetTile key={tile.key} tile={tile} view={view} history={history} />)}
        {projectTiles.length > 0 && (
          <div className="col-span-full grid grid-cols-3 gap-6 wide:contents">
            <p className="col-span-full pt-4 text-caption leading-14-4 text-ink-muted wide:hidden"><b className="pr-8 font-650 text-ink">MQP</b>Included in the 18 CS lines</p>
            {projectTiles.map((tile) => <SheetTile key={tile.key} tile={tile} view={view} history={history} />)}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className={cx("grid gap-6", section.id === "wpe" ? "grid-cols-2 wide:grid-cols-4" : "grid-cols-2 tablet:grid-cols-3 wide:grid-cols-6")}>
      {tiles.map((tile) => <SheetTile key={tile.key} tile={tile} view={view} history={history} />)}
    </div>
  );
}

/** One section of the sheet. A phone folds it into a card that opens; wider screens always show the tiles. */
export function SheetRow({ section, view, history }: { section: SheetSection; view: DegreeView; history: DegreeHistory }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const filter = useDegreeUi((state) => state.filter);
  const unfolded = open || filter !== null;

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
      <div className="flex gap-16 tablet:py-9">
        <div className="hidden w-114 shrink-0 tablet:block wide:w-178">
          <h3 className="text-9 leading-15 font-650">{section.name}</h3>
          <p className="pt-7 text-caption leading-14-4 text-ink-muted">
            <b className="font-650 text-ink">{section.done}</b> / {lines(section.total)}
            {section.planned > 0 && <span className="pl-8 text-accent">+{section.planned} planned</span>}
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
