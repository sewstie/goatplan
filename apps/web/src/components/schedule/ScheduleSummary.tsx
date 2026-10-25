"use client";

import { selectCurrentSchedule, selectSavedPlan, usePlanner } from "@/lib/store";
import { count, scheduleBadges, summaryText } from "./scheduleCopy";
import { ScoreChips } from "./ScoreChips";
import { useScheduleItems } from "./useScheduleItems";
import { useDiagnosis } from "./useDiagnosis";

/** Schedule agent: the line under the title, like "3 courses · 24 schedules fit". */
export function ScheduleSummary() {
  const saved = usePlanner(selectSavedPlan);
  const termStatus = usePlanner((state) => state.termStatus);
  const termName = usePlanner((state) => state.terms.find((term) => term.id === state.termId)?.name ?? null);
  const courseCount = usePlanner((state) => state.courses.length);
  const response = usePlanner((state) => state.response);
  const solveStatus = usePlanner((state) => state.solveStatus);
  const sortPreset = usePlanner((state) => state.sortPreset);
  const schedule = usePlanner(selectCurrentSchedule);
  const { classes, untimed, waitlisted } = useScheduleItems();
  const diagnosis = useDiagnosis();

  // A course has no set time only when none of its chosen sections meet.
  const timed = new Set(classes.map((item) => item.courseCode));
  const untimedCourses = new Set(untimed.map((item) => item.courseCode).filter((code) => !timed.has(code))).size;

  if (saved) return <span>{count("course", saved.courses.length)} · Saved plan</span>;

  const issue = diagnosis?.issues[0];
  const text = issue ? (issue.kind === "pair" ? `${count("course", courseCount)} · ${issue.summary}` : issue.summary) : summaryText({
    termStatus,
    termName,
    courseCount,
    response,
    solveStatus,
    untimedCourses,
    hasWaitlist: waitlisted.length > 0,
  });
  if (!text) return null;

  const showChips = termStatus === "ready" && solveStatus === "done" && courseCount > 0 && schedule;
  const badges = showChips ? scheduleBadges(classes, sortPreset) : [];

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
      <span>{text}</span>
      {badges.length > 0 && <ScoreChips chips={badges} />}
    </div>
  );
}
