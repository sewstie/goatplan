import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/components/ui/cx";
import type { StepperSize } from "./StepperBox";

const TEXT: Record<StepperSize, { line: string; number: string }> = {
  default: { line: "px-8 text-10 leading-17-4 wide:px-12", number: "text-10" },
  wide: { line: "@container min-w-0 flex-1 px-4 text-12 leading-17-4", number: "text-14" },
  compact: { line: "px-10 text-9", number: "text-10" },
};

const nounRoom = (digits: number) => (digits > 5 ? "@max-[10.5rem]:sr-only" : digits > 4 ? "@max-[9.5rem]:sr-only" : digits > 3 ? "@max-[8.5rem]:sr-only" : "@max-[8.25rem]:sr-only");

/**
 * "Schedule 3 of 24" inside the stepper box: the current number bigger, the total lighter. Where a phone's
 * row is too tight for the whole line, the numbers stay and the word goes to screen readers only.
 */
export function PositionText({
  noun,
  index,
  total,
  after,
  size = "default",
  className,
  ...props
}: Omit<ComponentProps<"p">, "children"> & { noun: string; index: number; total: number; after?: ReactNode; size?: StepperSize }) {
  return (
    <p
      aria-live="polite"
      aria-atomic
      {...props}
      className={cx("self-center truncate text-center font-650 whitespace-nowrap text-accent", TEXT[size].line, className)}
    >
      <span className={size === "wide" ? "block truncate" : undefined}>
        <span className={size !== "wide" ? undefined : after === undefined ? nounRoom(`${index}${total}`.length) : "@max-[11rem]:sr-only"}>{noun} </span>
        <span className={cx("font-700 tabular-nums", TEXT[size].number)}>{index.toLocaleString("en-US")}</span> of{" "}
        <span className="font-510 tabular-nums">{total.toLocaleString("en-US")}</span>
        {after}
      </span>
    </p>
  );
}
