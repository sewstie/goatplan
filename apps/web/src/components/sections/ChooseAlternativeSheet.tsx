"use client";

import { useEffect, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { Sheet } from "@/components/ui/Sheet";
import { selectChosenSections, selectCurrentSchedule, usePlanner } from "@/lib/store";
import { useAlternativeSheet } from "./alternativeSheet";
import { sameTimeChoices } from "./sameTimeChoices";
import { SameTimeChooser } from "./SameTimeChooser";

const NONE: string[] = [];
const NO_ALTERNATIVES: string[][] = [];

/** Picks another section that meets at the same time. Opened from "View other … choices" in the details panel. */
export function ChooseAlternativeSheet() {
  const code = useAlternativeSheet((state) => state.course);
  const close = useAlternativeSheet((state) => state.close);
  const course = usePlanner((state) => (code ? state.term?.courses.find((item) => item.code === code) : undefined));
  const chosen = usePlanner(useShallow((state) => (code ? selectChosenSections(state)[code] ?? NONE : NONE)));
  const alternatives = usePlanner((state) =>
    code
      ? selectCurrentSchedule(state)?.courses.find((item) => item.code === code)?.alternatives ?? NO_ALTERNATIVES
      : NO_ALTERNATIVES,
  );
  const choices = useMemo(
    () => (course ? sameTimeChoices(course, alternatives, chosen) : null),
    [course, alternatives, chosen],
  );
  const open = choices !== null;
  const introRef = useRef<HTMLParagraphElement>(null);

  // The sheet would focus its close button, which Safari outlines; start at the explanation instead.
  // This runs after the sheet's own effect has opened it.
  useEffect(() => {
    if (open) introRef.current?.focus();
  }, [open]);

  return (
    <Sheet open={open} onClose={close} title={course?.code ?? ""}>
      {course && choices && (
        <SameTimeChooser
          key={`${course.code}:${choices.current.label}`}
          course={course}
          choices={choices}
          onPicked={close}
          introRef={introRef}
        />
      )}
    </Sheet>
  );
}
