"use client";

import { useId, useRef, useState } from "react";
import { ArrowSquareOut, CaretDown, EyeSlash, PushPin } from "@phosphor-icons/react/ssr";
import { CheckBox, CheckField } from "@/components/ui/CheckField";
import { TextInput } from "@/components/ui/TextInput";
import { cx } from "@/components/ui/cx";
import { parseCredits } from "@/lib/degree/history";
import type { Choice } from "@/lib/degree/recommendations/planner";
import { recordFor } from "@/lib/degree/recommendations/background";
import { unitLabel } from "@/lib/degree/units";
import { SuggestionTag } from "./SuggestionTag";
import { backgroundTag, offeringTag } from "./suggestionTags";

type RecommendationCourseProps = {
  choice: Choice;
  alternative?: boolean;
  selected?: boolean;
  kept?: boolean;
  onSelect?(checked: boolean): void;
  onKeep?(credits?: number): void;
  onExclude(): void;
  confirmations: readonly string[];
  onConfirm(note: string, confirmed: boolean): void;
};

const action = "inline-flex min-h-28 max-tablet:min-h-44 cursor-pointer items-center gap-4 rounded-row px-6 text-8-5 leading-13 font-600 text-ink-muted hover:bg-surface-selected hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-12";

export function RecommendationCourse({ choice, alternative = false, selected, kept = false, onSelect, onKeep, onExclude, confirmations, onConfirm }: RecommendationCourseProps) {
  const { course, background, offering } = choice;
  const detailsId = useId();
  const [open, setOpen] = useState(false);
  const skip = useRef<HTMLButtonElement>(null);
  const [creditText, setCreditText] = useState("");
  const chosenCredits = parseCredits(creditText);
  const needsCredits = offering.credits === null;
  const record = recordFor(course.code);
  const [backgroundWord, backgroundTone] = backgroundTag(background.state);
  const [offeringWord, offeringTone] = offeringTag(offering.state);
  const unconfirmed = background.notes.filter((note) => !confirmations.includes(note));

  return (
    <li className={cx("flex gap-10 py-12", !alternative && selected === false && "opacity-60")}>
      {!alternative && <CheckBox className="mt-2" aria-label={`Add ${course.code}`} checked={selected} onChange={(event) => onSelect?.(event.target.checked)} />}
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <p className="flex items-baseline gap-6 text-9 leading-14">
          <span className="shrink-0 font-650">{course.code}</span>
          <span className="min-w-0 flex-1 text-ink-soft">{course.title || "Course"}</span>
          <span className="shrink-0 text-8 text-ink-muted">{needsCredits ? "Units unknown" : unitLabel(course.credits)}</span>
        </p>
        <p className="text-8-5 leading-15 text-ink-muted">{choice.reason}</p>
        <div className="flex flex-wrap gap-4">
          <SuggestionTag tone={backgroundTone}>{backgroundWord}</SuggestionTag>
          <SuggestionTag tone={offeringTone}>{offeringWord}</SuggestionTag>
        </div>
        {unconfirmed.map((note) => <CheckField key={note} className="pt-4" labelClassName="text-8-5 leading-15 text-ink" label={`I have this experience: ${note}`} checked={false} onChange={() => { skip.current?.focus(); onConfirm(note, true); }} />)}
        {alternative && needsCredits && !kept && <TextInput label={`Credits for ${course.code}`} hideLabel={false} type="number" min="0.01" max="30" step="0.01" value={creditText} onChange={(event) => setCreditText(event.target.value)} hint="WPI hasn’t listed credits for it. 3 credits is one regular course." />}
        <div className="-ml-6 flex flex-wrap items-center gap-2">
          {alternative && (
            <button type="button" className={cx(action, kept && "text-accent")} aria-label={`Keep ${course.code}`} aria-pressed={kept} disabled={needsCredits && !kept && (chosenCredits === null || chosenCredits <= 0)} onClick={() => onKeep?.(needsCredits ? chosenCredits ?? undefined : undefined)}>
              <PushPin aria-hidden weight={kept ? "fill" : "regular"} />{kept ? "Kept" : "Keep"}
            </button>
          )}
          <button ref={skip} type="button" className={action} aria-label={`Skip ${course.code}`} onClick={onExclude}><EyeSlash aria-hidden />Skip</button>
          <button type="button" className={action} aria-label={`Details for ${course.code}`} aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen((value) => !value)}>
            Details<CaretDown aria-hidden className={cx("transition-transform motion-reduce:transition-none", open && "rotate-180")} />
          </button>
        </div>
        {open && (
          <div id={detailsId} className="flex flex-col gap-6 rounded-row bg-canvas px-10 py-9 text-8-5 leading-15 text-ink-muted">
            <p>{background.text}</p>
            <p>{offering.text}</p>
            {record && <p className="border-l-2 border-line-strong pl-8">{record.wording}</p>}
            {record && <a className="inline-flex items-center gap-4 text-accent underline" href={record.source} target="_blank" rel="noreferrer">WPI catalog<ArrowSquareOut aria-hidden className="size-11" /></a>}
          </div>
        )}
      </div>
    </li>
  );
}
