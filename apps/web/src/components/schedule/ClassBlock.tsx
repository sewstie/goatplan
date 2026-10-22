"use client";

import type { CSSProperties } from "react";
import { LockSimple } from "@phosphor-icons/react/ssr";
import { COURSE_COLORS } from "@/components/ui/courseColors";
import { cx } from "@/components/ui/cx";
import { DAY_NAMES } from "@/lib/data/days";
import { roomName } from "@/lib/data/rooms";
import { formatTimeRange } from "@/lib/data/time";
import { densityClasses } from "./blockStyles";
import type { Density } from "./density";
import type { ClassItem } from "./scheduleItems";

type ClassBlockProps = {
  item: ClassItem;
  density: Density;
  style: CSSProperties;
  selected: boolean;
  onSelect(item: ClassItem): void;
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

export function ClassBlock({ item, density, style, selected, onSelect }: ClassBlockProps) {
  const text = densityClasses[density];
  return (
    <button
      type="button"
      aria-label={`${item.preview ? "Preview, " : ""}${blockLabel(item)}`}
      aria-pressed={selected}
      data-block={item.key}
      data-preview={item.preview || undefined}
      onClick={() => onSelect(item)}
      className={cx(
        "absolute flex cursor-pointer flex-col overflow-hidden rounded-block border text-left transition-[border-color,box-shadow,top,height] duration-180 motion-reduce:transition-none motion-reduce:duration-0",
        text.box,
        item.choicePreview
          ? "border-dashed border-accent bg-preview-surface text-accent"
          : item.problem
          ? cx("border-clash-line bg-clash-surface text-clash-ink", selected && "shadow-selected")
          : selected
          ? "border-accent bg-surface-raised text-ink shadow-selected"
          : cx("border-transparent hover:shadow-block-hover", COURSE_COLORS[item.slot].block),
      )}
      style={style}
    >
      <span className={cx("flex min-w-0 items-center", text.title)}>
        {item.locked && <LockSimple aria-hidden className="size-10 shrink-0" />}
        {/* In a narrow lane the section code gives way first, then the course code gets an ellipsis. */}
        <span className={cx("min-w-0 truncate font-700", text.code)}>{item.courseCode}</span>
        <span className={cx("min-w-0 shrink-[50] truncate", text.section)}>{item.sectionCode}</span>
      </span>
      <span className={cx("truncate", text.time)}>{item.choicePreview && "Preview · "}{formatTimeRange(item.start, item.end)}</span>
      {item.location && !item.problem && <span className={cx("truncate opacity-85", text.room)}>{roomName(item.location)}</span>}
    </button>
  );
}
