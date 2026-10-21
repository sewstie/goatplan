import { Badge } from "@/components/ui/Badge";
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
  course: Course;
  section: Section;
  locked: boolean;
  onUnlocked?: () => void;
  problem?: boolean;
  readOnly?: boolean;
};

/** One chosen section: its heading, Lock / Unlock (or why it can't be locked) and its facts. */
export function SectionChoiceCard({ course, section, locked, onUnlocked, problem = false, readOnly = false }: SectionChoiceCardProps) {
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
  } else if (locked || (hasSetTime(section) && !isOnlyChoice(course, section.id))) {
    control = (
      <LockButton
        courseCode={course.code}
        sectionId={section.id}
        sectionName={heading}
        locked={locked}
        onUnlocked={onUnlocked}
      />
    );
  } else {
    control = <Badge size="sm">{hasSetTime(section) ? `Only ${typeWord(section.type)}` : "No set time"}</Badge>;
  }

  if (compact) return <CompactSectionCard section={section} control={control} problem={problem} />;

  if (section.type === "lecture") return <LectureCard section={section} control={control} problem={problem} />;
  return <RegularSectionCard section={section} control={control} problem={problem} />;
}
