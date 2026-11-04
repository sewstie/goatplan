"use client";

import { useState } from "react";
import { CaretDown, Plus } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import type { DegreeHistory, TileStack } from "@/lib/degree";
import { SheetTile } from "./SheetTile";
import { lineDropProps } from "./tileDrag";
import type { DegreeView } from "./useDegreeView";

export function StackedTile({ stack, view, history }: { stack: TileStack; view: DegreeView; history: DegreeHistory }) {
  const [open, setOpen] = useState(false);
  const { label, tiles } = stack;
  const first = tiles[0].line;
  const last = tiles.at(-1)!.line;
  return (
    <div className={open ? "col-span-full flex flex-col gap-6 rounded-row border border-dashed border-tile-empty-line p-6" : "contents"}>
      <button
        type="button"
        {...lineDropProps(view, history, first)}
        aria-expanded={open}
        aria-label={`${label}, ${tiles.length} lines left, lines ${first} to ${last}. ${open ? "Hide them" : "Show them"}`}
        onClick={() => setOpen(!open)}
        className={cx(
          "flex w-full cursor-pointer items-center gap-7 rounded-row text-left",
          open ? "px-3 py-1" : "min-h-43 border border-dashed border-tile-empty-line bg-tile-empty py-5 pr-9 pl-9 shadow-[0.1875rem_0.1875rem_0_0_var(--color-tile-empty-line)] hover:border-tile-planned-line",
        )}
      >
        {open ? <CaretDown aria-hidden className="size-13 shrink-0 rotate-180 text-ink" /> : <Plus aria-hidden className="size-13 shrink-0 text-ink" />}
        <span className="min-w-0 flex-1 text-caption leading-14-4 text-ink-soft"><b className="font-600">{label}</b> · {tiles.length} left</span>
      </button>
      {open && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-6">
          {tiles.map((tile) => <SheetTile key={tile.key} tile={tile} view={view} history={history} />)}
        </div>
      )}
    </div>
  );
}
