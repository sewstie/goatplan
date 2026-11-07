"use client";

import { Plus } from "@phosphor-icons/react/ssr";
import { CheckBox } from "@/components/ui/CheckField";
import { cx } from "@/components/ui/cx";
import { findHistoryCourse, getDegreeSource, type DegreeHistory, type SheetTile, type TermName, type TileStack } from "@/lib/degree";
import { useDegreeUi } from "./degreeUi";
import { TILE_LOOK, tileState } from "./tileState";

export const ROW = "grid w-full grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-x-10 gap-y-2 rounded-row px-6 py-9 text-left tablet:grid-cols-[2rem_minmax(0,10rem)_minmax(0,1fr)_minmax(0,7rem)_7.25rem] tablet:gap-x-14";

export function RequirementLine({ tile, history, current }: { tile: SheetTile; history: DegreeHistory; current: TermName | null }) {
  const open = useDegreeUi((state) => state.open);
  const state = tileState(tile, history, current);
  const { word, Icon, pill, ink } = TILE_LOOK[state];
  const title = tile.course ? findHistoryCourse(history, tile.course)?.title : undefined;

  const number = <span className="text-8 leading-16 text-ink-faint tabular-nums">{tile.number}</span>;
  const requirement = <span className="truncate text-8 leading-16 text-ink-muted tablet:text-8-5 tablet:leading-16 tablet:text-ink-soft">{tile.label}</span>;
  const when = <span className="hidden truncate text-8 leading-16 text-ink-muted tablet:block">{tile.detail ?? ""}</span>;
  const status = (
    <span className={cx("inline-flex items-center gap-4 justify-self-end rounded-badge border px-6 py-3 text-8 leading-14 font-570 whitespace-nowrap tablet:justify-self-start", pill)}>
      <Icon aria-hidden weight="bold" className="size-11" />{word}
    </span>
  );

  if (tile.kind === "tick") {
    const manualId = tile.manualId;
    return (
      <label className={cx(ROW, manualId ? "cursor-pointer hover:bg-surface-subtle" : "cursor-default")}>
        {number}
        <span className="flex min-w-0 items-center gap-8 tablet:contents">
          {requirement}
          <span className="flex min-w-0 items-center gap-8">
            <CheckBox small aria-label={`${tile.label}${tile.number ? `, line ${tile.line}` : ""}`} checked={tile.checked} disabled={!manualId} onChange={(event) => manualId && getDegreeSource().setManualItem(manualId, event.target.checked)} />
            <span className={cx("text-8-5 leading-16", tile.checked ? "font-570 text-success-ink" : "text-ink-soft")}>{tile.checked ? "Done" : "Tick when done"}</span>
          </span>
        </span>
        {when}
        {status}
      </label>
    );
  }

  if (tile.kind === "empty") {
    return (
      <button type="button" aria-label={`${tile.label}, line ${tile.line}, empty. Find courses that fit`} onClick={() => open({ kind: "fill", line: tile.line })} className={cx(ROW, "group cursor-pointer hover:bg-accent-soft")}>
        {number}
        <span className="flex min-w-0 flex-col tablet:contents">
          {requirement}
          <span className="flex items-center gap-5 text-8-5 leading-16 font-570 text-accent group-hover:underline"><Plus aria-hidden weight="bold" className="size-11" />Add a course</span>
        </span>
        {when}
        {status}
      </button>
    );
  }

  const code = tile.course;
  const words = state === "progress" ? "in progress" : tile.kind === "planned" ? "planned" : tile.kind === "check" ? "check this yourself" : "done";
  return (
    <button type="button" aria-label={`${code ?? tile.label}, line ${tile.line}, ${words}${tile.pinned ? ", pinned" : ""}${tile.detail ? `, ${tile.detail}` : ""}. Course options`} onClick={() => code && open({ kind: "options", code })} className={cx(ROW, "cursor-pointer hover:bg-surface-subtle")}>
      {number}
      <span className="flex min-w-0 flex-col tablet:contents">
        {requirement}
        <span className="flex min-w-0 items-baseline gap-8">
          <span className={cx("shrink-0 text-9 leading-15 font-650", ink === "text-ink" ? "text-ink" : ink)}>{code ?? tile.label}</span>
          {title && <span className="truncate text-8 leading-16 text-ink-muted">{title}</span>}
        </span>
      </span>
      {when}
      {status}
    </button>
  );
}

export function RequirementStack({ stack }: { stack: TileStack }) {
  const open = useDegreeUi((state) => state.open);
  const { label, tiles } = stack;
  const { Icon, pill } = TILE_LOOK.empty;
  return (
    <button type="button" aria-label={`${label}, ${tiles.length} lines left, lines ${tiles[0].line} to ${tiles.at(-1)!.line}. Find courses that fit`} onClick={() => open({ kind: "fill", line: tiles[0].line })} className={cx(ROW, "group cursor-pointer hover:bg-accent-soft")}>
      <span className="text-8 leading-16 text-ink-faint tabular-nums">{tiles[0].number}–{tiles.at(-1)!.number}</span>
      <span className="flex min-w-0 flex-col tablet:contents">
        <span className="truncate text-8 leading-16 text-ink-muted tablet:text-8-5 tablet:leading-16 tablet:text-ink-soft">{label} <span className="text-ink-muted">× {tiles.length}</span></span>
        <span className="flex items-center gap-5 text-8-5 leading-16 font-570 text-accent group-hover:underline"><Plus aria-hidden weight="bold" className="size-11" />Add a course</span>
      </span>
      <span className="hidden tablet:block" />
      <span className={cx("inline-flex items-center gap-4 justify-self-end rounded-badge border px-6 py-3 text-8 leading-14 font-570 whitespace-nowrap tablet:justify-self-start", pill)}>
        <Icon aria-hidden weight="bold" className="size-11" />{tiles.length} needed
      </span>
    </button>
  );
}
