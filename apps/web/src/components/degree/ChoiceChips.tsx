"use client";

import { useRef, type KeyboardEvent } from "react";
import { cx } from "@/components/ui/cx";

type Choice<T extends string> = { value: T; label: string };

type ChoiceChipsProps<T extends string> = {
  label: string;
  options: readonly Choice<T>[];
  value: T;
  onChange(value: T): void;
  className?: string;
};

export function ChoiceChips<T extends string>({ label, options, value, onChange, className }: ChoiceChipsProps<T>) {
  const group = useRef<HTMLDivElement>(null);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const radios = [...(group.current?.querySelectorAll<HTMLButtonElement>("[role=radio]") ?? [])];
    const chosen = options.findIndex((option) => option.value === value);
    const from = chosen === -1 ? radios.findIndex((radio) => radio === document.activeElement) : chosen;
    const index = from === -1 ? 0 : (from + step + options.length) % options.length;
    onChange(options[index].value);
    radios[index]?.focus();
  }

  return (
    <div className={cx("flex flex-col", className)}>
      <span className="pb-5 text-10 leading-14-5 font-650 text-ink">{label}</span>
      <div ref={group} role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className="flex flex-wrap gap-6">
        {options.map((option, index) => {
          const checked = option.value === value;
          const reachable = checked || (index === 0 && !options.some((item) => item.value === value));
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={reachable ? 0 : -1}
              onClick={() => onChange(option.value)}
              className={cx(
                "min-h-32 min-w-44 cursor-pointer rounded-pill border px-12 text-9 leading-13 transition-colors motion-reduce:transition-none",
                checked ? "border-accent bg-accent-soft font-650 text-accent" : "border-line-button bg-surface font-510 text-ink-soft hover:bg-surface-selected hover:text-ink",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
