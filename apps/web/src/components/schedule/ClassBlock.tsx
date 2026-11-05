"use client";

import type { CSSProperties } from "react";
import { LockSimple } from "@phosphor-icons/react/ssr";
import { COURSE_COLORS } from "@/components/ui/courseColors";
import { cx } from "@/components/ui/cx";
import { DAY_NAMES } from "@/lib/data/days";
import { roomName } from "@/lib/data/rooms";
import { formatTimeRange } from "@/lib/data/time";
import { clockRange, type BlockLayout } from "./blockLayout";
import { densityClasses } from "./blockStyles";
import type { Density } from "./density";
import { roomParts } from "./roomParts";
import type { ClassItem } from "./scheduleItems";

type ClassBlockProps = {
  item: ClassItem;
  density: Density;
  style: CSSProperties;
  selected: boolean;
  onSelect(item: ClassItem, fromKeyboard: boolean): void;
  /** For a short section: one line ("CS 1101 · 9–9:30") or no text, so nothing gets cut off. */
  layout?: BlockLayout;
  /**
   * In drawing mode a click doesn't show the details, since a drag that starts here blocks time; Enter
   * and Space still do. The block is see-through then, so a blocked time under it shows.
   */
  drawing?: boolean;
};

/** From the tablet breakpoint up, longer ones don't fit any block. The block's label and the details panel have them. */
const MAX_ROOM_CHARS = 28;
/** With no number to keep, a room only shows where it fits whole. */
const MAX_WHOLE_ROOM_CHARS = 20;
const MAX_SECTION_CHARS = 4;
/** A code this long fits --container-block-code-short on one line. */
const SHORT_CODE_CHARS = 7;

/** "AE 2320 CL01, Introduction to Orbital Mechanics, Monday, 9:00 AM–9:50 AM, Unity Hall 400, Ye Lu" */
export function blockLabel(item: ClassItem): string {
  return [
    `${item.courseCode} ${item.sectionCode}`,
    item.title,
    DAY_NAMES[item.day],
    formatTimeRange(item.start, item.end),
    item.location,
    ...item.instructors,
    item.locked ? "locked" : "",
  ]
    .filter(Boolean)
    .join(", ");
}

export function ClassBlock({ item, density, style, selected, onSelect, layout = "full", drawing = false }: ClassBlockProps) {
  const text = densityClasses[density];
  const full = layout === "full";
  const room = item.location ? roomName(item.location) : "";
  const { building, number } = roomParts(room);
  const label = `${item.preview ? "Preview, " : ""}${blockLabel(item)}`;
  const shortCode = item.courseCode.length <= SHORT_CODE_CHARS;
  const lineCode = item.locked
    ? shortCode ? "tablet:@max-block-line-short-locked:hidden" : "tablet:@max-block-line-long-locked:hidden"
    : shortCode ? "tablet:@max-block-code-short:hidden" : "tablet:@max-block-code:hidden";
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      data-block={item.key}
      data-preview={item.preview || undefined}
      onClick={(event) => {
        if (!drawing || event.detail === 0) onSelect(item, event.detail === 0);
      }}
      className={cx(
        "@container absolute flex flex-col overflow-hidden rounded-block border text-left transition-[border-color,box-shadow,top,height] duration-180 motion-reduce:transition-none motion-reduce:duration-0",
        drawing ? "cursor-crosshair opacity-(--opacity-course-drawing)" : "cursor-pointer",
        full ? text.box : "justify-center px-5 tablet:px-4",
        item.choicePreview
          ? "border-dashed border-accent bg-preview-surface text-accent"
          : item.problem
          ? "border-clash-line bg-clash-surface text-clash-ink"
          : cx(
              "hover:shadow-block-hover",
              COURSE_COLORS[item.slot].block,
              // A phone opens the course screen on tap, so the block keeps its course color there.
              selected && "tablet:border-dashed tablet:border-ink-muted tablet:bg-surface-raised tablet:text-ink tablet:shadow-block-hover tablet:hover:border-ink-muted",
            ),
      )}
      style={style}
    >
      {full ? (
        <>
          {item.locked && <LockSimple aria-hidden className="absolute right-1 bottom-1 hidden size-10 tablet:@max-block-code:block" />}
          <span className={cx("flex min-w-0 items-center tablet:@max-block-text:hidden", text.title)}>
            {item.locked && <LockSimple aria-hidden className="size-10 shrink-0 tablet:@max-block-code-locked:hidden" />}
            {/*
              In a narrow lane the section code gives way first. Then, from the tablet breakpoint up, the course
              code wraps, a size down and into the padding, and the time goes. Narrower still, only the color is left.
            */}
            <span className={cx("min-w-0 truncate font-700 tablet:@max-block-code:-mx-3 tablet:@max-block-code:text-8 tablet:@max-block-code:whitespace-normal", text.code)}>{item.courseCode}</span>
            <span className={cx("min-w-0 shrink-[50] truncate tablet:hidden", item.sectionCode.length <= MAX_SECTION_CHARS && "tablet:@block-section:inline", text.section)}>{item.sectionCode}</span>
          </span>
          <span className={cx("truncate tablet:@max-block-code:hidden", text.time)}>
            {item.locked && <LockSimple aria-hidden className="mr-2 hidden size-10 align-text-bottom tablet:@max-block-code-locked:inline" />}
            {item.choicePreview && <span className="tablet:hidden tablet:@block-time:inline">Preview · </span>}
            <span className={cx("tablet:hidden", !item.choicePreview && "tablet:@block-time:inline")}>{formatTimeRange(item.start, item.end)}</span>
            <span className={cx("hidden tablet:inline", !item.choicePreview && "tablet:@block-time:hidden")}>{clockRange(item.start, item.end)}</span>
          </span>
          {room && !item.problem && (
            <span className={cx("gap-3 overflow-hidden opacity-85", density === "regular" && "flex", text.room, density === "regular" && room.length <= MAX_ROOM_CHARS && (number ? "tablet:@block-room:flex" : room.length <= MAX_WHOLE_ROOM_CHARS ? "tablet:@block-time:flex" : "tablet:@block-room-long:flex"))}>
              <span className="min-w-0 truncate">{building}</span>{number && <> <span className="shrink-0">{number}</span></>}
            </span>
          )}
        </>
      ) : (
        layout === "line" && (
          <span className="flex min-w-0 items-center gap-2 text-8 leading-10-4">
            {item.locked && <LockSimple aria-hidden className="size-9 shrink-0" />}
            <span className={cx("min-w-0 truncate", lineCode)}><b className="font-700">{item.courseCode}</b><span className={cx("tablet:hidden", item.locked ? "tablet:@block-line-locked:inline" : "tablet:@block-time:inline")}> · {clockRange(item.start, item.end)}</span></span>
          </span>
        )
      )}
      {/* On its own element, because a title on the button would be read out again after its label. */}
      <span aria-hidden title={label} className="absolute inset-0 hidden tablet:block" />
    </button>
  );
}
