"use client";

import { useMemo } from "react";
import { formatTimeRange } from "@/lib/data/time";
import type { Day } from "@/lib/data/types";
import { usePlanner } from "@/lib/store";
import { blockPosition } from "./blockStyles";
import { BlockedTimeBlock } from "./BlockedTimeBlock";
import { ClassBlock } from "./ClassBlock";
import type { Density } from "./density";
import { EarlyBand } from "./EarlyBand";
import { assignLanes } from "./lanes";
import { NoTimeStrip } from "./NoTimeStrip";
import type { ClassItem } from "./scheduleItems";
import { fitRange } from "./timeRange";
import { useScheduleItems } from "./useScheduleItems";
import { visibleDays } from "./weekDays";
import { WeekCalendar } from "./WeekCalendar";

const FULL_COLUMN = { lane: 0, lanes: 1 };

/** The shown schedule on a calendar fitted to it, with the student's blocked times and start time. */
export function PlanCalendar() {
  const preferences = usePlanner((state) => state.preferences);
  const selectedCourse = usePlanner((state) => state.selectedCourse);
  const selectedSection = usePlanner((state) => state.selectedSection);
  const selectCourse = usePlanner((state) => state.selectCourse);
  const { classes, untimed } = useScheduleItems();

  const range = fitRange([...classes, ...preferences.blocked], preferences.startsAfter);
  const days = visibleDays([...classes, ...preferences.blocked]);
  // Each day's blocks in time order, so screen readers and Tab go through the day as it happens.
  const byDay = useMemo(() => {
    const groups = new Map<Day, ClassItem[]>();
    for (const item of classes) groups.set(item.day, [...(groups.get(item.day) ?? []), item]);
    for (const items of groups.values()) items.sort((a, b) => a.start - b.start || a.end - b.end);
    return groups;
  }, [classes]);
  const lanes = useMemo(() => new Map([...byDay.values()].flatMap((items) => [...assignLanes(items)])), [byDay]);

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
            // The course opens in the details panel; a second click clears the block but keeps the course.
            onSelect={(clicked) => selectCourse(clicked.courseCode, selected ? null : clicked.sectionId)}
          />
        );
      })}
    </>
  );

  const hasTimes = classes.length > 0 || preferences.blocked.length > 0;

  return (
    <WeekCalendar
      days={days}
      range={range}
      caption={hasTimes ? `Auto-fit · ${formatTimeRange(range.start, range.end)}` : "No timed courses yet"}
      renderDay={renderDay}
      background={hasTimes && <EarlyBand range={range} startsAfter={preferences.startsAfter} />}
      footer={<NoTimeStrip items={untimed} />}
    />
  );
}
