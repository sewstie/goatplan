"use client";

import { selectCurrentSchedule, usePlanner } from "@/lib/store";
import { scoreChips, summaryText } from "./scheduleCopy";
import { ScoreChips } from "./ScoreChips";
import { useScheduleItems } from "./useScheduleItems";

/** Schedule agent: the line under the title, like "3 courses · 24 schedules fit". */
export function ScheduleSummary() {
  const termStatus = usePlanner((state) => state.termStatus);
  const termName = usePlanner((state) => state.terms.find((term) => term.id === state.termId)?.name ?? null);
  const courseCount = usePlanner((state) => state.courses.length);
  const response = usePlanner((state) => state.response);
  const schedule = usePlanner(selectCurrentSchedule);
  const { classes, untimed, waitlisted } = useScheduleItems();

  // A course has no set time only when none of its chosen sections meet.
  const timed = new Set(classes.map((item) => item.courseCode));
  const untimedCourses = new Set(untimed.map((item) => item.courseCode).filter((code) => !timed.has(code))).size;

  const text = summaryText({
    termStatus,
    termName,
    courseCount,
    response,
    untimedCourses,
    hasWaitlist: waitlisted.length > 0,
  });
  if (!text) return null;

  const showChips = termStatus === "ready" && courseCount > 0 && schedule;
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
      <span>{text}</span>
      {showChips && <ScoreChips chips={scoreChips(schedule.score)} />}
    </div>
  );
}
