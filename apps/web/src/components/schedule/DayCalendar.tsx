"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import { DAY_NAMES } from "@/lib/data/days";
import { formatTimeRange } from "@/lib/data/time";
import { roomName } from "@/lib/data/rooms";
import type { Day } from "@/lib/data/types";
import { usePlanner, selectSavedPlan, selectViewedCourse, selectViewedSection } from "@/lib/store";
import { COURSE_COLORS } from "@/components/ui/courseColors";
import { cx } from "@/components/ui/cx";
import { useOpenPhoneDetails } from "@/components/shell/phoneDetails";
import { blockLabel } from "./ClassBlock";
import { dayView, type DayItem, type DayTab } from "./dayView";
import { formatDuration } from "./scheduleCopy";
import { NoTimeStrip } from "./NoTimeStrip";
import { useScheduleItems } from "./useScheduleItems";

// ── Helpers ──

/** Current weekday from the system clock. */
function todayDay(): Day {
  const names: Day[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return names[new Date().getDay()];
}

/**
 * Compute free-time dividers between consecutive items on a day.
 * Returns the free minutes between consecutive items, or 0 when ≤ 10 min.
 */
function freeMinutes(items: readonly DayItem[]): number[] {
  const gaps: number[] = [];
  for (let i = 1; i < items.length; i++) {
    const gap = items[i].start - items[i - 1].end;
    gaps.push(gap > 10 ? gap : 0);
  }
  return gaps;
}

// ── DayCalendar component ──

export function DayCalendar() {
  const saved = usePlanner(selectSavedPlan);
  const selectedCourse = usePlanner(selectViewedCourse);
  const selectedSection = usePlanner(selectViewedSection);
  const selectCourse = usePlanner((state) => state.selectCourse);
  const blocked = usePlanner((state) => selectSavedPlan(state)?.preferences.blocked ?? state.preferences.blocked);
  const openPhoneDetails = useOpenPhoneDetails();
  const { classes, untimed } = useScheduleItems();

  const view = useMemo(
    () => dayView(classes, [...blocked, ...untimed], todayDay()),
    [classes, blocked, untimed],
  );

  const [activeDay, setActiveDay] = useState<Day>(view.selectedDay);

  const tabListRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const tabIdPrefix = useId();

  const tabId = (day: Day) => `${tabIdPrefix}-${day}`;

  // ── Tab keyboard navigation ──
  const handleTabKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const tabs = view.tabs;
      const currentIndex = tabs.findIndex((t) => t.day === activeDay);
      let nextIndex: number | null = null;

      switch (event.key) {
        case "ArrowLeft":
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          break;
        case "ArrowRight":
          nextIndex = (currentIndex + 1) % tabs.length;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      const nextDay = tabs[nextIndex].day;
      setActiveDay(nextDay);

      // Focus the newly selected tab
      const tabList = tabListRef.current;
      if (tabList) {
        const btn = tabList.querySelector<HTMLButtonElement>(`[data-day="${nextDay}"]`);
        btn?.focus();
      }
    },
    [activeDay, view.tabs],
  );

  // ── Block selection ──
  const handleBlockClick = useCallback(
    (courseCode: string, sectionId: string) => {
      if (saved) {
        selectCourse(courseCode, sectionId);
      } else {
        const alreadySelected = selectedCourse === courseCode && selectedSection === sectionId;
        selectCourse(courseCode, alreadySelected ? null : sectionId);
      }
      openPhoneDetails();
    },
    [saved, selectedCourse, selectedSection, selectCourse, openPhoneDetails],
  );

  const dayItems = view.dayClasses(activeDay);
  const gaps = freeMinutes(dayItems);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── Day tabs ── */}
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Days of the week"
        className="flex shrink-0 border-b border-line"
      >
        {view.tabs.map((tab) => (
          <DayTabButton
            key={tab.day}
            tab={tab}
            selected={tab.day === activeDay}
            tabId={tabId(tab.day)}
            panelId={panelId}
            onSelect={() => setActiveDay(tab.day)}
            onKeyDown={handleTabKeyDown}
          />
        ))}
      </div>

      {/* ── Day panel ── */}
      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(activeDay)}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
      >
        {dayItems.length === 0 ? (
          <p className="px-(--size-phone-gutter) py-24 text-center text-10 leading-14-5 text-ink-muted">
            No classes on {DAY_NAMES[activeDay]}
          </p>
        ) : (
          <ul className="flex flex-col gap-0 px-(--size-phone-gutter) py-10">
            {dayItems.map((item, i) => (
              <li key={item.kind === "class" ? item.item.key : `blocked-${item.day}-${item.start}`}>
                {/* Free-time divider */}
                {i > 0 && gaps[i - 1] > 0 && (
                  <div className="flex items-center gap-10 py-8" aria-hidden>
                    <span className="flex-1 border-t border-line-soft" />
                    <span className="text-9 leading-13 text-ink-faint">{formatDuration(gaps[i - 1])} free</span>
                    <span className="flex-1 border-t border-line-soft" />
                  </div>
                )}
                {item.kind === "class" ? (
                  <DayClassBlock
                    item={item}
                    selected={selectedCourse === item.item.courseCode && selectedSection === item.item.sectionId}
                    onClick={handleBlockClick}
                  />
                ) : (
                  <DayBlockedBlock start={item.start} end={item.end} label={item.label} />
                )}
              </li>
            ))}
          </ul>
        )}

        {/* ── No set time ── */}
        <NoTimeStrip items={saved ? untimed : view.untimedItems} />
      </div>
    </div>
  );
}

// ── Sub-components ──

function DayTabButton({
  tab,
  selected,
  tabId,
  panelId,
  onSelect,
  onKeyDown,
}: {
  tab: DayTab;
  selected: boolean;
  tabId: string;
  panelId: string;
  onSelect: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={tabId}
      aria-selected={selected}
      aria-controls={panelId}
      tabIndex={selected ? 0 : -1}
      data-day={tab.day}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cx(
        "relative flex flex-1 flex-col items-center gap-3 py-10 text-10 leading-14-5 transition-colors",
        selected
          ? "bg-accent-soft text-accent font-650"
          : "text-ink-muted hover:bg-surface-selected",
      )}
    >
      <span>{tab.day}</span>
      {tab.hasClasses && (
        <span
          aria-hidden
          className={cx(
            "absolute bottom-6 size-4 rounded-full",
            selected ? "bg-accent" : "bg-ink-faint",
          )}
        />
      )}
    </button>
  );
}

function DayClassBlock({
  item,
  selected,
  onClick,
}: {
  item: Extract<DayItem, { kind: "class" }>;
  selected: boolean;
  onClick: (courseCode: string, sectionId: string) => void;
}) {
  const classItem = item.item;
  const room = classItem.location ? roomName(classItem.location) : null;
  const colors = COURSE_COLORS[classItem.slot];

  return (
    <button
      type="button"
      aria-label={blockLabel(classItem)}
      aria-pressed={selected}
      data-block={classItem.key}
      onClick={() => onClick(classItem.courseCode, classItem.sectionId)}
      className={cx(
        "flex w-full flex-col rounded-block border px-10 py-8 text-left transition-[border-color,box-shadow]",
        selected
          ? "border-accent bg-surface-raised text-ink shadow-selected"
          : cx("border-transparent hover:shadow-block-hover", colors.block),
      )}
    >
      <span className="flex items-center gap-4">
        <span className="min-w-0 truncate text-10 leading-14-5 font-700">{classItem.courseCode}</span>
        <span className="min-w-0 shrink-[50] truncate text-10 leading-14-5">{classItem.sectionCode}</span>
      </span>
      <span className="mt-2 text-10 leading-14-5 text-ink-soft">
        {formatTimeRange(classItem.start, classItem.end)}
        {room && <> · <span className="break-words">{room}</span></>}
      </span>
    </button>
  );
}

function DayBlockedBlock({ start, end, label }: { start: number; end: number; label?: string }) {
  return (
    <div className="flex w-full flex-col rounded-block border border-line-disabled bg-hatch px-10 py-8 text-ink-hatch">
      <p className="text-10 leading-14-5 font-600">{label ?? formatTimeRange(start, end, "short")}</p>
      {label && <p className="mt-1 text-10 leading-14-5">{formatTimeRange(start, end)}</p>}
      <p className="text-10 leading-14-5">blocked</p>
    </div>
  );
}
