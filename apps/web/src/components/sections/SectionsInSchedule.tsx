import type { Course, Section } from "@/lib/data/types";
import { useRef, useState } from "react";
import { usePlanner } from "@/lib/store";
import { cx } from "@/components/ui/cx";
import { SectionChoiceCard } from "./SectionChoiceCard";
import { LabSectionStep } from "./LabSectionStep";
import type { LabChoices } from "./sectionSteps";

export function SectionsInSchedule({ course, sections, locked, waitlist, onUnlocked, labs = [] }: {
  course: Course;
  sections: Section[];
  locked: readonly string[];
  waitlist: boolean;
  onUnlocked?: () => void;
  labs?: LabChoices[];
}) {
  const pendingFocus = useRef<string | null>(null);
  const settled = usePlanner((state) => state.solveStatus === "done");
  const [openSection, setOpenSection] = useState<string | null>(null);
  const dense = labs.some(({ current }) => current.id === openSection);
  if (sections.length === 0) return null;

  return (
    <section aria-labelledby="sections-in-schedule" className={cx("flex flex-col gap-4", dense ? "mt-7" : "mt-11")}>
      <h3 id="sections-in-schedule" className="text-10 leading-14-5 font-650 text-ink">{waitlist ? "Your choices" : "Sections in this schedule"}</h3>
      {sections.map((section, index) => {
        const card = <SectionChoiceCard course={course} section={section} locked={locked.includes(section.id)} onUnlocked={onUnlocked} dense={dense} lockButtonRef={(button) => {
          if (button && settled && locked.includes(section.id) && pendingFocus.current === section.id) {
            pendingFocus.current = null;
            button.focus();
          }
        }} />;
        const choices = labs.find(({ current }) => current.id === section.id);
        return choices ? (
          <LabSectionStep key={index} courseCode={course.code} choices={choices} open={openSection === section.id} onOpenChange={(open) => setOpenSection(open ? section.id : null)} onChoosing={(id) => { pendingFocus.current = id; }}>
            {card}
          </LabSectionStep>
        ) : <div key={index}>{card}</div>;
      })}
    </section>
  );
}
