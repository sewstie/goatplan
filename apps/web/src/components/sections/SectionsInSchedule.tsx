import type { Course, Section } from "@/lib/data/types";
import { useRef, useState } from "react";
import { usePlanner } from "@/lib/store";
import { SectionChoiceCard } from "./SectionChoiceCard";
import { LabSectionStep } from "./LabSectionStep";
import { LectureSectionStep } from "./LectureSectionStep";
import type { LabChoices, LectureChoices } from "./sectionSteps";

export function SectionsInSchedule({ course, sections, locked, waitlist, onUnlocked, labs = [], lectures = null, busy = false }: {
  course: Course;
  sections: Section[];
  locked: readonly string[];
  waitlist: boolean;
  onUnlocked?: () => void;
  labs?: LabChoices[];
  lectures?: LectureChoices | null;
  busy?: boolean;
}) {
  const pendingFocus = useRef<string | null>(null);
  const settled = usePlanner((state) => state.solveStatus === "done");
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [chosenLecture, setChosenLecture] = useState<Section | null>(null);
  const lockSection = usePlanner((state) => state.lockSection);
  const unlockSection = usePlanner((state) => state.unlockSection);
  const response = usePlanner((state) => state.response);
  const focusDisclosure = (kind: string, button: HTMLButtonElement | null) => {
    if (button && pendingFocus.current === kind) {
      pendingFocus.current = null;
      button.focus();
    }
  };
  const chooseLecture = (lecture: Section) => {
    const next = labs[0]?.current.type ?? null;
    pendingFocus.current = next ?? lecture.id;
    setOpenSection(next);
    setChosenLecture(lecture);
    course.sections.filter((item) => item.type === "lecture" && locked.includes(item.id)).forEach((item) => unlockSection(course.code, item.id));
    lockSection(course.code, lecture.id);
  };
  if (sections.length === 0) return null;

  return (
    <section aria-labelledby="sections-in-schedule" className="mt-11 flex flex-col gap-4">
      <h3 id="sections-in-schedule" className="text-10 leading-14-5 font-650 text-ink">{waitlist ? "Your choices" : "Sections in this schedule"}</h3>
      {sections.map((section, index) => {
        const card = <SectionChoiceCard course={course} section={section} locked={locked.includes(section.id)} onlyLecture={section.type === "lecture" && lectures?.label === "Only lecture"} readOnly={busy} onLock={section.type === "lecture" ? () => chooseLecture(section) : undefined} onUnlocked={() => {
          if (section.type === "lecture") {
            pendingFocus.current = "lecture";
            setOpenSection("lecture");
            setChosenLecture(null);
          } else onUnlocked?.();
        }} lockButtonRef={(button) => {
          if (button && settled && locked.includes(section.id) && pendingFocus.current === section.id) {
            pendingFocus.current = null;
            button.focus();
          }
        }} />;
        if (section.type === "lecture" && lectures) return (
          <LectureSectionStep key={index} choices={lectures} open={openSection === "lecture"} busy={busy}
            onOpenChange={(open) => setOpenSection(open ? "lecture" : null)} buttonRef={(button) => focusDisclosure("lecture", button)}
            onChoose={chooseLecture}>{card}</LectureSectionStep>
        );
        const choices = labs.find(({ current }) => current.id === section.id);
        return choices ? (
          <LabSectionStep key={index} courseCode={course.code} choices={choices} busy={busy} open={openSection === section.type} buttonRef={(button) => focusDisclosure(section.type, button)} onOpenChange={(open) => setOpenSection(open ? section.type : null)} onChoosing={(id) => { pendingFocus.current = id; }}>
            {card}
          </LabSectionStep>
        ) : <div key={index}>{card}</div>;
      })}
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {settled && response?.ok && chosenLecture && locked.includes(chosenLecture.id) ? `Lecture ${chosenLecture.code} locked · ${response.total} ${response.total === 1 ? "schedule fits" : "schedules fit"}` : ""}
      </p>
    </section>
  );
}
