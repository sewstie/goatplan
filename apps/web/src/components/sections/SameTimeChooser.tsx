"use client";

import { useId, useState } from "react";
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
};

/** The inside of ChooseAlternativeSheet: the other same-time sections and a Pick button. */
export function SameTimeChooser({ course, choices, onPicked }: SameTimeChooserProps) {
  const chooseAlternative = usePlanner((state) => state.chooseAlternative);
  const [selected, setSelected] = useState(choices.suggested.label);
  const name = useId();
  const pick = choices.others.find((choice) => choice.label === selected) ?? choices.suggested;

  return (
    <div className="flex flex-col">
      <p className="text-11 leading-17-6 font-510 text-ink">{course.title}</p>
      <p className="mt-8 text-10 leading-17-5 text-ink-muted">
        These meet at the same time as your {choices.kind} {choices.current.label} ({choices.times.join(", ")}), so
        your calendar stays the same.
      </p>
      <fieldset className="mt-12 flex flex-col gap-4">
        <legend className="mb-5 text-10 leading-14-5 font-650 text-ink">Other {choices.kind} choices</legend>
        {choices.others.map((choice) => (
          <SameTimeChoiceRow
            key={choice.label}
            name={name}
            choice={choice}
            checked={choice.label === pick.label}
            onSelect={() => setSelected(choice.label)}
          />
        ))}
      </fieldset>
      <Button
        fullWidth
        icon={<Check aria-hidden />}
        className="mt-12"
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
