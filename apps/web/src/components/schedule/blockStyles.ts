import type { CSSProperties } from "react";
import type { Density } from "./density";
import type { Lane } from "./lanes";
import { percentOf, type TimeRange } from "./timeRange";

/** Text sizes of a class block at each density. A phone is always regular, so compact has no phone sizes. */
export const densityClasses: Readonly<
  Record<Density, { box: string; title: string; code: string; section: string; time: string; room: string }>
> = {
  regular: {
    box: "gap-3 px-7 py-6 tablet:gap-0 tablet:px-4 tablet:py-1",
    title: "gap-4",
    code: "text-10 leading-13 tablet:text-9 tablet:leading-12",
    section: "text-8 leading-10-4",
    time: "mt-1 text-8 leading-10-4 tablet:mt-0",
    room: "text-7-5 leading-9-75 tablet:hidden",
  },
  compact: {
    box: "px-4 py-2",
    title: "gap-4",
    code: "text-9 leading-12",
    section: "text-8 leading-12",
    time: "text-8 leading-12",
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
