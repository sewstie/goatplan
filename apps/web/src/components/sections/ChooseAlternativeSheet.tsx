"use client";

import { useEffect, useRef } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { usePlanner } from "@/lib/store";
import { useAlternativeSheet } from "./alternativeSheet";
import { SectionChooser } from "./SectionChooser";
import { useSectionChoices } from "./useSectionChoices";

export function ChooseAlternativeSheet() {
  const saved = usePlanner((state) => state.savedPlanId !== null);
  const code = useAlternativeSheet((state) => state.course);
  const close = useAlternativeSheet((state) => state.close);
  const course = usePlanner((state) => (code ? state.term?.courses.find((item) => item.code === code) : undefined));
  const choices = useSectionChoices(course);
  const selectedSection = usePlanner((state) => state.selectedSection);
  const solveStatus = usePlanner((state) => state.solveStatus);
  const open = !saved && choices !== null;
  const introRef = useRef<HTMLParagraphElement>(null);
  const returnToPicked = useRef(false);

  // The sheet would focus its close button, which Safari outlines; start at the explanation instead.
  // This runs after the sheet's own effect has opened it.
  useEffect(() => {
    if (open) introRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (open || !returnToPicked.current || !selectedSection || solveStatus !== "done") return;
    const block = [...document.querySelectorAll<HTMLButtonElement>("button[data-block]")]
      .find((button) => button.dataset.block?.startsWith(`${selectedSection}|`));
    if (block) {
      block.focus();
      returnToPicked.current = false;
    }
  }, [open, selectedSection, solveStatus]);

  return (
    <Sheet open={open} onClose={close} title={choices ? `Choose a ${choices.kind}` : ""}>
      {course && choices && (
        <SectionChooser
          key={`${course.code}:${choices.current.label}`}
          course={course}
          choices={choices}
          onPicked={() => {
            returnToPicked.current = true;
            close();
          }}
          introRef={introRef}
        />
      )}
    </Sheet>
  );
}
