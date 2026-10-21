"use client";

import { useId, useRef, type ReactNode } from "react";
import type { LabChoices } from "./sectionSteps";
import { LabChoiceList } from "./LabChoiceList";
import { SectionStepDisclosure } from "./SectionStepDisclosure";
import { usePlanner } from "@/lib/store";
import type { Section } from "@/lib/data/types";

export function LabSectionStep({ courseCode, choices, children, onChoosing, open, onOpenChange }: {
  courseCode: string;
  choices: LabChoices;
  children: ReactNode;
  onChoosing: (id: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const lockSection = usePlanner((state) => state.lockSection);
  const unlockSection = usePlanner((state) => state.unlockSection);
  const disclosure = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const kind = choices.current.type;
  const choose = (section: Section) => {
    onChoosing(section.id);
    onOpenChange(false);
    unlockSection(courseCode, choices.current.id);
    lockSection(courseCode, section.id);
  };

  return (
    <div onKeyDown={(event) => {
      if (event.key !== "Escape" || !open) return;
      event.stopPropagation();
      onOpenChange(false);
      disclosure.current?.focus();
    }}>
      {children}
      {choices.choices.length > 0 && <>
        <SectionStepDisclosure kind={kind} open={open} listId={listId} onToggle={() => onOpenChange(!open)} buttonRef={disclosure} />
        {open && <LabChoiceList id={listId} courseCode={courseCode} kind={kind} choices={choices.choices} onChoose={choose} />}
      </>}
    </div>
  );
}
