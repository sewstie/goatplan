import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "secondary" | "warning" | "soft";
export type ButtonSize = "lg" | "md" | "sm" | "xs";

export type ButtonStyle = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

type ButtonProps = ComponentProps<"button"> &
  ButtonStyle & {
    icon?: ReactNode;
  };

// Hover only where the button can be pressed. aria-disabled keeps its colors and focus but loses the
// hover, for buttons like "Saved" that stay in the Tab order with nothing to do. The primary fill gets
// lighter on hover, so its border goes transparent to keep the edge from looking darker.
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-accent bg-accent text-on-accent not-disabled:not-aria-disabled:hover:border-transparent not-disabled:not-aria-disabled:hover:bg-accent/90 disabled:border-button-disabled disabled:bg-button-disabled disabled:text-button-disabled-ink disabled:[&_svg]:opacity-45",
  secondary: "border-line-button bg-surface text-ink not-disabled:not-aria-disabled:hover:bg-surface-selected",
  warning: "border-warning-line bg-surface text-ink not-disabled:not-aria-disabled:hover:bg-issue-surface",
  soft: "border-transparent bg-accent-soft text-accent not-disabled:not-aria-disabled:hover:bg-accent-line",
};

const sizeClasses: Record<ButtonSize, string> = {
  lg: "min-h-36 gap-6 rounded-control px-11 py-9 text-11 leading-13-2 [&_svg]:size-16",
  md: "min-h-36 gap-6 rounded-control px-11 py-9 text-10 leading-12 [&_svg]:size-16",
  sm: "min-h-32 gap-6 rounded-control px-9 py-7 text-10 leading-12 [&_svg]:size-16",
  xs: "min-h-21 gap-4 rounded-badge px-6 py-4 text-9 leading-10-8 [&_svg]:size-11",
};

/** The look of a button, for links that look like one (ButtonLink). */
export function buttonClasses({ variant = "primary", size = "lg", fullWidth = false }: ButtonStyle = {}): string {
  return cx(
    "inline-flex shrink-0 cursor-pointer items-center justify-center border font-570 whitespace-nowrap transition-[color,background-color,border-color] disabled:cursor-not-allowed aria-disabled:cursor-default [&_svg]:shrink-0",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
  );
}

export function Button({
  variant,
  size,
  icon,
  fullWidth,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={cx(buttonClasses({ variant, size, fullWidth }), className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}
