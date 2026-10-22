"use client";

import { useId, useRef, type ReactNode, type RefCallback } from "react";
import type { LabChoices } from "./sectionSteps";
import { LabChoiceList } from "./LabChoiceList";
import { SectionStepDisclosure } from "./SectionStepDisclosure";
import { usePlanner } from "@/lib/store";
import type { Section } from "@/lib/data/types";

export function LabSectionStep({ courseCode, choices, children, onChoosing, open, onOpenChange, busy = false, buttonRef }: {
  courseCode: string;
  choices: LabChoices;
  children: ReactNode;
  onChoosing: (id: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy?: boolean;
  buttonRef?: RefCallback<HTMLButtonElement>;
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
      {(choices.choices.length > 0 || open) && <>
        <SectionStepDisclosure kind={kind} open={open} listId={listId} busy={busy} onToggle={() => onOpenChange(!open)} buttonRef={(button) => { disclosure.current = button; buttonRef?.(button); }} />
        {open && !busy && <LabChoiceList id={listId} courseCode={courseCode} kind={kind} choices={choices.choices} onChoose={choose} />}
      </>}
    </div>
  );
}
