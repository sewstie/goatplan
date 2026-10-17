import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

type IconButtonProps = Omit<ComponentProps<"button">, "children"> & {
  label: string;
  icon: ReactNode;
  variant?: "outline" | "ghost";
};

const variantClasses = {
  outline:
    "h-29 w-27 rounded-row border border-line-control bg-surface text-ink enabled:hover:bg-surface-selected [&_svg]:size-12",
  ghost:
    "relative rounded-badge text-current after:absolute after:-inset-7 enabled:hover:text-ink [&_svg]:size-10",
};

export function IconButton({
  label,
  icon,
  variant = "outline",
  type = "button",
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cx(
        "inline-flex shrink-0 cursor-pointer items-center justify-center transition-[color,background-color,border-color] disabled:cursor-not-allowed disabled:opacity-45",
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}
