"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import type { Course } from "@/lib/data/types";
import { selectChosenSections, usePlanner } from "@/lib/store";
import { sectionsById } from "./sectionDetails";
import { sectionSteps } from "./sectionSteps";

const NONE: string[] = [];

export function useSectionSteps(course: Course) {
  const term = usePlanner((state) => state.term);
  const chosen = usePlanner(useShallow(selectChosenSections));
  const locked = usePlanner((state) => state.locks[course.code] ?? NONE);
  const preferences = usePlanner((state) => state.preferences);
  const professor = usePlanner((state) => state.professorByCourse[course.code]);

  return useMemo(() => {
    const rest = Object.entries(chosen).flatMap(([code, ids]) => {
      const other = code === course.code ? undefined : term?.courses.find((item) => item.code === code);
      return other ? sectionsById(other, ids) : [];
    });
    return sectionSteps(course, chosen[course.code] ?? NONE, locked, rest, { ...preferences, professor });
  }, [course, term, chosen, locked, preferences, professor]);
}
