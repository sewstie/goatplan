import type { ComponentProps } from "react";
import { cx } from "./cx";

export type CardVariant =
  | "panel"
  | "outlined"
  | "subtle"
  | "message"
  | "issue"
  | "problem"
  | "unfit"
  | "strip";

type CardProps = ComponentProps<"div"> & {
  as?: "div" | "section" | "article" | "aside";
  variant?: CardVariant;
};

const variantClasses: Record<CardVariant, string> = {
  panel: "rounded-panel bg-surface",
  outlined: "rounded-card border border-line bg-surface",
  subtle: "rounded-card bg-surface-subtle",
  message: "rounded-message border border-line bg-surface-overlay",
  issue: "rounded-card border border-issue-line bg-issue-surface",
  problem: "rounded-card border border-problem-line bg-problem-surface",
  unfit: "rounded-card border border-unfit-line bg-unfit-surface",
  strip: "rounded-card border border-line-soft bg-surface",
};

export function Card({ as: Element = "div", variant = "outlined", className, ...rest }: CardProps) {
  return <Element className={cx(variantClasses[variant], className)} {...rest} />;
}
