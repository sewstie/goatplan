"use client";

import { useMemo, type ReactNode } from "react";
import { formatTimeRange } from "@/lib/data/time";
import type { Day } from "@/lib/data/types";
import { selectSavedPlan, selectSchedules, selectViewedCourse, selectViewedSection, usePlanner } from "@/lib/store";
import { blockPosition } from "./blockStyles";
import { BlockedTimeBlock } from "./BlockedTimeBlock";
import { ClassBlock } from "./ClassBlock";
import { calendarBounds } from "./calendarBounds";
import type { Density } from "./density";
import { EarlyBand } from "./EarlyBand";
import { assignLanes } from "./lanes";
import { NoTimeStrip } from "./NoTimeStrip";
import type { ClassItem } from "./scheduleItems";
import { useScheduleItems } from "./useScheduleItems";
import { useDiagnosticPreview } from "./useDiagnosticPreview";
import { useSectionPreviewItems } from "./useSectionPreviewItems";
import { usePhoneScreen } from "@/components/phone/phoneScreen";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { WeekCalendar } from "./WeekCalendar";

const FULL_COLUMN = { lane: 0, lanes: 1 };
const NO_PREVIEWS: readonly ClassItem[] = [];

export function PlanCalendar({ previews = NO_PREVIEWS, overlay }: { previews?: readonly ClassItem[]; overlay?: ReactNode }) {
  const saved = usePlanner(selectSavedPlan);
  const term = usePlanner((state) => state.term);
  const schedules = usePlanner(selectSchedules);
  const pending = usePlanner((state) => state.solveStatus === "waiting" || state.solveStatus === "solving");
  const preferences = usePlanner((state) => selectSavedPlan(state)?.preferences ?? state.preferences);
  const selectedCourse = usePlanner(selectViewedCourse);
  const selectedSection = usePlanner(selectViewedSection);
  const selectCourse = usePlanner((state) => state.selectCourse);
  const phone = usePhoneViewport();
  const showPhoneScreen = usePhoneScreen((state) => state.show);
  const { classes: scheduled, untimed } = useScheduleItems();
  const diagnostic = useDiagnosticPreview();
  const sectionPreviews = useSectionPreviewItems();
  const previewItems = useMemo(() => saved ? [] : [...previews, ...diagnostic.classes, ...sectionPreviews], [saved, previews, diagnostic.classes, sectionPreviews]);
  const classes = useMemo(() => [...scheduled, ...previewItems], [scheduled, previewItems]);

  // The phone grid is tall, so it starts at the start-time preference instead of under a hatched band.
  const startsAfter = phone ? preferences.startsAfter : 0;
  const { range, days } = useMemo(
    () => saved ? calendarBounds(null, [], preferences.blocked, scheduled, startsAfter) : calendarBounds(term, schedules, preferences.blocked, previewItems, startsAfter),
    [saved, scheduled, term, schedules, preferences.blocked, previewItems, startsAfter],
  );
  // Each day's blocks in time order, so screen readers and Tab go through the day as it happens.
  const byDay = useMemo(() => {
    const groups = new Map<Day, ClassItem[]>();
    for (const item of classes) groups.set(item.day, [...(groups.get(item.day) ?? []), item]);
    for (const items of groups.values()) items.sort((a, b) => a.start - b.start || a.end - b.end);
    return groups;
  }, [classes]);
  const lanes = useMemo(() => {
    const result = new Map([...byDay.values()].flatMap((items) => [...assignLanes(items.filter((item) => !item.choicePreview))]));
    const problemLanes = new Map(classes.filter((item) => item.problem && (result.get(item)?.lanes ?? 0) > 1)
      .map((item) => [item.sectionId, result.get(item)!]));
    for (const item of classes) {
      const lane = problemLanes.get(item.sectionId);
      if (item.problem && lane) result.set(item, lane);
    }
    return result;
  }, [byDay, classes]);

  const renderDay = (day: Day, density: Density) => (
    <>
      {preferences.blocked
        .filter((block) => block.day === day)
        .map((block) => (
          <BlockedTimeBlock
            key={`${block.start}-${block.end}`}
            start={block.start}
            end={block.end}
            label={block.label}
            density={density}
            style={blockPosition(range, block, FULL_COLUMN, 0)}
          />
        ))}
      {(byDay.get(day) ?? []).map((item) => {
        const selected = item.courseCode === selectedCourse && item.sectionId === selectedSection;
        return (
          <ClassBlock
            key={item.key}
            item={item}
            density={density}
            style={blockPosition(range, item, lanes.get(item) ?? FULL_COLUMN)}
            selected={selected}
            onSelect={(clicked) => {
              // On a phone a tap opens the course screen with that section picked.
              if (phone && !clicked.preview) {
                selectCourse(clicked.courseCode, clicked.sectionId);
                showPhoneScreen("course");
                return;
              }
              selectCourse(clicked.courseCode, selected ? null : clicked.sectionId);
            }}
          />
        );
      })}
    </>
  );

  const hasTimes = classes.length > 0 || preferences.blocked.length > 0;

  return (
    <WeekCalendar
      busy={!saved && pending}
      days={days}
      range={range}
      caption={hasTimes ? `${saved ? "Saved plan" : diagnostic.hasDiagnosis ? "Preview" : "Auto-fit"} · ${formatTimeRange(range.start, range.end)}` : diagnostic.hasDiagnosis && !saved ? "No schedule fits" : "No timed courses yet"}
      note={saved ? "Saved plan" : diagnostic.hasDiagnosis ? "Preview" : "Auto-fit to your schedule"}
      renderDay={renderDay}
      background={hasTimes && <EarlyBand range={range} startsAfter={preferences.startsAfter} />}
      footer={<NoTimeStrip items={saved || untimed.length > 0 ? untimed : diagnostic.untimed} />}
      overlay={overlay}
    />
  );
}
