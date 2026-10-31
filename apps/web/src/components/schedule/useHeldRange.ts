"use client";

import { useState } from "react";
import type { TimeRange } from "./timeRange";

/**
 * While active, the range can grow but not shrink, so the hours stay under the pointer between drags
 * and a repeated drag erases what the last one drew. It follows the given range again once inactive.
 */
export function useHeldRange(range: TimeRange, active: boolean): TimeRange {
  const [held, setHeld] = useState(range);
  const next = active ? { start: Math.min(held.start, range.start), end: Math.max(held.end, range.end) } : range;
  if (next.start !== held.start || next.end !== held.end) setHeld(next);
  return next;
}
