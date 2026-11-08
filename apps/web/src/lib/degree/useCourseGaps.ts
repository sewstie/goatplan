"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Course } from "@/lib/data/types";
import { getGapSource, type CourseGaps } from "./courseGaps";

const subscribe = (listener: () => void) => getGapSource().subscribe(listener);
const getSnapshot = () => getGapSource().getSnapshot();
const nothing = () => null;

export function useCourseGaps(courses: readonly Course[] | null, planned: readonly string[]): CourseGaps | null {
  const gaps = useSyncExternalStore(subscribe, getSnapshot, nothing);

  useEffect(() => {
    if (courses) getGapSource().setOpenTerm({ courses, planned });
  }, [courses, planned]);

  return gaps;
}
