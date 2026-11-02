import type { ReactNode } from "react";
import { cx } from "./cx";

type SegmentOption<T extends string> = { value: T; label: string; icon: ReactNode };

type SegmentedSwitchProps<T extends string> = {
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange(value: T): void;
};

export function SegmentedSwitch<T extends string>({ label, options, value, onChange }: SegmentedSwitchProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex items-center gap-2 rounded-control border border-card-line bg-surface p-3.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cx(
            "inline-flex min-h-32 cursor-pointer items-center gap-8 rounded-row px-12 text-8-5 leading-16 transition-colors [&_svg]:size-14",
            option.value === value ? "bg-accent-soft font-600 text-accent" : "font-450 text-ink-muted hover:text-ink",
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
