export interface Lane {
  lane: number;
  lanes: number;
}

/**
 * Items of one day that overlap share the column side by side (div.app-7.md). Each item gets the first
 * free lane; every item in a group of overlapping items gets the group's lane count.
 */
export function assignLanes<T extends { start: number; end: number }>(items: readonly T[]): Map<T, Lane> {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
  const result = new Map<T, Lane>();
  let group: T[] = [];
  let laneEnds: number[] = [];
  let groupEnd = -Infinity;

  const closeGroup = () => {
    for (const item of group) result.set(item, { lane: result.get(item)!.lane, lanes: laneEnds.length });
    group = [];
    laneEnds = [];
  };

  for (const item of sorted) {
    if (item.start >= groupEnd) closeGroup();
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) lane = laneEnds.push(item.end) - 1;
    else laneEnds[lane] = item.end;
    result.set(item, { lane, lanes: 0 });
    group.push(item);
    groupEnd = group.length === 1 ? item.end : Math.max(groupEnd, item.end);
  }
  closeGroup();
  return result;
}
