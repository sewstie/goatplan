import type { Course, Section } from "@/lib/data/types";
import { SectionChoiceCard } from "./SectionChoiceCard";

export function SectionsInSchedule({ course, sections, locked, waitlist, onUnlocked }: {
  course: Course;
  sections: Section[];
  locked: readonly string[];
  waitlist: boolean;
  onUnlocked?: () => void;
}) {
  if (sections.length === 0) return null;

  return (
    <section aria-labelledby="sections-in-schedule" className="mt-11 flex flex-col gap-4">
      <h3 id="sections-in-schedule" className="text-10 leading-14-5 font-650 text-ink">{waitlist ? "Your choices" : "Sections in this schedule"}</h3>
      {sections.map((section, index) => (
        <SectionChoiceCard key={index} course={course} section={section} locked={locked.includes(section.id)} onUnlocked={onUnlocked} />
      ))}
    </section>
  );
}
