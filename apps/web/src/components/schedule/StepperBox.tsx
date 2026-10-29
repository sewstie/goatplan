import type { KeyboardEventHandler, ReactNode } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";

export type StepperSize = "default" | "wide" | "compact";
export type StepperArrow = { label: string; disabled: boolean; onClick: () => void; shortcut?: string };

const BOX: Record<StepperSize, string> = {
  default: "h-35",
  wide: "min-h-44 w-full min-w-0",
  compact: "h-30 shrink-0",
};

// The compact arrows look 30px but keep a 44px tall hit area.
const ARROW: Record<StepperSize, string> = {
  default: "w-31",
  wide: "w-44",
  compact: "relative w-30 after:absolute after:inset-x-0 after:-inset-y-7",
};

const DIVIDER = <span aria-hidden className="my-6 w-px shrink-0 bg-line-control" />;

/** The joined ‹ count › box for schedules and saved plans. Without arrows it's just the count, in the same box. */
export function StepperBox({
  label,
  size = "default",
  previous,
  next,
  onKeyDown,
  children,
}: {
  label?: string;
  size?: StepperSize;
  previous?: StepperArrow;
  next?: StepperArrow;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  children: ReactNode;
}) {
  return (
    <div
      role={label ? "group" : undefined}
      aria-label={label}
      className={cx("flex items-stretch rounded-row border border-line-control bg-surface", BOX[size])}
      onKeyDown={onKeyDown}
    >
      {previous && <>{arrow(previous, size, "start")}{DIVIDER}</>}
      {children}
      {next && <>{DIVIDER}{arrow(next, size, "end")}</>}
    </div>
  );
}

function arrow({ label, disabled, onClick, shortcut }: StepperArrow, size: StepperSize, side: "start" | "end") {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={disabled}
      aria-keyshortcuts={shortcut}
      onClick={() => !disabled && onClick()}
      className={cx(
        "flex shrink-0 cursor-pointer items-center justify-center text-accent not-aria-disabled:hover:bg-surface-selected focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none focus-visible:ring-inset aria-disabled:cursor-not-allowed aria-disabled:bg-surface-subtle aria-disabled:text-ink-faint/50",
        side === "start" ? "rounded-l-row" : "rounded-r-row",
        size === "compact" ? "[&_svg]:size-10" : "[&_svg]:size-12",
        ARROW[size],
      )}
    >
      {side === "start" ? <CaretLeft aria-hidden /> : <CaretRight aria-hidden />}
    </button>
  );
}
