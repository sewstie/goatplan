import type { ComponentProps, ReactNode } from "react";
import { Check, X } from "@phosphor-icons/react/ssr";
import { cx } from "./cx";

type ToggleProps = Omit<ComponentProps<"button">, "onChange" | "onClick" | "children"> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
};

export function Toggle({
  checked,
  onCheckedChange,
  label,
  className,
  ...rest
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cx(
        "inline-flex cursor-pointer items-center gap-7 text-9 leading-13 text-ink disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden
        className={cx(
          "flex h-17 w-29 shrink-0 items-center rounded-toggle p-2 transition-colors",
          checked ? "bg-accent" : "bg-toggle-off",
        )}
      >
        <span
          className={cx(
            "flex size-13 items-center justify-center rounded-knob bg-surface transition-transform motion-reduce:transition-none [&_svg]:size-9",
            checked ? "translate-x-12 text-accent" : "translate-x-0 text-toggle-off",
          )}
        >
          {checked ? <Check /> : <X />}
        </span>
      </span>
      {label}
    </button>
  );
}
