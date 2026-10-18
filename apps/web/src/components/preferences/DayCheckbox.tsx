import { DAY_NAMES } from "@/lib/data";
import type { Day } from "@/lib/data/types";

type DayCheckboxProps = {
  day: Day;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/** A day pill in the "Block a time" form. */
export function DayCheckbox({ day, checked, onChange }: DayCheckboxProps) {
  return (
    <label className="relative inline-flex cursor-pointer">
      <input
        type="checkbox"
        aria-label={DAY_NAMES[day]}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="min-w-38 rounded-pill border border-line bg-surface px-9 py-6 text-center text-9 leading-13 text-ink transition-colors peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:font-650 peer-checked:text-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus hover:bg-surface-selected peer-checked:hover:bg-accent-soft"
      >
        {day}
      </span>
    </label>
  );
}
