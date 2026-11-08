"use client";

import { PushPin } from "@phosphor-icons/react/ssr";
import { CheckBox } from "@/components/ui/CheckField";
import { cx } from "@/components/ui/cx";
import { getDegreeSource, type DegreeHistory, type SheetTile as Tile, type TermName } from "@/lib/degree";
import { useDegreeUi } from "./degreeUi";
import { TILE_LOOK, tileState } from "./tileState";
import { DRAG_TYPE, lineDropProps } from "./tileDrag";
import type { DegreeView } from "./useDegreeView";

type SheetTileProps = {
  tile: Tile;
  view: DegreeView;
  history: DegreeHistory;
  current: TermName | null;
};

export const TILE_BOX = "degree-tile group relative flex min-h-56 w-full min-w-0 flex-col justify-center gap-2 rounded-row border py-8 pl-10 text-left transition-colors motion-reduce:transition-none";

function Corner({ number, pinned }: { number: string; pinned?: boolean }) {
  if (!number && !pinned) return null;
  return (
    <span aria-hidden className="absolute top-6 right-7 flex items-center gap-3 text-8 leading-16 text-ink-faint tabular-nums">
      {pinned && <PushPin weight="fill" className="size-10 text-ink" />}
      {number}
    </span>
  );
}

export function SheetTile({ tile, view, history, current }: SheetTileProps) {
  const open = useDegreeUi((state) => state.open);
  const selectedTerm = useDegreeUi((state) => state.selectedTerm);
  const highlighted = selectedTerm !== null && tile.term === selectedTerm;
  const state = tileState(tile, history, current);
  const { word, Icon, box, ink } = TILE_LOOK[state];
  const outline = cx(highlighted && "outline-2 -outline-offset-1 outline-accent", tile.pinned && !highlighted && "border-accent");

  if (tile.kind === "tick") {
    const manualId = tile.manualId;
    return (
      <label className={cx(TILE_BOX, "pr-26", box, manualId ? "cursor-pointer hover:border-line-strong" : "cursor-default")}>
        <Corner number={tile.number} />
        <span className="flex min-w-0 items-center gap-7">
          <CheckBox
            small
            aria-label={`${tile.label}${tile.number ? `, line ${tile.line}` : ""}`}
            checked={tile.checked}
            disabled={!manualId}
            onChange={(event) => manualId && getDegreeSource().setManualItem(manualId, event.target.checked)}
          />
          <span className={cx("truncate text-9 leading-14-4 font-600", tile.checked ? ink : "text-ink")}>{tile.label}</span>
        </span>
        <span className="truncate pl-20 text-8 leading-16 text-ink-muted">{tile.detail ?? (tile.checked ? "Done" : "Tick when done")}</span>
      </label>
    );
  }

  const dropProps = lineDropProps(view, history, tile.line, tile.course);

  if (tile.kind === "empty") {
    return (
      <button type="button" {...dropProps} aria-label={`${tile.label}, line ${tile.line}, empty. Find courses that fit`} onClick={() => open({ kind: "fill", line: tile.line })} className={cx(TILE_BOX, "pr-26", box, "cursor-pointer hover:border-tile-planned-line hover:bg-accent-soft")}>
        <Corner number={tile.number} />
        <span className="flex min-w-0 items-center gap-6">
          <Icon aria-hidden weight="bold" className="size-12 shrink-0 text-ink-soft group-hover:text-accent" />
          <span className="truncate text-9 leading-14-4 font-600 text-ink-soft group-hover:text-accent">{tile.label}</span>
        </span>
        <span className="truncate pl-18 text-8 leading-16 text-ink-muted group-hover:text-accent">Add a course</span>
      </button>
    );
  }

  const code = tile.course;
  const words = state === "progress" ? "in progress" : tile.kind === "planned" ? "planned" : tile.kind === "check" ? "check this yourself" : "done";
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
      className={cx(TILE_BOX, "pr-26", box, "cursor-pointer hover:brightness-97", outline)}
    >
      <Corner number={tile.number} pinned={tile.pinned} />
      <span className="flex min-w-0 items-center gap-6">
        <Icon aria-hidden weight="bold" className={cx("size-12 shrink-0", ink)} />
        <span className={cx("truncate text-10 leading-15 font-650", ink)}>{code ?? tile.label}</span>
      </span>
      <span className="truncate pl-18 text-8 leading-16 text-ink-muted">{tile.detail ?? (tile.kind === "check" ? "Check this yourself" : word)}</span>
    </button>
  );
}
