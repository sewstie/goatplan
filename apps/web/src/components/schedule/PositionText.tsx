import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/components/ui/cx";
import type { StepperSize } from "./StepperBox";

const TEXT: Record<StepperSize, { line: string; number: string }> = {
  default: { line: "px-18 text-12 leading-17-4", number: "text-14" },
  wide: { line: "min-w-0 flex-1 px-12 text-12 leading-17-4", number: "text-14" },
  compact: { line: "px-10 text-9", number: "text-10" },
};

/** "Schedule 3 of 24" inside the stepper box: the current number bigger, the total lighter. */
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
      {noun} <span className={cx("font-700 tabular-nums", TEXT[size].number)}>{index.toLocaleString("en-US")}</span> of{" "}
      <span className="font-510 tabular-nums">{total.toLocaleString("en-US")}</span>
      {after}
    </p>
  );
}
