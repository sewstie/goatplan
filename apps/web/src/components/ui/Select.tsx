"use client";

import { useId, type ComponentProps } from "react";
import { CaretDown } from "@phosphor-icons/react/ssr";
import { cx } from "./cx";

export type SelectVariant = "field" | "box" | "pill" | "menu";

export type SelectOption = { value: string; label: string; disabled?: boolean };

type SelectProps = Omit<ComponentProps<"select">, "children"> & {
  label: string;
  /** The field and box variants hide their label unless this is false; then it sits above the box. */
  hideLabel?: boolean;
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

// Only the field and box selects take their box's corners. The pill and menu selects stay square:
// a 16px curve clipped the top and bottom of the value's first letter.
const selectClasses: Record<SelectVariant, string> = {
  field: "w-full rounded-[inherit] py-10 pr-31 pl-11 text-12 leading-17-4 font-700",
  box: "w-full rounded-[inherit] py-9 pr-28 pl-9 text-10 leading-14-5",
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
  hideLabel = true,
  options,
  variant = "field",
  id,
  className,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const labelAbove = !hideLabel && (variant === "field" || variant === "box");
  const labelElement = (
    <label
      htmlFor={selectId}
      className={labelAbove ? "pb-5 text-10 leading-14-5 font-650 text-ink" : labelClasses[variant]}
    >
      {label}
    </label>
  );

  const field = (
    <div
      className={cx(
        "relative items-center text-ink transition-[border-color,box-shadow] has-[:focus-visible]:border-choice-line has-[:focus-visible]:shadow-field-focus has-[:disabled]:bg-surface-disabled has-[:disabled]:text-ink-faint",
        wrapperClasses[variant],
        focusClasses[variant],
        className,
      )}
    >
      {!labelAbove && labelElement}
      <select
        id={selectId}
        className={cx(
          "cursor-pointer appearance-none bg-transparent outline-none disabled:cursor-not-allowed",
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

  if (!labelAbove) return field;
  return (
    <div className="flex flex-col">
      {labelElement}
      {field}
    </div>
  );
}
