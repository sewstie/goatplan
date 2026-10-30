"use client";

import { cx } from "@/components/ui/cx";
import { selectCurrentSchedule, selectSavedPlan, usePlanner } from "@/lib/store";
import { count, scheduleBadgeDetails, summaryText } from "./scheduleCopy";
import { ScoreChips } from "./ScoreChips";
import { useScheduleItems } from "./useScheduleItems";
import { useDiagnosis } from "./useDiagnosis";
import { useHeldHeight } from "./useHeldHeight";

/**
 * Schedule agent: the line under the title, like "3 courses · 24 schedules fit", with the shown
 * schedule's badges on a line of their own. `steady` (the phone) keeps the badge line's space when no
 * schedule fits, and in drawing mode keeps it to one line of text and one row of badges, so it's the
 * same height whether schedules fit or not.
 */
export function ScheduleSummary({ steady = false }: { steady?: boolean } = {}) {
  const saved = usePlanner(selectSavedPlan);
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
  const drawing = usePlanner((state) => state.drawing);
  const oneRow = steady && drawing;
  const [heldRef, heldStyle] = useHeldHeight<HTMLDivElement>(drawing && !oneRow);

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
  const badges = showChips ? scheduleBadgeDetails(classes, schedule.score, sortPreset, startsAfter) : [];

  return (
    <div ref={heldRef} style={heldStyle} className="flex flex-col gap-4">
      <span className={cx(oneRow && "truncate")}>{text}</span>
      {badges.length > 0 ? (
        oneRow ? (
          <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ScoreChips chips={badges} oneRow />
          </div>
        ) : (
          <ScoreChips chips={badges} />
        )
      ) : (
        // The badge line keeps its space while schedules come and go, so the calendar below doesn't move.
        (drawing || steady) && courseCount > 0 && (
          <div aria-hidden className="invisible">
            <ScoreChips chips={[{ text: "Starts", tone: "plain", lead: false }]} oneRow={oneRow} />
          </div>
        )
      )}
    </div>
  );
}
