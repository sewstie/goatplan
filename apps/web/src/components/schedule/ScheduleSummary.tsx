"use client";

import { selectCurrentSchedule, SORT_PRESETS, usePlanner } from "@/lib/store";
import { scoreChips, summaryText } from "./scheduleCopy";
import { ScoreChips } from "./ScoreChips";
import { useScheduleItems } from "./useScheduleItems";

/** The engine's default (docs/engine-api.md): class before 10:00 AM counts as early. */
const DEFAULT_EARLY_CUTOFF = 600;

/** Schedule agent: the line under the title, like "3 courses · 24 schedules fit". */
export function ScheduleSummary() {
  const termStatus = usePlanner((state) => state.termStatus);
  const termName = usePlanner((state) => state.terms.find((term) => term.id === state.termId)?.name ?? null);
  const courseCount = usePlanner((state) => state.courses.length);
  const response = usePlanner((state) => state.response);
  const schedule = usePlanner(selectCurrentSchedule);
  const earlyCutoff = usePlanner((state) => SORT_PRESETS[state.sortPreset].weights.earlyCutoff ?? DEFAULT_EARLY_CUTOFF);
  const { untimed, waitlisted } = useScheduleItems();

  const text = summaryText({
    termStatus,
    termName,
    courseCount,
    response,
    untimedCourses: new Set(untimed.map((item) => item.courseCode)).size,
    hasWaitlist: waitlisted.length > 0,
  });
  if (!text) return null;

  const showChips = termStatus === "ready" && courseCount > 0 && schedule;
  return (
    <span className="flex flex-wrap items-center gap-x-8 gap-y-4">
      <span>{text}</span>
      {showChips && <ScoreChips chips={scoreChips(schedule.score, earlyCutoff)} />}
    </span>
  );
}
