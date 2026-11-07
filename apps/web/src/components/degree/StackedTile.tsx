"use client";

import { useState } from "react";
import { CaretUp, Plus } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import type { DegreeHistory, TermName, TileStack } from "@/lib/degree";
import { SheetTile, TILE_BOX } from "./SheetTile";
import { lineDropProps } from "./tileDrag";
import type { DegreeView } from "./useDegreeView";

const STACKED = "degree-stack border-dashed border-tile-empty-line bg-tile-empty shadow-[0.1875rem_0.1875rem_0_-0.0625rem_var(--color-tile-empty),0.1875rem_0.1875rem_0_0_var(--color-tile-empty-line)] hover:border-tile-planned-line hover:bg-accent-soft";

export function StackedTile({ stack, view, history, current }: { stack: TileStack; view: DegreeView; history: DegreeHistory; current: TermName | null }) {
  const [open, setOpen] = useState(false);
  const { label, tiles } = stack;
  const first = tiles[0].line;
  const last = tiles.at(-1)!.line;
  return (
    <div className={open ? "col-span-full flex flex-col gap-6 rounded-row border border-dashed border-tile-empty-line bg-tile-empty p-6" : "contents"}>
      <button
        type="button"
        {...lineDropProps(view, history, first)}
        aria-expanded={open}
        aria-label={`${label}, ${tiles.length} lines left, lines ${first} to ${last}. ${open ? "Hide them" : "Show them"}`}
        onClick={() => setOpen(!open)}
        className={open ? "group flex cursor-pointer items-center gap-6 self-start rounded-badge px-4 py-2 text-left" : cx(TILE_BOX, STACKED, "cursor-pointer pr-44")}
      >
        {!open && <span aria-hidden className="absolute top-6 right-7 text-8 leading-16 text-ink-faint tabular-nums">{tiles[0].number}–{tiles.at(-1)!.number}</span>}
        <span className="flex min-w-0 items-center gap-6">
          {open ? <CaretUp aria-hidden weight="bold" className="size-11 shrink-0 text-ink-soft" /> : <Plus aria-hidden weight="bold" className="size-12 shrink-0 text-ink-soft group-hover:text-accent" />}
          <span className={cx("truncate font-600 text-ink-soft group-hover:text-accent", open ? "text-8 leading-16" : "text-9 leading-14-4")}>{open ? `${label} · ${tiles.length} left` : label}</span>
        </span>
        {!open && <span className="truncate pl-18 text-8 leading-16 text-ink-muted group-hover:text-accent">{tiles.length} left · Show lines</span>}
      </button>
      {open && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-6">
          {tiles.map((tile) => <SheetTile key={tile.key} tile={tile} view={view} history={history} current={current} />)}
        </div>
      )}
    </div>
  );
}
