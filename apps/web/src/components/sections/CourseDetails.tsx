"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { uniqueInstructors } from "@/lib/data";
import type { Course } from "@/lib/data/types";
import { selectChosenSections, selectCurrentSchedule, usePlanner } from "@/lib/store";
import { OtherChoicesButton } from "./OtherChoicesButton";
import { ProfessorPicker } from "./ProfessorPicker";
import { sameTimeChoices } from "./sameTimeChoices";
import { SectionChoiceCard } from "./SectionChoiceCard";
import { sectionsById } from "./sectionDetails";

const NONE: string[] = [];
const NO_ALTERNATIVES: string[][] = [];

/** The details panel for one course (div.app-3.md, "course" variant). */
export function CourseDetails({ course }: { course: Course }) {
  const code = course.code;
  const chosen = usePlanner(useShallow((state) => selectChosenSections(state)[code] ?? NONE));
  const alternatives = usePlanner(
    (state) => selectCurrentSchedule(state)?.courses.find((item) => item.code === code)?.alternatives ?? NO_ALTERNATIVES,
  );
  const locked = usePlanner((state) => state.locks[code] ?? NONE);
  // Only an answer from the engine can say nothing fits; a crashed worker says nothing about the plan.
  const solved = usePlanner((state) => state.solveStatus === "done");

  // With no schedule for this course, locked sections stay visible so they can be unlocked.
  const sections = sectionsById(course, chosen.length > 0 ? chosen : locked);
  const choices = useMemo(() => sameTimeChoices(course, alternatives, chosen), [course, alternatives, chosen]);
  const instructors = useMemo(() => uniqueInstructors(course.sections), [course]);
  const shownInstructors = uniqueInstructors(sections);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-21 leading-25-2 font-700 tracking-heading text-ink">{code}</h2>
      <p className="text-11 leading-17-6 font-510 text-ink">{course.title}</p>

      {chosen.length === 0 && solved && (
        <p className="pt-7 text-10 leading-17-5 text-ink-muted">No schedule fits with this course right now.</p>
      )}

      {sections.length > 0 && (
        <>
          <h3 className="mt-12 text-10 leading-14-5 font-650 text-ink">Your choices</h3>
          {sections.map((section) => (
            <SectionChoiceCard key={section.id} course={course} section={section} locked={locked.includes(section.id)} />
          ))}
        </>
      )}

      {choices && <OtherChoicesButton courseCode={code} kind={choices.kind} />}

      {sections.length > 0 && shownInstructors.length === 0 && (
        <div className="pt-7 text-10 leading-17-5 text-ink-muted">
          <p>Instructor not assigned yet.</p>
          <p>Professor reviews appear when an instructor is available.</p>
        </div>
      )}

      {shownInstructors.length > 0 && (
        <ProfessorPicker key={`${code}:${shownInstructors[0]}`} instructors={instructors} initial={shownInstructors[0]} />
      )}
    </div>
  );
}
