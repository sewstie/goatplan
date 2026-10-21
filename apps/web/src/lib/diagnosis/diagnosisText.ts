import { formatDays, formatTime, formatTimeRange } from "@/lib/data";
import { lectureInstructors, lecturesByProfessor } from "@/lib/data/instructors";
import type { Day, Section, TermFile } from "@/lib/data/types";
import type { Diagnosis, EmptyCourse, Fix } from "@/lib/engine/types";
import type { PlanPreferences } from "@/lib/store/types";
import { availableOptions, commonSections, lockedOptions, optionSections } from "./sectionOptions";

export interface DiagnosisContext {
  term: TermFile | null;
  preferences: PlanPreferences;
  locks: Readonly<Record<string, readonly string[]>>;
  professorByCourse?: Readonly<Record<string, string | null>>;
}

export interface DiagnosisIssue {
  kind: "missing" | "preferences" | "professor" | "lock" | "startTime" | "full" | "blocked" | "pair" | "group";
  key: string;
  courses: string[];
  title: string;
  detail: string;
  summary: string;
  banner: { title: string; detail: string };
  sectionIds: string[];
  problemSectionIds: string[];
  excludedSectionIds: string[];
}

export interface DiagnosisFix {
  fix: Fix;
  label: string;
  count: string;
}

const number = new Intl.NumberFormat("en-US");
const names = (items: readonly string[], join = "and") => items.length < 2
  ? items.join("")
  : `${items.slice(0, -1).join(", ")} ${join} ${items.at(-1)}`;
const choices = (count: number) => `${number.format(count)} section ${count === 1 ? "choice" : "choices"}`;

function emptyIssue(empty: EmptyCourse, context: DiagnosisContext): DiagnosisIssue {
  const { code, removed } = empty;
  const course = context.term?.courses.find((item) => item.code === code);
  const locked = context.locks[code] ?? [];
  const professor = context.professorByCourse?.[code];
  const lockedFull = course && context.preferences.onlyOpen
    ? optionSections(course, locked).filter((section) => section.status !== "open")
    : [];
  const base: DiagnosisIssue = {
    kind: "preferences",
    key: `empty:${code}`,
    courses: [code],
    title: "Your preferences exclude this course",
    detail: `${code} has no section choices left.`,
    summary: `${code} has no sections that fit your preferences.`,
    banner: { title: "No schedule fits.", detail: `${code} has no sections that fit your preferences.` },
    sectionIds: [],
    problemSectionIds: [],
    excludedSectionIds: [],
  };
  if (course && professor) {
    const eligible = lecturesByProfessor(course.sections, professor);
    if (eligible.length === 0) {
      const recovery = lectureInstructors(course.sections).length > 0 ? "Choose Any professor or select another professor." : "Choose Any professor.";
      const detail = `${professor} has no lecture sections for ${code} this term. ${recovery}`;
      return {
        ...base,
        kind: "professor",
        title: "Your selected professor is unavailable",
        detail,
        summary: `${code}’s selected professor is unavailable.`,
        banner: { title: "No schedule fits.", detail },
        sectionIds: [...locked],
      };
    }
    const options = lockedOptions(course, locked);
    if (locked.length > 0 && options.length > 0 && !options.some((sections) => sections.some((section) => eligible.some((lecture) => lecture.id === section.id)))) {
      const labels = optionSections(course, locked).map((section) => section.code);
      const detail = `${code} cannot include ${names(labels)} with a lecture taught by ${professor}. Choose Any professor or unlock a section.`;
      return {
        ...base,
        kind: "professor",
        title: "Your professor choice conflicts with your locks",
        detail,
        summary: `${code}’s professor choice conflicts with your locks.`,
        banner: { title: "No schedule fits.", detail },
        sectionIds: [...locked],
        problemSectionIds: [...locked],
      };
    }
  }
  if (empty.optionsInData === 0) {
    return { ...base, kind: "missing", title: "No sections to choose from", detail: `${code} has no section choices in this term.` };
  }
  if (lockedFull.length > 0 && removed.notOpen > 0) {
    const labels = lockedFull.map((section) => section.code);
    const alternatives = course ? [...new Set(availableOptions(course, [], context.preferences, professor).flat()
      .filter((section) => lockedFull.some((item) => item.type === section.type) && !locked.includes(section.id))
      .map((section) => section.code))] : [];
    const singular = labels.length === 1;
    const sameType = lockedFull.every((section) => section.type === lockedFull[0].type);
    const type = sameType && lockedFull[0].type !== "other" ? lockedFull[0].type : "section";
    return {
      ...base,
      kind: "lock",
      title: "This lock leaves no options",
      detail: `Locking ${names(labels)} leaves no options because ${singular ? "it’s full" : "they’re full"}.${alternatives.length > 0 ? ` Unlock ${singular ? "it" : "them"} to consider ${names(alternatives, "or")}.` : ""}`,
      summary: `Your locked ${type}${singular ? " has" : "s have"} no open seats.`,
      banner: { title: `${names(labels)} ${singular ? "is" : "are"} full.`, detail: "The lock leaves no options while Only open sections is on." },
      sectionIds: lockedFull.map((section) => section.id),
      problemSectionIds: lockedFull.map((section) => section.id),
    };
  }
  const onlyEarly = removed.startsTooEarly > 0 && removed.notOpen === 0 && removed.blocked === 0;
  if (onlyEarly && course) {
    const early = commonSections(lockedOptions(course, locked))
      .filter((section) => section.meetings.some((meeting) => meeting.start < context.preferences.startsAfter));
    const lecture = early.find((section) => section.type === "lecture" && course.sections.filter((item) => item.type === "lecture").length === 1);
    if (lecture) {
      const start = Math.min(...lecture.meetings.map((meeting) => meeting.start));
      const time = formatTime(start);
      const preference = formatTime(context.preferences.startsAfter);
      return {
        ...base,
        kind: "startTime",
        title: "Your start time excludes this lecture",
        detail: `${code}’s only lecture starts at ${time}, but Starts after is set to ${preference}.`,
        summary: `Your start-time preference excludes ${code}.`,
        banner: { title: `Starts after ${preference}`, detail: `excludes ${code}’s only lecture at ${time}.` },
        sectionIds: [lecture.id],
        excludedSectionIds: early.map((section) => section.id),
      };
    }
  }
  if (removed.notOpen === empty.optionsInData) {
    const allFull = course && course.sections.length > 0 && course.sections.every((section) => section.status !== "open");
    return {
      ...base,
      kind: "full",
      title: allFull ? "Every section is full" : "No open section choices",
      detail: allFull ? `Every ${code} section is full. Show full sections, or join a waitlist in Workday.` : `Every section choice for ${code} includes a full or waitlisted section.`,
      summary: allFull ? `${code} has no open sections.` : `${code} has no open section choices.`,
      banner: { title: allFull ? `Every ${code} section is full.` : `${code} has no open section choices.`, detail: "Only open sections excludes this course." },
      sectionIds: course ? commonSections(lockedOptions(course, locked)).map((section) => section.id) : [],
    };
  }
  const reasons: string[] = [];
  if (removed.notLocked) reasons.push(`${choices(removed.notLocked)} ${removed.notLocked === 1 ? "does" : "do"} not include all your locked sections.`);
  if (removed.notAnyOf) reasons.push(`${choices(removed.notAnyOf)} ${removed.notAnyOf === 1 ? "does" : "do"} not include a section taught by ${professor ?? "your chosen professor"}.`);
  if (removed.notOpen) reasons.push(`${choices(removed.notOpen)} ${removed.notOpen === 1 ? "includes" : "include"} full or waitlisted sections.`);
  if (removed.startsTooEarly) reasons.push(`${choices(removed.startsTooEarly)} ${removed.startsTooEarly === 1 ? "starts" : "start"} before ${formatTime(context.preferences.startsAfter)}.`);
  if (removed.blocked) reasons.push(`${choices(removed.blocked)} ${removed.blocked === 1 ? "overlaps" : "overlap"} your blocked times.`);
  return {
    ...base,
    kind: removed.notAnyOf === empty.optionsInData ? "professor" : removed.blocked > 0 && removed.notOpen === 0 && removed.startsTooEarly === 0 ? "blocked" : onlyEarly ? "startTime" : "preferences",
    title: removed.notAnyOf === empty.optionsInData ? "Your professor choice leaves no options" : removed.blocked > 0 && removed.notOpen === 0 && removed.startsTooEarly === 0 ? "Your blocked times overlap" : onlyEarly ? "Your start time is too late" : base.title,
    detail: [base.detail, ...reasons].join(" "),
  };
}

function sharedMeeting(first: readonly Section[], second: readonly Section[]) {
  for (const a of first) for (const b of second) {
    const overlaps = a.meetings.flatMap((x) => b.meetings.flatMap((y) => {
      const days = x.days.filter((day) => y.days.includes(day));
      const start = Math.max(x.start, y.start);
      const end = Math.min(x.end, y.end);
      return days.length > 0 && start < end ? [{ days, start, end }] : [];
    }));
    if (overlaps.length === 0) continue;
    const { start, end } = overlaps[0];
    const days: Day[] = [...new Set(overlaps.filter((item) => item.start === start && item.end === end).flatMap((item) => item.days))];
    return { first: a, second: b, start, end, days };
  }
  return null;
}

function pairIssue(pair: [string, string], context: DiagnosisContext): DiagnosisIssue {
  const courses = pair.map((code) => context.term?.courses.find((course) => course.code === code));
  const common = courses.map((course) => course ? commonSections(availableOptions(course, context.locks[course.code] ?? [], context.preferences, context.professorByCourse?.[course.code])) : []);
  const meeting = sharedMeeting(common[0], common[1]);
  const base: DiagnosisIssue = {
    kind: "pair",
    key: `pair:${pair.join("|")}`,
    courses: pair,
    title: "These courses never fit together",
    detail: `With your current preferences, ${names(pair)} never fit together, whatever sections you pick.`,
    summary: `${names(pair)} overlap`,
    banner: { title: "No schedule fits.", detail: `${names(pair)} never fit together, whatever sections you pick.` },
    sectionIds: [],
    problemSectionIds: [],
    excludedSectionIds: [],
  };
  if (!meeting) return base;
  const label = `${pair[0]} ${meeting.first.code} and ${pair[1]} ${meeting.second.code}`;
  const days = formatDays(meeting.days);
  const time = formatTimeRange(meeting.start, meeting.end, "shared");
  return {
    ...base,
    title: meeting.first.type === "lecture" && meeting.second.type === "lecture" ? "Two lectures overlap" : "Two sections overlap",
    detail: `${label} both meet ${days} from ${time}.`,
    banner: { title: "No schedule fits.", detail: `${label} overlap · ${days}, ${time}.` },
    problemSectionIds: [meeting.first.id, meeting.second.id],
  };
}

export function fixText(fix: Fix, context: DiagnosisContext): DiagnosisFix {
  let label: string;
  switch (fix.kind) {
    case "relaxStartsAfter": label = fix.startsAfter === 0 ? "Clear start restriction" : `Change to ${formatTime(fix.startsAfter)}`; break;
    case "clearBlocked": label = "Clear blocked times"; break;
    case "allowFull": label = "Show full sections"; break;
    case "clearAnyOf": label = `Allow any professor for ${fix.course}`; break;
    case "dropCourse": label = `Remove ${fix.course}`; break;
    case "unlock": {
      const course = context.term?.courses.find((item) => item.code === fix.course);
      const ids = context.locks[fix.course] ?? [];
      const section = ids.length === 1 && course?.sections.find((item) => item.id === ids[0]);
      label = `Unlock ${section ? section.code : fix.course}`;
    }
  }
  const count = `${number.format(fix.schedules)} ${fix.schedules === 1 ? "schedule fits" : "schedules fit"}`;
  return { fix, label, count: fix.capped ? `At least ${count}` : count };
}

export function diagnosisText(diagnosis: Diagnosis, context: DiagnosisContext) {
  if (diagnosis.unsure) return { issues: [], fixes: [] };
  const issues = [
    ...diagnosis.emptyCourses.map((empty) => emptyIssue(empty, context)),
    ...diagnosis.clashingPairs.map((pair) => pairIssue(pair, context)),
  ];
  if (diagnosis.minimalClash.length > 0) {
    const courses = diagnosis.minimalClash;
    issues.push({
      kind: "group",
      key: `group:${courses.join("|")}`,
      courses,
      title: "These courses can’t all fit together",
      detail: `${names(courses)} can’t all fit together with your current preferences.`,
      summary: `${names(courses)} can’t all fit together.`,
      banner: { title: "No schedule fits.", detail: `${names(courses)} can’t all fit together.` },
      sectionIds: [], problemSectionIds: [], excludedSectionIds: [],
    });
  }
  const hasExcludedLecture = issues.some((issue) => issue.kind === "startTime" && issue.excludedSectionIds.length > 0);
  const hasClearStart = diagnosis.fixes.some((fix) => fix.kind === "relaxStartsAfter" && fix.startsAfter === 0);
  const fixes = diagnosis.fixes.flatMap((fix) => {
    const text = fixText(fix, context);
    if (hasExcludedLecture && !hasClearStart && fix.kind === "relaxStartsAfter" && fix.startsAfter > 0) {
      return [text, fixText({ ...fix, startsAfter: 0, capped: true }, context)];
    }
    return [text];
  });
  return { issues, fixes };
}
