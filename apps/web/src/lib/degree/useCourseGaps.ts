"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Course } from "@/lib/data/types";
import { useDegreeEnabled } from "@/lib/flags";
import { getGapSource, type CourseGaps } from "./courseGaps";

const subscribe = (listener: () => void) => getGapSource().subscribe(listener);
const getSnapshot = () => getGapSource().getSnapshot();
const stayQuiet = () => () => {};
const nothing = () => null;

export function useCourseGaps(courses: readonly Course[] | null, planned: readonly string[]): CourseGaps | null {
  const enabled = useDegreeEnabled();
  const gaps = useSyncExternalStore(enabled ? subscribe : stayQuiet, enabled ? getSnapshot : nothing, nothing);

  useEffect(() => {
    if (enabled && courses) getGapSource().setOpenTerm({ courses, planned });
  }, [enabled, courses, planned]);

  return gaps;
}
