import type { ComponentProps } from "react";
import { cx } from "./cx";

export type BadgeTone = "success" | "warning" | "neutral" | "accent";
export type BadgeSize = "sm" | "md" | "lg";

type BadgeProps = ComponentProps<"span"> & {
  tone?: BadgeTone;
  size?: BadgeSize;
};

const toneClasses: Record<BadgeTone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  neutral: "bg-neutral-soft text-neutral-ink",
  accent: "bg-accent-soft text-accent",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-6 pt-2 pb-3 text-8 leading-11-2",
  md: "px-6 py-3 text-8-5 leading-11-9",
  lg: "px-6 py-3 text-9 leading-12-6",
};

export function Badge({ tone = "neutral", size = "md", className, ...rest }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-badge font-570 whitespace-nowrap",
        toneClasses[tone],
        sizeClasses[size],
        className,
      )}
      {...rest}
    />
  );
}
