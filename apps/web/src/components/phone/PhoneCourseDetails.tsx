"use client";

import { Fragment, useRef, useState } from "react";
import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import { ProfessorPicker } from "@/components/sections/ProfessorPicker";
import { hasSetTime, sectionsById, typeWord } from "@/components/sections/sectionDetails";
import { useSectionSteps } from "@/components/sections/useSectionSteps";
import { useShownSections } from "@/components/sections/useShownSections";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { uniqueInstructors } from "@/lib/data";
import type { Course, Section } from "@/lib/data/types";
import { usePlanner } from "@/lib/store";
import { PhoneLabChoice } from "./PhoneLabChoice";
import { PhoneLectureChoice } from "./PhoneLectureChoice";
import { PhoneSectionCard } from "./PhoneSectionCard";
import { PhoneSectionChange } from "./PhoneSectionChange";
import { otherChoicesLabel } from "./phoneSectionText";

/**
 * One course on the phone course screen: a card per chosen section, each followed by "Change lecture"
 * or "Change lab" when there are other times. Picking one locks it, as on the tablet panel.
 */
export function PhoneCourseDetails({ course }: { course: Course }) {
  const { chosen, locked, busy, answered, displayed } = useShownSections(course);
  // The phone has no professor field; one set elsewhere still shows, so it can be cleared.
  const professorSet = usePlanner((state) => Boolean(state.professorByCourse[course.code]));
  const lockSection = usePlanner((state) => state.lockSection);
  const unlockSection = usePlanner((state) => state.unlockSection);
  const [open, setOpen] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Lecture first, then its Change row, then the lab, as in the design.
  const sections = sectionsById(course, displayed).sort((a, b) => Number(b.type === "lecture") - Number(a.type === "lecture"));
  const steps = useSectionSteps(course, displayed);
  // Cards shown only because they're locked disappear on Unlock, so focus goes to the heading.
  const focusHeading = chosen.length === 0 ? () => headingRef.current?.focus() : undefined;
  const untimed = sections.some((section) => !hasSetTime(section));
  const hasLectures = course.sections.some((section) => section.type === "lecture");
  const waitlist = sections.some((section) => section.status === "waitlist");

  const chooseLecture = (lecture: Section) => {
    course.sections.filter((item) => item.type === "lecture" && locked.includes(item.id)).forEach((item) => unlockSection(course.code, item.id));
    lockSection(course.code, lecture.id);
  };

  function change(section: Section) {
    const isLocked = locked.includes(section.id);
    const kind = typeWord(section.type);
    const note = isLocked ? `Unlock ${section.code} to choose another ${kind}.` : undefined;
    const toggle = (next: boolean) => setOpen(next ? section.type : null);

    if (section.type === "lecture") {
      const lectures = steps.lectures;
      if (!lectures || lectures.label === "Only lecture" || (lectures.choices.length === 0 && open !== "lecture")) return null;
      return (
        <PhoneSectionChange kind={kind} label={otherChoicesLabel(section, lectures.choices.map((choice) => choice.section))} note={note} open={open === "lecture"} busy={busy} onOpenChange={toggle}>
          {lectures.choices.map((choice) => (
            <PhoneLectureChoice key={choice.section.id} choice={choice} onChoose={isLocked ? undefined : () => { chooseLecture(choice.section); toggle(false); }} />
          ))}
        </PhoneSectionChange>
      );
    }
    const labs = steps.labs.find(({ current }) => current.id === section.id);
    if (!labs || (labs.choices.length === 0 && open !== section.type)) return null;
    return (
      <PhoneSectionChange kind={kind} label={otherChoicesLabel(section, labs.choices)} note={note} open={open === section.type} busy={busy} onOpenChange={toggle}>
        {labs.choices.map((choice) => (
          <PhoneLabChoice key={choice.id} section={choice} onChoose={isLocked ? undefined : () => { lockSection(course.code, choice.id); toggle(false); }} />
        ))}
      </PhoneSectionChange>
    );
  }

  return (
    <div className="flex flex-col">
      <h2 ref={headingRef} tabIndex={-1} className="text-25 leading-30 font-700 tracking-heading text-ink">
        {course.code}
      </h2>
      <p className="mt-6 text-11 font-510 text-ink">{course.title}</p>

      {professorSet && !waitlist && <ProfessorPicker course={course} />}
      {!hasLectures && (
        <p className="mt-12 text-9 text-ink-muted">
          {course.sections.some((section) => section.type === "lab") ? "This course has no lecture. Choose a lab section directly." : "This course has no lecture. Choose a section directly."}
        </p>
      )}
      {chosen.length === 0 && answered && (
        <p className="mt-12 text-9 text-ink-muted">No schedule fits with this course right now.</p>
      )}

      {sections.length > 0 && (
        <div className="mt-16 flex flex-col gap-8">
          {sections.map((section, index) => (
            // Keyed by type, so a picked lab keeps its Change row and focus can return to it.
            <Fragment key={`${section.type}:${index}`}>
              <PhoneSectionCard
                course={course}
                section={section}
                locked={locked.includes(section.id)}
                busy={busy}
                onlyLecture={section.type === "lecture" && steps.lectures?.label === "Only lecture"}
                onLock={section.type === "lecture" ? () => chooseLecture(section) : undefined}
                onUnlocked={focusHeading}
              />
              {change(section)}
            </Fragment>
          ))}
        </div>
      )}

      {waitlist && (
        <div className="mt-12 flex flex-col gap-12">
          <p className="text-9 text-ink-muted">This schedule includes a full section because Only open sections is off.</p>
          <ButtonLink href="https://workday.wpi.edu" external fullWidth icon={<ArrowSquareOut aria-hidden />}>Join waitlist in Workday</ButtonLink>
          {professorSet && <ProfessorPicker course={course} />}
        </div>
      )}
      {untimed && (
        <p className="mt-12 text-9 text-ink-muted">This section appears in the No set time strip. It does not block calendar time.</p>
      )}
      {sections.length > 0 && uniqueInstructors(sections).length === 0 && !untimed && (
        <div className="mt-12 text-9 text-ink-muted">
          <p>Instructor not assigned yet.</p>
          <p>Professor reviews appear when an instructor is available.</p>
        </div>
      )}
    </div>
  );
}
