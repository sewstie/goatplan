"use client";

import { useId, useState, type Ref } from "react";
import { Check } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import type { Course } from "@/lib/data/types";
import { usePlanner } from "@/lib/store";
import { ChoiceRow } from "./ChoiceRow";
import { CurrentChoiceRow } from "./CurrentChoiceRow";
import type { SectionChoices } from "./sectionChoices";

type SectionChooserProps = {
  course: Course;
  choices: SectionChoices;
  onPicked: () => void;
  /** The explanation at the top, which takes focus when the sheet opens. */
  introRef?: Ref<HTMLParagraphElement>;
};

const byLabel = (a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label, "en", { numeric: true });

/** The inside of ChooseAlternativeSheet: the current choice, the others that fit, and a Pick button. */
export function SectionChooser({ course, choices, onPicked, introRef }: SectionChooserProps) {
  const pickOption = usePlanner((state) => state.pickOption);
  // As in div.app-16, nothing is checked at first and the button suggests the one with the most open seats.
  const [selected, setSelected] = useState<string | null>(null);
  const name = useId();
  const pick = choices.others.find((choice) => choice.label === selected) ?? choices.suggested;
  const rows = [choices.current, ...choices.others].sort(byLabel);

  return (
    <div className="flex flex-col">
      <p className="text-11 leading-17-6 font-510 text-ink">
        {course.code} · {course.title}
      </p>
      {/* Focused by script only, to start reading here; it isn't in the Tab order, so it needs no ring. */}
      <p ref={introRef} tabIndex={-1} className="mt-8 text-10 leading-17-5 text-ink-muted outline-none">
        These {choices.kind}s fit around the rest of your schedule, so your other classes stay where they are.
      </p>
      <fieldset className="mt-12 flex flex-col gap-4">
        <legend className="mb-5 text-10 leading-14-5 font-650 text-ink">Other {choices.kind} choices</legend>
        {rows.map((choice) =>
          choice === choices.current ? (
            <CurrentChoiceRow key={choice.label} choice={choice} kind={choices.kind} />
          ) : (
            <ChoiceRow
              key={choice.label}
              name={name}
              choice={choice}
              checked={choice.label === selected}
              onSelect={() => setSelected(choice.label)}
            />
          ),
        )}
      </fieldset>
      <Button
        fullWidth
        icon={<Check aria-hidden />}
        className="mt-12"
        onClick={() => {
          pickOption(course.code, pick.sectionIds);
          onPicked();
        }}
      >
        Pick {pick.label}
      </Button>
    </div>
  );
}
