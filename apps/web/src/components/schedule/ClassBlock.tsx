"use client";

import type { CSSProperties } from "react";
import { LockSimple } from "@phosphor-icons/react/ssr";
import { DAY_NAMES } from "@/lib/data/days";
import { formatTimeRange } from "@/lib/data/time";
import { cx } from "@/components/ui/cx";
import { densityClasses } from "./blockStyles";
import { blockClasses } from "./coursePalette";
import type { Density } from "./density";
import type { ClassItem } from "./scheduleItems";

type ClassBlockProps = {
  item: ClassItem;
  density: Density;
  style: CSSProperties;
  selected: boolean;
  onSelect(item: ClassItem): void;
  onShowDetails(item: ClassItem, block: HTMLElement): void;
  onHideDetails(): void;
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

export function ClassBlock({ item, density, style, selected, onSelect, onShowDetails, onHideDetails }: ClassBlockProps) {
  const text = densityClasses[density];
  return (
    <button
      type="button"
      aria-label={blockLabel(item)}
      aria-pressed={selected}
      data-block={item.key}
      onClick={() => onSelect(item)}
      onPointerEnter={(event) => onShowDetails(item, event.currentTarget)}
      onPointerLeave={onHideDetails}
      onFocus={(event) => onShowDetails(item, event.currentTarget)}
      onBlur={onHideDetails}
      className={cx(
        "absolute flex cursor-pointer flex-col overflow-hidden rounded-block border text-left transition-[border-color,box-shadow]",
        text.box,
        selected
          ? "border-accent bg-surface-raised text-ink shadow-selected"
          : cx("border-transparent hover:shadow-block-hover", blockClasses[item.slot]),
      )}
      style={style}
    >
      <span className={cx("flex min-w-0 items-center", text.title)}>
        {item.locked && <LockSimple aria-hidden className="size-10 shrink-0" />}
        {/* In a narrow lane the section code gives way first, then the course code gets an ellipsis. */}
        <span className={cx("min-w-0 truncate font-700", text.code)}>{item.courseCode}</span>
        <span className={cx("min-w-0 shrink-[50] truncate", text.section)}>{item.sectionCode}</span>
      </span>
      <span className={cx("truncate", text.time)}>{formatTimeRange(item.start, item.end)}</span>
      {item.location && <span className={cx("truncate opacity-85", text.room)}>{item.location}</span>}
    </button>
  );
}
