"use client";

import { useEffect, useMemo, useState } from "react";
import { formatTimeRange } from "@/lib/data/time";
import type { Day } from "@/lib/data/types";
import { usePlanner } from "@/lib/store";
import { blockPosition } from "./blockStyles";
import { BlockedTimeBlock } from "./BlockedTimeBlock";
import { BlockTooltip } from "./BlockTooltip";
import { ClassBlock } from "./ClassBlock";
import type { Density } from "./density";
import { EarlyBand } from "./EarlyBand";
import { assignLanes } from "./lanes";
import { NoTimeStrip } from "./NoTimeStrip";
import type { ClassItem } from "./scheduleItems";
import { fitRange } from "./timeRange";
import { tooltipPosition, type TooltipPosition } from "./tooltipPosition";
import { useScheduleItems } from "./useScheduleItems";
import { visibleDays } from "./weekDays";
import { WeekCalendar } from "./WeekCalendar";

const FULL_COLUMN = { lane: 0, lanes: 1 };

/** The shown schedule on a calendar fitted to it, with the student's blocked times and start time. */
export function PlanCalendar() {
  const preferences = usePlanner((state) => state.preferences);
  const { classes, untimed } = useScheduleItems();
  // Stand-in until the store has a selected section that the details panel also follows.
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [details, setDetails] = useState<{ item: ClassItem; position: TooltipPosition } | null>(null);

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

  useEffect(() => {
    if (!details) return;
    const close = () => setDetails(null);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [details]);

  const showDetails = (item: ClassItem, block: HTMLElement) => {
    const position = tooltipPosition(block.getBoundingClientRect(), {
      width: window.innerWidth,
      height: window.innerHeight,
    });
    setDetails({ item, position });
  };

  const renderDay = (day: Day, density: Density) => (
    <>
      {preferences.blocked
        .filter((block) => block.day === day)
        .map((block) => (
          <BlockedTimeBlock
            key={`${block.start}-${block.end}`}
            start={block.start}
            end={block.end}
            density={density}
            style={blockPosition(range, block, FULL_COLUMN, 0)}
          />
        ))}
      {(byDay.get(day) ?? []).map((item) => (
          <ClassBlock
            key={item.key}
            item={item}
            density={density}
            style={blockPosition(range, item, lanes.get(item) ?? FULL_COLUMN)}
            selected={item.sectionId === selectedSection}
            onSelect={(clicked) =>
              setSelectedSection((current) => (current === clicked.sectionId ? null : clicked.sectionId))
            }
            onShowDetails={showDetails}
            onHideDetails={() => setDetails(null)}
          />
        ))}
    </>
  );

  const hasTimes = classes.length > 0 || preferences.blocked.length > 0;
  const shownDetails = details && classes.some((item) => item.key === details.item.key) ? details : null;

  return (
    <>
      <WeekCalendar
        days={days}
        range={range}
        caption={hasTimes ? `Auto-fit · ${formatTimeRange(range.start, range.end)}` : "No timed courses yet"}
        renderDay={renderDay}
        background={hasTimes && <EarlyBand range={range} startsAfter={preferences.startsAfter} />}
        footer={<NoTimeStrip items={untimed} />}
      />
      {shownDetails && <BlockTooltip item={shownDetails.item} position={shownDetails.position} />}
    </>
  );
}
