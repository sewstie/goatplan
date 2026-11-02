"use client";

import { selectCurrentSchedule, selectReadOnlyPlan, usePlanner } from "@/lib/store";
import { count, scheduleBadgeDetails, summaryText, type ScheduleBadge } from "./scheduleCopy";
import { useDiagnosis } from "./useDiagnosis";
import { useScheduleItems } from "./useScheduleItems";

export type ScheduleSummaryParts = {
  text: string | null;
  badges: readonly ScheduleBadge[];
  readOnly: boolean;
  problem: boolean;
};

export function useScheduleSummary(): ScheduleSummaryParts {
  const saved = usePlanner(selectReadOnlyPlan);
  const termStatus = usePlanner((state) => state.termStatus);
  const termName = usePlanner((state) => state.terms.find((term) => term.id === state.termId)?.name ?? null);
  const courseCount = usePlanner((state) => state.courses.length);
  const response = usePlanner((state) => state.response);
  const solveStatus = usePlanner((state) => state.solveStatus);
  const sortPreset = usePlanner((state) => state.sortPreset);
  const startsAfter = usePlanner((state) => state.preferences.startsAfter);
  const schedule = usePlanner(selectCurrentSchedule);
  const { classes, untimed, waitlisted } = useScheduleItems();
  const diagnosis = useDiagnosis();

  if (saved?.id === "__temporary__") return { text: `${saved.term.name} ${saved.term.year} · ${count("course", saved.courses.length)}`, badges: [], readOnly: true, problem: false };
  if (saved) return { text: `${count("course", saved.courses.length)} · Saved plan`, badges: [], readOnly: true, problem: false };

  // A course has no set time only when none of its chosen sections meet.
  const timed = new Set(classes.map((item) => item.courseCode));
  const untimedCourses = new Set(untimed.map((item) => item.courseCode).filter((code) => !timed.has(code))).size;
  const issue = diagnosis?.issues[0];
  const text = issue
    ? issue.kind === "pair" ? `${count("course", courseCount)} · ${issue.summary}` : issue.summary
    : summaryText({ termStatus, termName, courseCount, response, solveStatus, untimedCourses, hasWaitlist: waitlisted.length > 0 });
  const showBadges = termStatus === "ready" && solveStatus === "done" && courseCount > 0 && schedule;
  return {
    text,
    badges: showBadges ? scheduleBadgeDetails(classes, schedule.score, sortPreset, startsAfter) : [],
    readOnly: false,
    problem: issue !== undefined,
  };
}
