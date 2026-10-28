import type { Ref } from "react";
import { Badge } from "@/components/ui/Badge";
import type { Course, Section } from "@/lib/data/types";
import { LockButton } from "./LockButton";
import { hasSetTime, isOnlyChoice, sectionHeading, typeWord } from "./sectionDetails";

type SectionControlProps = {
  course: Pick<Course, "code" | "sections" | "options">;
  section: Section;
  locked: boolean;
  onLock?: () => void;
  onUnlocked?: () => void;
  readOnly?: boolean;
  lockButtonRef?: Ref<HTMLButtonElement>;
  onlyLecture?: boolean;
  /** The phone card: a bigger Lock button and "Only lab" as plain text instead of a badge. */
  phone?: boolean;
};

/** The top-right of a section card: Lock / Unlock, or why the section can't be locked. */
export function SectionControl({ course, section, locked, onLock, onUnlocked, readOnly = false, lockButtonRef, onlyLecture = false, phone = false }: SectionControlProps) {
  const only = (text: string) => phone ? <span className="text-8 leading-11-6 text-ink-muted">{text}</span> : <Badge size="sm">{text}</Badge>;

  if (section.status === "waitlist" && !locked) return <Badge tone="warning">Waitlist only</Badge>;
  if (readOnly && locked) return <Badge tone="accent">Locked</Badge>;
  if (readOnly) return isOnlyChoice(course, section.id) ? only(`Only ${typeWord(section.type)}`) : null;
  if (locked || (!onlyLecture && hasSetTime(section) && !isOnlyChoice(course, section.id))) {
    return (
      <LockButton
        buttonRef={lockButtonRef}
        courseCode={course.code}
        sectionId={section.id}
        sectionName={sectionHeading(section)}
        locked={locked}
        onLock={onLock}
        onUnlocked={onUnlocked}
        size={phone ? "sm" : "xs"}
      />
    );
  }
  return only(hasSetTime(section) ? `Only ${typeWord(section.type)}` : "No set time");
}
