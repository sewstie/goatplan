"use client";

import { useId, type ComponentProps } from "react";
import { CaretDown } from "@phosphor-icons/react/ssr";
import { cx } from "./cx";

export type SelectVariant = "field" | "box" | "pill" | "menu";

export type SelectOption = { value: string; label: string; disabled?: boolean };

type SelectProps = Omit<ComponentProps<"select">, "children"> & {
  label: string;
  options: SelectOption[];
  variant?: SelectVariant;
};

const wrapperClasses: Record<SelectVariant, string> = {
  field: "flex min-h-40 rounded-card border border-line bg-surface",
  box: "flex min-h-35 rounded-row border border-line bg-surface",
  pill: "inline-flex min-h-32 gap-6 rounded-pill bg-surface pl-10",
  menu: "inline-flex min-w-146 gap-6 rounded-row bg-surface pl-9",
};

// Bordered fields get the same focus look as text inputs: a lavender border and a soft halo.
const fieldFocus =
  "transition-[border-color,box-shadow] has-[:focus-visible]:border-choice-line has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-accent-soft";
const ringFocus = "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus";

const focusClasses: Record<SelectVariant, string> = {
  field: fieldFocus,
  box: fieldFocus,
  pill: ringFocus,
  menu: ringFocus,
};

const labelClasses: Record<SelectVariant, string> = {
  field: "sr-only",
  box: "sr-only",
  pill: "text-9 leading-13 text-ink-muted",
  menu: "text-9 leading-13 text-ink-muted",
};

const selectClasses: Record<SelectVariant, string> = {
  field: "w-full py-10 pr-31 pl-11 text-12 leading-17-4 font-700",
  box: "w-full py-9 pr-28 pl-9 text-10 leading-14-5",
  pill: "field-sizing-content py-8.75 pr-28 text-10 leading-14-5 font-650",
  menu: "field-sizing-content py-7.5 pr-25 text-9 leading-13",
};

const caretClasses: Record<SelectVariant, string> = {
  field: "right-11 size-12",
  box: "right-9 size-11",
  pill: "right-10 size-10",
  menu: "right-9 size-10",
};

export function Select({
  label,
  options,
  variant = "field",
  id,
  className,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div
      className={cx(
        "relative items-center text-ink transition-[border-color,box-shadow] has-[:focus-visible]:border-choice-line has-[:focus-visible]:shadow-field-focus has-[:disabled]:bg-surface-disabled has-[:disabled]:text-ink-faint",
        wrapperClasses[variant],
        focusClasses[variant],
        className,
      )}
    >
      <label htmlFor={selectId} className={labelClasses[variant]}>
        {label}
      </label>
      <select
        id={selectId}
        className={cx(
          "cursor-pointer appearance-none rounded-[inherit] bg-transparent outline-none disabled:cursor-not-allowed",
          selectClasses[variant],
        )}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <CaretDown
        aria-hidden
        className={cx("pointer-events-none absolute top-1/2 -translate-y-1/2", caretClasses[variant])}
      />
    </div>
  );
}
