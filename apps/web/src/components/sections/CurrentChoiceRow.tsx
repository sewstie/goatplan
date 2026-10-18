import { CheckCircle } from "@phosphor-icons/react/ssr";
import { choiceDetail, choiceSeats, type SectionChoice } from "./sectionChoices";

/** The section the schedule has now, marked like the design's current alternative row (div.app-20.md). */
export function CurrentChoiceRow({ choice, kind }: { choice: SectionChoice; kind: string }) {
  return (
    <div className="flex items-center gap-7 rounded-row border border-choice-line bg-choice-surface px-7 pt-11 pb-8">
      <CheckCircle aria-hidden className="size-13 shrink-0 text-ink" />
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-10 leading-14-5 font-700 text-ink">
          {choice.label}
          <span className="sr-only">, your {kind} now</span>
        </span>
        <span className="text-8 leading-11-6 text-ink-muted">{choiceDetail(choice)}</span>
      </span>
      <span className="shrink-0 text-8 leading-11-6 text-ink-muted">{choiceSeats(choice)}</span>
    </div>
  );
}
