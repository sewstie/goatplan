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
        className="peer absolute inset-0 z-1 cursor-pointer appearance-none opacity-0"
      />
      <span
        aria-hidden
        className="min-w-38 rounded-pill border border-line bg-surface px-9 py-6 text-center text-9 leading-13 text-ink transition-[color,background-color,border-color,box-shadow] peer-hover:bg-surface-selected peer-focus-visible:border-choice-line peer-focus-visible:shadow-field-focus peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:font-650 peer-checked:text-accent peer-checked:peer-hover:bg-accent-soft peer-checked:peer-focus-visible:border-accent"
      >
        {day}
      </span>
    </label>
  );
}
