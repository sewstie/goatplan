import { Badge } from "@/components/ui/Badge";
import type { Ref } from "react";
import type { Course, Section } from "@/lib/data/types";
import { LectureCard } from "./LectureCard";
import { RegularSectionCard } from "./RegularSectionCard";
import { CompatibleBadge } from "./CompatibleBadge";
import { CompactSectionCard } from "./CompactSectionCard";
import { LockButton } from "./LockButton";
import {
  hasSetTime,
  isOnlyChoice,
  sectionHeading,
  typeWord,
} from "./sectionDetails";

type SectionChoiceCardProps = {
  course: Pick<Course, "code" | "sections" | "options">;
  section: Section;
  locked: boolean;
  onLock?: () => void;
  onUnlocked?: () => void;
  problem?: boolean;
  readOnly?: boolean;
  lockButtonRef?: Ref<HTMLButtonElement>;
  dense?: boolean;
  onlyLecture?: boolean;
};

/** One chosen section: its heading, Lock / Unlock (or why it can't be locked) and its facts. */
export function SectionChoiceCard({ course, section, locked, onLock, onUnlocked, problem = false, readOnly = false, lockButtonRef, dense = false, onlyLecture = false }: SectionChoiceCardProps) {
  const heading = sectionHeading(section);
  const compact = section.type === "lab" || section.type === "discussion";
  const compatible = compact && course.sections.some((item) => item.type === "lab") && course.sections.some((item) => item.type === "discussion");

  let control;
  if (section.status === "waitlist" && !locked) {
    control = <Badge tone="warning">Waitlist only</Badge>;
  } else if (readOnly && locked) {
    control = <Badge tone="accent">Locked</Badge>;
  } else if (!locked && compatible) {
    control = <CompatibleBadge />;
  } else if (readOnly) {
    control = isOnlyChoice(course, section.id) ? <Badge size="sm">Only {typeWord(section.type)}</Badge> : null;
  } else if (locked || (!onlyLecture && hasSetTime(section) && !isOnlyChoice(course, section.id))) {
    control = (
      <LockButton
        buttonRef={lockButtonRef}
        courseCode={course.code}
        sectionId={section.id}
        sectionName={heading}
        locked={locked}
        onLock={onLock}
        onUnlocked={onUnlocked}
      />
    );
  } else {
    control = <Badge size="sm">{hasSetTime(section) ? `Only ${typeWord(section.type)}` : "No set time"}</Badge>;
  }

  if (compact) return dense ? <RegularSectionCard section={section} control={control} problem={problem} dense /> : <CompactSectionCard section={section} control={control} problem={problem} />;

  if (section.type === "lecture") return <LectureCard section={section} control={control} problem={problem} dense={dense} />;
  return <RegularSectionCard section={section} control={control} problem={problem} />;
}
