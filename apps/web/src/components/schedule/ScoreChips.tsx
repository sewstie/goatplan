import { useId } from "react";
import { cx } from "@/components/ui/cx";
import type { ScheduleBadge } from "./scheduleCopy";

const TONE: Readonly<Record<ScheduleBadge["tone"], string>> = {
  plain: "bg-surface text-ink-muted",
  good: "bg-success-soft text-success-ink",
  warning: "bg-warning-soft text-warning-ink",
};

/**
 * What the shown schedule is like. Good news is green, an early start is orange, and the badge the sort
 * ranks by is bold. `oneRow` never wraps; the row then scrolls sideways.
 */
export function ScoreChips({ chips, oneRow = false }: { chips: readonly ScheduleBadge[]; oneRow?: boolean }) {
  const id = useId();
  const leadId = `${id}-lead`;
  return (
    <div className={cx("flex items-center gap-x-6 gap-y-4", oneRow ? "w-max whitespace-nowrap" : "flex-wrap")}>
      <span aria-hidden>This schedule:</span>
      <ul aria-label="This schedule" className={cx("flex gap-4", !oneRow && "flex-wrap")}>
        {chips.map((chip, index) => {
          const noteId = chip.note ? `${id}-note-${index}` : null;
          const described = [noteId, chip.lead ? leadId : null].filter(Boolean).join(" ");
          return (
            <li
              key={chip.text}
              aria-describedby={described || undefined}
              className={cx(
                "rounded-pill px-7 py-1 text-8-5 leading-11-9 whitespace-nowrap",
                TONE[chip.tone],
                chip.lead ? "font-700 ring-1 ring-current ring-inset" : "font-570",
              )}
            >
              {chip.text}
            </li>
          );
        })}
      </ul>
      {chips.map((chip, index) => chip.note && <span key={chip.text} id={`${id}-note-${index}`} hidden>{chip.note}</span>)}
      <span id={leadId} hidden>What this sort ranks by</span>
    </div>
  );
}
