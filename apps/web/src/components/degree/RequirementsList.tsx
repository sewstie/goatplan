"use client";

import { useId, useState } from "react";
import { CheckCircle, Circle, CircleDashed, Info } from "@phosphor-icons/react/ssr";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { lineName, sectionsWithMqp, tileMatchesFilter, type SheetSection, type SheetTile } from "@/lib/degree";
import { CheckPills } from "./CheckPills";
import { useDegreeUi } from "./degreeUi";
import type { DegreeView } from "./useDegreeView";

const share = (count: number, total: number) => (total > 0 ? `${Math.min(100, (count / total) * 100)}%` : "0%");

function tileWord(tile: SheetTile) {
  if (tile.kind === "planned") return { word: "Planned", Icon: CircleDashed };
  if (tile.kind === "check") return { word: "Check this yourself", Icon: Info };
  if (tile.kind === "done" || (tile.kind === "tick" && tile.checked)) return { word: "Done", Icon: CheckCircle };
  return { word: "Missing", Icon: Circle };
}

function Row({ section }: { section: SheetSection }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const filter = useDegreeUi((state) => state.filter);
  const openPanel = useDegreeUi((state) => state.open);
  const { name, lineRange, done, planned, total, tiles } = section;
  const toGo = total - done - planned;
  const shown = filter ? tiles.filter((tile) => tileMatchesFilter(tile, filter)) : tiles;
  return (
    <li className="border-t border-line">
      <h3>
        <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)} className="flex w-full cursor-pointer flex-col gap-8 py-14 text-left tablet:flex-row tablet:items-center tablet:gap-20">
          <span className="w-190 shrink-0">
            <span className="block text-9 leading-15 font-650">{name}</span>
            <span className="block pt-4 text-caption leading-14-4 text-ink-muted">{lineRange}</span>
          </span>
          <span className="min-w-0 flex-1">
            <span
              role="progressbar"
              aria-label={`${name}: ${done} of ${total}`}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={done}
              aria-valuetext={`${done} done, ${planned} planned, ${toGo} to go`}
              className="flex h-6 overflow-hidden rounded-pill bg-track"
            >
              <span className="bg-accent" style={{ width: share(done, total) }} />
              <span className="bg-chart-planned" style={{ width: share(planned, total) }} />
            </span>
            <span className="block pt-6 text-caption leading-14-4 text-ink-muted">{done} done · {planned} planned · {toGo} to go</span>
          </span>
          <span className="shrink-0 text-right text-8-5 leading-16 font-650 tablet:w-40">{done}/{total}</span>
        </button>
      </h3>
      <div id={panelId} hidden={!open}>
        {open && (
          <ul className="pb-12 tablet:pl-210">
            {shown.map((tile) => {
              const { word, Icon } = tileWord(tile);
              const text = `${tile.course ? `${tile.course} → ` : ""}${tile.number ? lineName(tile.line) : `${tile.label}, line 7`}`;
              return (
                <li key={tile.key} className="flex items-center justify-between gap-12 border-t border-line py-7 first:border-t-0">
                  {tile.course ? (
                    <button type="button" onClick={() => openPanel({ kind: "options", code: tile.course! })} className="cursor-pointer rounded-badge text-left text-8-5 leading-16 hover:text-accent">{text}</button>
                  ) : tile.kind === "empty" ? (
                    <button type="button" onClick={() => openPanel({ kind: "fill", line: tile.line })} className="cursor-pointer rounded-badge text-left text-8-5 leading-16 text-ink-muted hover:text-accent">{text}</button>
                  ) : (
                    <span className="text-8-5 leading-16 text-ink-muted">{text}</span>
                  )}
                  <span className="flex shrink-0 items-center gap-4 text-caption leading-14-4 font-570 text-ink-soft"><Icon aria-hidden className="size-13" />{word}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </li>
  );
}

export function RequirementsList({ view }: { view: DegreeView }) {
  const phone = usePhoneViewport();
  const sections = phone ? view.sheet.sections : sectionsWithMqp(view.sheet.sections);
  return (
    <section aria-label="Your requirements" className="rounded-panel border border-card-line bg-surface px-16 pt-18 pb-14 tablet:px-22">
      <div className="flex items-center justify-between gap-12 pb-16">
        <h2 className="text-12 leading-19-2 font-650">Your requirements</h2>
        <p className="text-caption leading-14-4 text-ink-muted">Same 45 lines · list view</p>
      </div>
      <ul>
        {sections.map((section) => <Row key={section.id} section={section} />)}
      </ul>
      <div className="border-t border-line pt-14">
        <CheckPills pills={view.pills} />
      </div>
    </section>
  );
}
