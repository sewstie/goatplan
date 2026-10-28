import type { Ref } from "react";
import type { Course, Section } from "@/lib/data/types";
import { LectureCard } from "./LectureCard";
import { RegularSectionCard } from "./RegularSectionCard";
import { CompactSectionCard } from "./CompactSectionCard";
import { SectionControl } from "./SectionControl";

type SectionChoiceCardProps = {
  course: Pick<Course, "code" | "sections" | "options">;
  section: Section;
  locked: boolean;
  onLock?: () => void;
  onUnlocked?: () => void;
  problem?: boolean;
  readOnly?: boolean;
  lockButtonRef?: Ref<HTMLButtonElement>;
  onlyLecture?: boolean;
};

/** One chosen section: its heading, Lock / Unlock (or why it can't be locked) and its facts. */
export function SectionChoiceCard({ course, section, locked, onLock, onUnlocked, problem = false, readOnly = false, lockButtonRef, onlyLecture = false }: SectionChoiceCardProps) {
  const compact = section.type === "lab" || section.type === "discussion";
  const control = (
    <SectionControl course={course} section={section} locked={locked} onLock={onLock} onUnlocked={onUnlocked}
      readOnly={readOnly} lockButtonRef={lockButtonRef} onlyLecture={onlyLecture} />
  );

  if (compact) return <CompactSectionCard section={section} control={control} problem={problem} />;

  if (section.type === "lecture") return <LectureCard section={section} control={control} problem={problem} />;
  return <RegularSectionCard section={section} control={control} problem={problem} />;
}
