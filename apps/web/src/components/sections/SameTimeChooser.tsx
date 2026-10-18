"use client";

import { useId, useState, type Ref } from "react";
import { Check } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import type { Course } from "@/lib/data/types";
import { usePlanner } from "@/lib/store";
import { SameTimeChoiceRow } from "./SameTimeChoiceRow";
import type { SameTimeChoices } from "./sameTimeChoices";

type SameTimeChooserProps = {
  course: Course;
  choices: SameTimeChoices;
  onPicked: () => void;
  /** The explanation at the top, which takes focus when the sheet opens. */
  introRef?: Ref<HTMLParagraphElement>;
};

/** The inside of ChooseAlternativeSheet: the other same-time sections and a Pick button. */
export function SameTimeChooser({ course, choices, onPicked, introRef }: SameTimeChooserProps) {
  const chooseAlternative = usePlanner((state) => state.chooseAlternative);
  // As in div.app-16, nothing is checked at first and the button suggests the one with the most open seats.
  const [selected, setSelected] = useState<string | null>(null);
  const name = useId();
  const pick = choices.others.find((choice) => choice.label === selected) ?? choices.suggested;

  return (
    <div className="flex flex-col">
      <p className="text-11 leading-17-6 font-510 text-ink">{course.title}</p>
      {/* Focused by script only, to start reading here; it isn't in the Tab order, so it needs no ring. */}
      <p ref={introRef} tabIndex={-1} className="mt-8 text-10 leading-17-5 text-ink-muted outline-none">
        These meet at the same time as your {choices.kind} {choices.current.label} (
        <span className="whitespace-nowrap">{choices.times.join(", ")}</span>), so your calendar stays the same.
      </p>
      <fieldset className="mt-12 flex flex-col gap-4">
        <legend className="mb-5 text-10 leading-14-5 font-650 text-ink">Other {choices.kind} choices</legend>
        {choices.others.map((choice) => (
          <SameTimeChoiceRow
            key={choice.label}
            name={name}
            choice={choice}
            checked={choice.label === selected}
            onSelect={() => setSelected(choice.label)}
          />
        ))}
      </fieldset>
      <Button
        fullWidth
        icon={<Check aria-hidden />}
        className="mt-12 enabled:hover:border-transparent"
        onClick={() => {
          chooseAlternative(course.code, pick.sectionIds);
          onPicked();
        }}
      >
        Pick {pick.label}
      </Button>
    </div>
  );
}
