"use client";

import { useRef } from "react";
import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { uniqueInstructors } from "@/lib/data";
import type { Course } from "@/lib/data/types";
import { usePlanner } from "@/lib/store";
import { ProfessorPicker } from "./ProfessorPicker";
import { SectionsInSchedule } from "./SectionsInSchedule";
import { hasSetTime, sectionsById } from "./sectionDetails";
import { useSectionSteps } from "./useSectionSteps";
import { useShownSections } from "./useShownSections";

/** The details panel for one course (div.app-3.md, "course" variant). */
export function CourseDetails({ course }: { course: Course }) {
  const code = course.code;
  const { chosen, locked, busy, answered, displayed } = useShownSections(course);
  const selectedSection = usePlanner((state) => (state.selectedCourse === code ? state.selectedSection : null));
  const headingRef = useRef<HTMLHeadingElement>(null);

  const sections = sectionsById(course, displayed);
  const steps = useSectionSteps(course, displayed);
  const shownInstructors = uniqueInstructors(sections);
  // Cards shown only because they're locked disappear on Unlock, so focus goes to the heading.
  const focusHeading = chosen.length === 0 ? () => headingRef.current?.focus() : undefined;
  const untimed = sections.some((section) => !hasSetTime(section));
  const hasLectures = course.sections.some((section) => section.type === "lecture");
  const waitlist = sections.some((section) => section.status === "waitlist");

  return (
    <div className="flex flex-col gap-4">
      {/* After a click on one of its calendar blocks (div.app-19.md). */}
      {selectedSection && chosen.includes(selectedSection) && (
        <p className="text-9 leading-13 font-650 text-ink-muted">Selected course</p>
      )}
      <h2 ref={headingRef} tabIndex={-1} className="text-21 leading-25-2 font-700 tracking-heading text-ink">
        {code}
      </h2>
      <p className="text-11 leading-17-6 font-510 text-ink">{course.title}</p>

      {!waitlist && <ProfessorPicker course={course} />}
      {!hasLectures && (
        <p className="mt-12 text-10 leading-17-5 text-ink-muted">
          {course.sections.some((section) => section.type === "lab") ? "This course has no lecture. Choose a lab section directly." : "This course has no lecture. Choose a section directly."}
        </p>
      )}

      {chosen.length === 0 && answered && (
        <p className="pt-7 text-10 leading-17-5 text-ink-muted">No schedule fits with this course right now.</p>
      )}

      <SectionsInSchedule course={course} sections={sections} locked={locked} waitlist={waitlist} onUnlocked={focusHeading} labs={steps.labs} lectures={steps.lectures} busy={busy} />

      {waitlist && (
        <>
          <p className="pt-11 pb-13 text-10 leading-17-5 text-ink-muted">This schedule includes a full section because Only open sections is off.</p>
          <ButtonLink href="https://workday.wpi.edu" external fullWidth icon={<ArrowSquareOut aria-hidden />}>Join waitlist in Workday</ButtonLink>
          <ProfessorPicker course={course} />
        </>
      )}

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
    </div>
  );
}
