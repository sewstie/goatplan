import type { CSSProperties } from "react";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { Tooltip } from "@/components/ui/Tooltip";
import { cx } from "@/components/ui/cx";
import { DAY_NAMES } from "@/lib/data/days";
import { formatTimeRange } from "@/lib/data/time";
import type { Day } from "@/lib/data/types";
import { blockedLabel, blockedLine, clockRange, coveredTextMask, type BlockLayout } from "./blockLayout";
import { BLOCKED_TIME_POPOVER_ID } from "./useBlockedTimeMenu";

type BlockedTimeBlockProps = {
  day: Day;
  start: number;
  end: number;
  /** The name the student gave it, like "Work". */
  label?: string;
  /** How much text fits at its height (blockLayout). */
  layout: BlockLayout;
  style: CSSProperties;
  /** The classes drawn on top of it. Its text hides where they cover it. */
  coveredBy?: readonly { start: number; end: number }[];
  /** Drawing mode: a drag that starts here removes time, so the pointer says so. */
  erasable?: boolean;
  /** Opens its popover. Left out in a saved plan and in drawing mode. */
  onOpen?: (anchor: HTMLElement) => void;
  /** Its popover is open. */
  expanded?: boolean;
  /** Picked with ⌘-click (Ctrl-click on Windows) to delete together with others. */
  selected?: boolean;
  /** ⌘-click, Ctrl-click or Ctrl/⌘+Enter adds it to the selection or takes it out. */
  onToggleSelected?: () => void;
};

/**
 * A time range as written, or from the tablet breakpoint up without AM and PM when it's long and the block is
 * narrow, so it never loses its end time.
 */
function FittedRange({ text, start, end }: { text: string; start: number; end: number }) {
  if (text.length <= 11) return text;
  return (
    <>
      <span className="tablet:hidden tablet:@block-blocked-time:inline">{text}</span>
      <span className="hidden tablet:inline tablet:@block-blocked-time:hidden">{clockRange(start, end)}</span>
    </>
  );
}

/** ⌘ on a Mac, Ctrl elsewhere. A Mac's Ctrl-click is a right click, so it never gets here as a click. */
const withModifier = (event: { metaKey: boolean; ctrlKey: boolean }) => event.metaKey || event.ctrlKey;

/**
 * A time the student blocked, hatched like the early band (div.app-3.md): its name and time, or just
 * its time written short ("2 PM–4 PM") so it fits a narrow column, then "blocked". A short block has
 * one line ("Work · 12–12:30") or no text, and a tooltip with the rest.
 */
export function BlockedTimeBlock({ day, start, end, label, layout, style, coveredBy = [], erasable, onOpen, expanded = false, selected = false, onToggleSelected }: BlockedTimeBlockProps) {
  const phone = usePhoneViewport();
  const small = "truncate text-8 leading-12";
  const range = formatTimeRange(start, end, "short");
  const shortRange = <FittedRange text={range} start={start} end={end} />;
  // In a narrow column a long name gets an ellipsis and a long range drops AM and PM.
  const mayBeCut = !phone && ((label?.length ?? 0) > 10 || range.length > 11);
  const className = cx(
    "absolute overflow-hidden rounded-block border border-line-disabled bg-hatch text-left text-ink-hatch motion-safe:transition-[top,height] motion-safe:duration-180",
    erasable && "cursor-erase",
    onOpen && "cursor-pointer hover:border-line-strong",
    selected && "border-accent ring-2 ring-accent ring-inset",
  );
  const mask = coveredTextMask(start, end, coveredBy);
  const text =
    layout === "full" ? (
      <>
        <span className="block truncate text-9 leading-13 font-600">{label ?? shortRange}</span>
        {label && <span className={cx(small, "mt-4 block tablet:hidden")}>{formatTimeRange(start, end)}</span>}
        {label && <span className={cx(small, "mt-4 hidden tablet:block")}>{shortRange}</span>}
        <span className={cx(small, "block")}>blocked</span>
      </>
    ) : (
      layout === "line" && <span className="min-w-0 truncate text-9 leading-13 font-600 tablet:leading-12">{label ? <>{label}<span className="tablet:hidden tablet:@block-time:inline"> · {clockRange(start, end)}</span></> : <FittedRange text={blockedLine(start, end)} start={start} end={end} />}</span>
    );
  const content = text && (
    <span
      data-blocked-text
      className={cx(
        "@container absolute inset-0",
        layout === "full" ? "flex flex-col justify-start px-7 pt-12.5 *:shrink-0 tablet:px-3 tablet:pt-6" : "flex items-center justify-center px-4 text-center",
      )}
      style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
    >
      {text}
    </span>
  );
  const shared = {
    "aria-label": `${blockedLabel(day, start, end, label)}${selected ? ", selected" : ""}`,
    "data-blocked-time": `${day}-${start}-${end}`,
    "data-selected": selected || undefined,
    className,
    style,
  };

  return (
    <Tooltip
      portal
      describes={false}
      disabled={(layout === "full" && !mayBeCut) || erasable || expanded}
      content={
        <>
          {label && <span className="block font-650">{label}</span>}
          <span className="block">{DAY_NAMES[day]} {formatTimeRange(start, end, "shared")}</span>
          <span className="block text-ink-muted">blocked</span>
        </>
      }
    >
      {onOpen ? (
        <button
          type="button"
          {...shared}
          aria-haspopup="dialog"
          aria-expanded={expanded}
          aria-controls={expanded ? BLOCKED_TIME_POPOVER_ID : undefined}
          onClick={(event) => {
            if (onToggleSelected && withModifier(event)) onToggleSelected();
            else onOpen(event.currentTarget);
          }}
          onKeyDown={(event) => {
            if ((event.key !== "Enter" && event.key !== " ") || !onToggleSelected || !withModifier(event)) return;
            event.preventDefault();
            onToggleSelected();
          }}
        >
          {content}
        </button>
      ) : (
        <div
          role="img"
          {...shared}
          onClick={(event) => {
            if (onToggleSelected && withModifier(event)) onToggleSelected();
          }}
        >
          {content}
        </div>
      )}
    </Tooltip>
  );
}
