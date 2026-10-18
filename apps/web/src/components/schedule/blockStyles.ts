import type { CSSProperties } from "react";
import type { Density } from "./density";
import type { Lane } from "./lanes";
import { percentOf, type TimeRange } from "./timeRange";

/** Text sizes of a class block at each density (div.app-6.md, div.app-17.md). */
export const densityClasses: Readonly<
  Record<Density, { box: string; title: string; code: string; section: string; time: string; room: string }>
> = {
  regular: {
    box: "gap-3 px-7 py-6",
    title: "gap-4",
    code: "text-10 leading-13",
    section: "text-8 leading-10-4",
    time: "mt-1 text-8 leading-10-4",
    room: "text-7-5 leading-9-75",
  },
  compact: {
    box: "gap-2 px-5 py-3",
    title: "gap-4",
    code: "text-9 leading-10-8",
    section: "text-8 leading-9-6",
    time: "text-7-5 leading-9",
    room: "text-7 leading-8-4",
  },
  dense: {
    box: "gap-2 px-4 py-3",
    title: "gap-2",
    code: "text-8 leading-10-4",
    section: "text-6-5 leading-8-45",
    time: "text-6-8 leading-8-84",
    room: "hidden",
  },
};

const INSET = 3;
const LANE_GAP = 2;

/**
 * Where an item sits in its day column: 3px in from both sides, side by side with items it overlaps.
 * Class blocks end 3px early so back-to-back classes don't touch (div.app-3.md).
 */
export function blockPosition(range: TimeRange, item: { start: number; end: number }, lane: Lane, endGap = 3): CSSProperties {
  const top = percentOf(range, item.start);
  const height = percentOf(range, item.end) - top;
  const taken = INSET * 2 + (lane.lanes - 1) * LANE_GAP;
  const width = `((100% - ${taken}px) / ${lane.lanes})`;
  return {
    top: `${top}%`,
    height: `calc(${height}% - ${endGap}px)`,
    left: `calc(${INSET}px + ${lane.lane} * (${width} + ${LANE_GAP}px))`,
    width: `calc${width}`,
  };
}
