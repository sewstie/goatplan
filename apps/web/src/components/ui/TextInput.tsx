"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { cx } from "./cx";

type TextInputProps = Omit<ComponentProps<"input">, "size"> & {
  label: string;
  hideLabel?: boolean;
  icon?: ReactNode;
  hint?: ReactNode;
};

export function TextInput({
  label,
  hideLabel = true,
  icon,
  hint,
  id,
  className,
  ...rest
}: TextInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;

  return (
    <div className={cx("flex flex-col", className)}>
      <label
        htmlFor={inputId}
        className={hideLabel ? "sr-only" : "pb-5 text-10 leading-14-5 font-650 text-ink"}
      >
        {label}
      </label>
      <div className="group flex min-h-38 items-center gap-8 rounded-control border border-line bg-surface px-9 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus has-[:disabled]:border-line-disabled has-[:disabled]:bg-surface-disabled">
        {icon && (
          <span
            aria-hidden
            className="flex size-14 shrink-0 items-center justify-center text-ink opacity-65 group-has-[:disabled]:opacity-38 [&_svg]:size-14"
          >
            {icon}
          </span>
        )}
        <input
          id={inputId}
          aria-describedby={hint ? hintId : undefined}
          className="min-w-0 flex-1 bg-transparent py-10.75 text-10 leading-14-5 text-ink outline-none placeholder:text-ink-muted disabled:cursor-not-allowed disabled:placeholder:text-ink-faint [&::-webkit-search-cancel-button]:hidden"
          {...rest}
        />
      </div>
      {hint && (
        <p id={hintId} className="px-2 pt-6 text-9 leading-14-4 text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
