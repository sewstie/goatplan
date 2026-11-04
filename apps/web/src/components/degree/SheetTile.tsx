"use client";

import { Check, CircleDashed, Info, Plus, PushPin } from "@phosphor-icons/react/ssr";
import { CheckBox } from "@/components/ui/CheckField";
import { cx } from "@/components/ui/cx";
import { getDegreeSource, type DegreeHistory, type SheetTile as Tile } from "@/lib/degree";
import { useDegreeUi } from "./degreeUi";
import { DRAG_TYPE, lineDropProps } from "./tileDrag";
import type { DegreeView } from "./useDegreeView";

type SheetTileProps = {
  tile: Tile;
  view: DegreeView;
  history: DegreeHistory;
};

const BOX = "group relative flex min-h-43 w-full items-center gap-7 rounded-row border py-5 pr-9 pl-25 text-left";

export function SheetTile({ tile, view, history }: SheetTileProps) {
  const open = useDegreeUi((state) => state.open);
  const selectedTerm = useDegreeUi((state) => state.selectedTerm);
  const highlighted = selectedTerm !== null && tile.term === selectedTerm;

  const number = tile.number && <span aria-hidden className="absolute top-4 left-6 text-micro leading-13 text-ink-faint">{tile.number}</span>;
  const outline = cx(highlighted && "outline-2 -outline-offset-1 outline-accent", tile.pinned && !highlighted && "border-accent! border-[1.5px]");

  if (tile.kind === "tick") {
    const manualId = tile.manualId;
    const isSlot = tile.number === "";
    return (
      <label className={cx(BOX, "border-tile-tick-line bg-surface", manualId ? "cursor-pointer" : "cursor-default", isSlot ? "min-h-50 pl-12" : "")}>
        {number}
        <CheckBox
          small
          aria-label={`${tile.label}${tile.number ? `, line ${tile.line}` : ""}`}
          checked={tile.checked}
          disabled={!manualId}
          onChange={(event) => manualId && getDegreeSource().setManualItem(manualId, event.target.checked)}
        />
        <span className="min-w-0 pl-2">
          <span className="block truncate text-caption leading-14-4 font-510">{tile.label}</span>
          {tile.detail && <span className="block text-micro leading-13 text-ink-muted">{tile.detail}</span>}
        </span>
      </label>
    );
  }

  const dropProps = lineDropProps(view, history, tile.line, tile.course);

  if (tile.kind === "empty") {
    return (
      <button type="button" {...dropProps} aria-label={`${tile.label}, line ${tile.line}, empty. Find courses that fit`} onClick={() => open({ kind: "fill", line: tile.line })} className={cx(BOX, "cursor-pointer border-dashed border-tile-empty-line bg-tile-empty hover:border-tile-planned-line")}>
        {number}
        <Plus aria-hidden className="size-13 shrink-0 text-ink" />
        <span className="line-clamp-2 min-w-0 text-caption leading-14-4 text-ink-soft">{tile.label}</span>
      </button>
    );
  }

  const code = tile.course;
  const words = tile.kind === "planned" ? "planned" : tile.kind === "check" ? "check this yourself" : "done";
  return (
    <button
      type="button"
      draggable={Boolean(code)}
      onDragStart={(event) => {
        if (code) event.dataTransfer.setData(DRAG_TYPE, code);
      }}
      {...(code ? dropProps : {})}
      aria-label={`${code ?? tile.label}, line ${tile.line}, ${words}${tile.pinned ? ", pinned" : ""}${tile.detail ? `, ${tile.detail}` : ""}. Course options`}
      onClick={() => code && open({ kind: "options", code })}
      className={cx(
        BOX,
        "cursor-pointer",
        tile.kind === "done" && "border-transparent bg-tile-done",
        tile.kind === "check" && "border-tile-check-line bg-tile-check",
        tile.kind === "planned" && "border-dashed border-tile-planned-line bg-surface",
        outline,
      )}
    >
      {number}
      <span aria-hidden className={cx("flex shrink-0 self-start pt-0.5 [&_svg]:size-13", tile.kind === "planned" ? "text-ink-soft" : "text-ink")}>
        {tile.kind === "check" ? <Info /> : tile.kind === "planned" ? <CircleDashed /> : <Check />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cx("block truncate text-10 leading-17 font-650", tile.kind === "planned" ? "text-accent" : "text-ink")}>{code ?? tile.label}</span>
        {tile.detail && <span className="block text-micro leading-13 text-ink-muted">{tile.detail}</span>}
      </span>
      {tile.pinned && <PushPin aria-hidden className="size-13 shrink-0 text-ink" />}
    </button>
  );
}
