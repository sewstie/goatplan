import { lecturesByProfessor, meetingSpans, meetsRules, spansOverlap, type FitRules } from "@/lib/data";
import type { Course, Section } from "@/lib/data/types";
import { sectionChoices } from "./sectionChoices";
import { sectionsById, typeWord } from "./sectionDetails";

export interface LabChoices {
  current: Section;
  choices: Section[];
}

export interface SectionSteps {
  currentStep: 1 | 2 | null;
  labs: LabChoices[];
  lectures: LectureChoices | null;
}

export interface LectureChoice {
  section: Section;
  reason: string | null;
}

export interface LectureChoices {
  choices: LectureChoice[];
  label: string;
}

export function sectionSteps(course: Course, chosen: readonly string[], locked: readonly string[], rest: readonly Section[], rules: FitRules): SectionSteps {
  const labs: LabChoices[] = sectionsById(course, chosen)
    .filter((section) => section.type !== "lecture")
    .map((current) => {
      const kept = [...chosen, ...locked].filter((id) => id !== current.id);
      const options = course.options.filter((option) => option.length === chosen.length
        && kept.every((id) => option.includes(id))
        && option.every((id) => kept.includes(id) || course.sections.some((section) => section.id === id && section.type === current.type)));
      const fitting = sectionChoices({ ...course, options }, chosen, rest, rules);
      return { current, choices: fitting?.others.flatMap((choice) => choice.sections) ?? [] };
    });

  const lectures = course.sections.filter((section) => section.type === "lecture");
  const fittingOptions = course.options.filter((option) => {
    const sections = sectionsById(course, option);
    return meetsRules(sections, rules)
      && !spansOverlap(meetingSpans(sections), meetingSpans(rest))
      && !sections.some((section, index) => spansOverlap(meetingSpans([section]), meetingSpans(sections.slice(index + 1))));
  });
  const eligible = (rules.professor ? lecturesByProfessor(lectures, rules.professor) : lectures).filter((lecture) => fittingOptions.some((option) => option.includes(lecture.id)));
  const keptLocks = sectionsById(course, locked).filter((section) => section.type !== "lecture");
  const choices = eligible.filter((section) => !chosen.includes(section.id)).map((section) => {
    const options = fittingOptions.filter((option) => option.includes(section.id));
    const fitsLocks = options.some((option) => keptLocks.every((item) => option.includes(item.id)));
    const conflict = keptLocks.find((item) => !options.some((option) => option.includes(item.id))) ?? keptLocks[0];
    return { section, reason: !fitsLocks && conflict ? `Doesn't fit locked ${typeWord(conflict.type)} ${conflict.code}` : null };
  });
  const isLocked = lectures.some((section) => locked.includes(section.id));
  const onlyLecture = eligible.length === 1 && chosen.includes(eligible[0].id);
  const lectureDone = onlyLecture || lectures.length === 0 || isLocked;
  const currentStep = !lectureDone ? 1 : labs.some(({ current }) => !locked.includes(current.id)) ? 2 : null;

  return { currentStep, labs, lectures: lectures.length ? { choices, label: onlyLecture ? "Only lecture" : `${choices.length} other lecture ${choices.length === 1 ? "time" : "times"} · ${isLocked ? "Locked" : "Unlocked"}` } : null };
}
