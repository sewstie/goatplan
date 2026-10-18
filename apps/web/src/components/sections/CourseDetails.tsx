"use client";

import { useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { uniqueInstructors } from "@/lib/data";
import type { Course } from "@/lib/data/types";
import { selectChosenSections, selectCurrentSchedule, usePlanner } from "@/lib/store";
import { OtherChoicesButton } from "./OtherChoicesButton";
import { ProfessorPicker } from "./ProfessorPicker";
import { sameTimeChoices } from "./sameTimeChoices";
import { SectionChoiceCard } from "./SectionChoiceCard";
import { hasSetTime, sectionsById } from "./sectionDetails";

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
  // Only a real answer can say nothing fits: an engine error or a crashed worker says nothing about the plan.
  const answered = usePlanner((state) => state.solveStatus === "done" && state.response?.ok === true);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // With no schedule for this course, locked sections stay visible so they can be unlocked.
  const sections = sectionsById(course, chosen.length > 0 ? chosen : locked);
  const choices = useMemo(() => sameTimeChoices(course, alternatives, chosen), [course, alternatives, chosen]);
  const instructors = useMemo(() => uniqueInstructors(course.sections), [course]);
  const shownInstructors = uniqueInstructors(sections);
  // Cards shown only because they're locked disappear on Unlock, so focus goes to the heading.
  const focusHeading = chosen.length === 0 ? () => headingRef.current?.focus() : undefined;
  const untimed = sections.some((section) => !hasSetTime(section));

  return (
    <div className="flex flex-col gap-4">
      <h2 ref={headingRef} tabIndex={-1} className="text-21 leading-25-2 font-700 tracking-heading text-ink">
        {code}
      </h2>
      <p className="text-11 leading-17-6 font-510 text-ink">{course.title}</p>

      {chosen.length === 0 && answered && (
        <p className="pt-7 text-10 leading-17-5 text-ink-muted">No schedule fits with this course right now.</p>
      )}

      {sections.length > 0 && (
        <>
          <h3 className="mt-12 text-10 leading-14-5 font-650 text-ink">Your choices</h3>
          {sections.map((section, index) => (
            // Keyed by position: when the engine swaps the lab, focus stays on the same Lock / Unlock button.
            <SectionChoiceCard
              key={index}
              course={course}
              section={section}
              locked={locked.includes(section.id)}
              onUnlocked={focusHeading}
            />
          ))}
        </>
      )}

      {choices && <OtherChoicesButton courseCode={code} kind={choices.kind} />}

      {untimed && (
        <p className="pt-7 text-10 leading-17-5 text-ink-muted">
          This section appears in the No set time strip. It does not block calendar time.
        </p>
      )}

      {/* div.app-13 shows only the strip note for an untimed section without an instructor. */}
      {sections.length > 0 && shownInstructors.length === 0 && !untimed && (
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
