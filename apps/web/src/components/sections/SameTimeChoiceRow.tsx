import { CheckCircle, Circle } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import type { SameTimeChoice } from "./sameTimeChoices";

type SameTimeChoiceRowProps = {
  /** The radio group's name. */
  name: string;
  choice: SameTimeChoice;
  checked: boolean;
  onSelect: () => void;
};

/** A radio row in the style of the design's alternative rows (div.app-16.md, div.app-20.md). */
export function SameTimeChoiceRow({ name, choice, checked, onSelect }: SameTimeChoiceRowProps) {
  return (
    <label
      className={cx(
        "flex cursor-pointer items-center gap-7 rounded-row border px-7 pt-11 pb-8 transition-[background-color,border-color,box-shadow] has-[:focus-visible]:border-choice-line has-[:focus-visible]:shadow-field-focus",
        checked ? "border-choice-line bg-choice-surface" : "border-line hover:bg-surface-selected",
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="sr-only" />
      {checked ? (
        <CheckCircle aria-hidden className="size-13 shrink-0 text-ink" />
      ) : (
        <Circle aria-hidden className="size-13 shrink-0 text-ink" />
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-10 leading-14-5 font-700 text-ink">{choice.label}</span>
        {choice.detail && <span className="text-8 leading-11-6 text-ink-muted">{choice.detail}</span>}
      </span>
      <span className="shrink-0 text-8 leading-11-6 text-ink-muted">
        {choice.openSeats > 0 ? `${choice.openSeats} open` : "Full"}
      </span>
    </label>
  );
}
