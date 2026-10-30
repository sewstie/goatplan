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
import type { ClassItem } from "./scheduleItems";

type ClassBlockProps = {
  item: ClassItem;
  density: Density;
  style: CSSProperties;
  selected: boolean;
  onSelect(item: ClassItem): void;
  /** For a short section: one line ("CS 1101 · 9–9:30") or no text, so nothing gets cut off. */
  layout?: BlockLayout;
  /**
   * In drawing mode a click doesn't open the details, since a drag that starts here blocks time; Enter
   * and Space still do. The block is see-through then, so a blocked time under it shows.
   */
  drawing?: boolean;
};

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
  return (
    <button
      type="button"
      aria-label={`${item.preview ? "Preview, " : ""}${blockLabel(item)}`}
      aria-pressed={selected}
      data-block={item.key}
      data-preview={item.preview || undefined}
      onClick={(event) => {
        if (!drawing || event.detail === 0) onSelect(item);
      }}
      className={cx(
        "absolute flex flex-col overflow-hidden rounded-block border text-left transition-[border-color,box-shadow,top,height] duration-180 motion-reduce:transition-none motion-reduce:duration-0",
        drawing ? "cursor-crosshair opacity-70" : "cursor-pointer",
        full ? text.box : "justify-center px-5",
        item.choicePreview
          ? "border-dashed border-accent bg-preview-surface text-accent"
          : item.problem
          ? "border-clash-line bg-clash-surface text-clash-ink"
          : cx(
              "border-transparent hover:shadow-block-hover",
              COURSE_COLORS[item.slot].block,
              // A phone opens the course screen on tap, so the block keeps its course color there.
              selected && "tablet:border-dashed tablet:border-ink-muted tablet:bg-surface-raised tablet:text-ink tablet:shadow-block-hover tablet:hover:border-ink-muted",
            ),
      )}
      style={style}
    >
      {full ? (
        <>
          <span className={cx("flex min-w-0 items-center", text.title)}>
            {item.locked && <LockSimple aria-hidden className="size-10 shrink-0" />}
            {/* In a narrow lane the section code gives way first, then the course code gets an ellipsis. */}
            <span className={cx("min-w-0 truncate font-700", text.code)}>{item.courseCode}</span>
            <span className={cx("min-w-0 shrink-[50] truncate", text.section)}>{item.sectionCode}</span>
          </span>
          <span className={cx("truncate", text.time)}>{item.choicePreview && "Preview · "}{formatTimeRange(item.start, item.end)}</span>
          {item.location && !item.problem && <span className={cx("truncate opacity-85", text.room)}>{roomName(item.location)}</span>}
        </>
      ) : (
        layout === "line" && (
          <span className="flex min-w-0 items-center gap-2 text-8 leading-10-4">
            {item.locked && <LockSimple aria-hidden className="size-9 shrink-0" />}
            <span className="min-w-0 truncate"><b className="font-700">{item.courseCode}</b> · {clockRange(item.start, item.end)}</span>
          </span>
        )
      )}
    </button>
  );
}
