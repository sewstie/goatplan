"use client";

import { useEffect, useRef } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { usePlanner } from "@/lib/store";
import { useAlternativeSheet } from "./alternativeSheet";
import { SectionChooser } from "./SectionChooser";
import { useSectionChoices } from "./useSectionChoices";

/**
 * "Choose a lab": the course's other labs (or sections) that fit around the rest of the schedule,
 * same-time ones included. Opened from "View other … choices" in the details panel.
 */
export function ChooseAlternativeSheet() {
  const code = useAlternativeSheet((state) => state.course);
  const close = useAlternativeSheet((state) => state.close);
  const course = usePlanner((state) => (code ? state.term?.courses.find((item) => item.code === code) : undefined));
  const choices = useSectionChoices(course);
  const open = choices !== null;
  const introRef = useRef<HTMLParagraphElement>(null);

  // The sheet would focus its close button, which Safari outlines; start at the explanation instead.
  // This runs after the sheet's own effect has opened it.
  useEffect(() => {
    if (open) introRef.current?.focus();
  }, [open]);

  return (
    <Sheet open={open} onClose={close} title={choices ? `Choose a ${choices.kind}` : ""}>
      {course && choices && (
        <SectionChooser
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
