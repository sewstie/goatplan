"use client";

import { useMemo, type ReactNode } from "react";
import { formatTimeRange } from "@/lib/data/time";
import type { Day } from "@/lib/data/types";
import { selectSchedules, usePlanner } from "@/lib/store";
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
import { useAlternativeSheet } from "@/components/sections/alternativeSheet";
import { useSectionChoices } from "@/components/sections/useSectionChoices";
import { WeekCalendar } from "./WeekCalendar";

const FULL_COLUMN = { lane: 0, lanes: 1 };
const NO_PREVIEWS: readonly ClassItem[] = [];

export function PlanCalendar({ previews = NO_PREVIEWS, overlay }: { previews?: readonly ClassItem[]; overlay?: ReactNode }) {
  const term = usePlanner((state) => state.term);
  const schedules = usePlanner(selectSchedules);
  const pending = usePlanner((state) => state.solveStatus === "waiting" || state.solveStatus === "solving");
  const preferences = usePlanner((state) => state.preferences);
  const selectedCourse = usePlanner((state) => state.selectedCourse);
  const selectedSection = usePlanner((state) => state.selectedSection);
  const selectCourse = usePlanner((state) => state.selectCourse);
  const course = term?.courses.find((item) => item.code === selectedCourse);
  const choices = useSectionChoices(course);
  const openChoices = useAlternativeSheet((state) => state.open);
  const { classes: scheduled, untimed } = useScheduleItems();
  const diagnostic = useDiagnosticPreview();
  const sectionPreviews = useSectionPreviewItems();
  const previewItems = useMemo(() => [...previews, ...diagnostic.classes, ...sectionPreviews], [previews, diagnostic.classes, sectionPreviews]);
  const classes = useMemo(() => [...scheduled, ...previewItems], [scheduled, previewItems]);

  const { range, days } = useMemo(
    () => calendarBounds(term, schedules, preferences.blocked, previewItems),
    [term, schedules, preferences.blocked, previewItems],
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
              if (selected && choices && !clicked.preview) {
                openChoices(clicked.courseCode);
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
      busy={pending}
      days={days}
      range={range}
      caption={hasTimes ? `${diagnostic.hasDiagnosis ? "Preview" : "Auto-fit"} · ${formatTimeRange(range.start, range.end)}` : diagnostic.hasDiagnosis ? "No schedule fits" : "No timed courses yet"}
      renderDay={renderDay}
      background={hasTimes && <EarlyBand range={range} startsAfter={preferences.startsAfter} />}
      footer={<NoTimeStrip items={untimed.length > 0 ? untimed : diagnostic.untimed} />}
      overlay={overlay}
    />
  );
}
