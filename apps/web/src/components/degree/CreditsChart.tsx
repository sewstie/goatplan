"use client";

import { cx } from "@/components/ui/cx";
import { CREDITS_PER_UNIT, formatUnits, unitLabel, type CreditsPerTerm, type TermBar } from "@/lib/degree";
import { useDegreeUi } from "./degreeUi";

const CHART_HEIGHT = 120;

function ticks(top: number): number[] {
  return Array.from({ length: top + 1 }, (_, value) => value);
}

function Bar({ bar, top, muted = false }: { bar: TermBar; top: number; muted?: boolean }) {
  const selected = useDegreeUi((state) => state.selectedTerm);
  const set = useDegreeUi((state) => state.set);
  const total = bar.done + bar.planned;
  const scale = (credits: number) => (credits / CREDITS_PER_UNIT / top) * CHART_HEIGHT;
  const isSelected = bar.key !== null && selected === bar.key;
  const body = (
    <>
      <span className="pb-3 text-tile leading-14-4 font-650">{formatUnits(total)}</span>
      {total === 0 ? (
        <span aria-hidden className="h-2 w-full bg-accent" />
      ) : (
        <span aria-hidden className={cx("flex w-full flex-col justify-end overflow-hidden rounded-t-swatch", isSelected && "outline-2 outline-offset-1 outline-ink")}>
          {bar.planned > 0 && <span className="w-full bg-chart-planned" style={{ height: scale(bar.planned) }} />}
          {bar.done > 0 && <span className={cx("w-full", muted ? "bg-chart-none" : "bg-chart-done")} style={{ height: scale(bar.done) }} />}
        </span>
      )}
    </>
  );
  const name = `${bar.label}: ${formatUnits(bar.done)} done, ${formatUnits(bar.planned)} planned`;
  if (bar.key === null) {
    return <div role="img" aria-label={name} title={name} className="flex w-full flex-col items-center justify-end">{body}</div>;
  }
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      aria-label={`${name}. Highlight these courses on the sheet`}
      title={unitLabel(total)}
      onClick={() => set({ selectedTerm: isSelected ? null : bar.key, filter: null })}
      className="flex w-full cursor-pointer flex-col items-center justify-end rounded-badge"
    >
      {body}
    </button>
  );
}

export function CreditsChart({ credits }: { credits: CreditsPerTerm }) {
  const { bars, noTerm, prior, average } = credits;
  const aside = [prior, noTerm].filter((bar) => bar.done + bar.planned > 0);
  const largest = Math.max(...bars.map((bar) => bar.done + bar.planned), ...aside.map((bar) => bar.done + bar.planned), CREDITS_PER_UNIT) / CREDITS_PER_UNIT;
  const top = Math.ceil(largest);
  const position = (units: number) => (units / top) * CHART_HEIGHT;
  const minWidth = Math.max(260, bars.length * 56 + 75);

  return (
    <figure className="flex flex-col overflow-x-auto pt-20" aria-label="Units per term chart">
      <div className="flex" style={{ minWidth }}>
        <div aria-hidden className="relative w-24 shrink-0" style={{ height: CHART_HEIGHT }}>
          {ticks(top).map((tick) => (
            <span key={tick} className="absolute right-8 -translate-y-1/2 text-caption leading-14-4 text-ink-muted tablet:text-8" style={{ bottom: position(tick) - 14 }}>{tick}</span>
          ))}
        </div>
        <div className="relative flex min-w-0 flex-1 items-end" style={{ height: CHART_HEIGHT }}>
          <div aria-hidden className="absolute inset-0">
            {ticks(top).map((tick) => (
              <span key={tick} className="absolute inset-x-0 h-px bg-chart-grid" style={{ bottom: position(tick) }} />
            ))}
            {average !== null && <span className="absolute inset-x-0 border-t border-dashed border-ink-muted" style={{ bottom: position(average / CREDITS_PER_UNIT), right: "24%" }} />}
          </div>
          <div className="relative flex w-3/4 items-end justify-around gap-6 px-8">
            {bars.map((bar) => <div key={bar.label} className="w-full max-w-48"><Bar bar={bar} top={top} /></div>)}
          </div>
          {aside.length > 0 && (
            <div className="relative flex w-1/4 items-end justify-around gap-6 border-l border-dashed border-tile-empty-line px-8" style={{ height: CHART_HEIGHT }}>
              {aside.map((bar) => <div key={bar.label} className="w-full max-w-48"><Bar bar={bar} top={top} muted /></div>)}
            </div>
          )}
        </div>
      </div>
      <div className="flex pl-24" style={{ minWidth }}>
        <div className="w-3/4 pt-9">
          <div className="flex justify-around gap-6 px-8 text-caption leading-14-4 text-ink-soft tablet:text-8">
            {bars.map((bar) => <span key={bar.label} className="w-full max-w-48 text-center whitespace-nowrap">{bar.axis[0]} {String(bar.year).slice(-2)}</span>)}
          </div>

        </div>
        {aside.length > 0 && (
          <div className="flex w-1/4 justify-around gap-6 border-l border-dashed border-tile-empty-line px-8 pt-9 text-center text-caption leading-14-4 text-ink-soft tablet:text-8">
            {aside.map((bar) => <span key={bar.label} className="w-full max-w-48 whitespace-nowrap">{bar.axis}</span>)}
          </div>
        )}
      </div>
    </figure>
  );
}
