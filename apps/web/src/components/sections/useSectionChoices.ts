"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import type { Course } from "@/lib/data/types";
import { selectChosenSections, usePlanner } from "@/lib/store";
import { sectionChoices, type SectionChoices } from "./sectionChoices";
import { sectionsById } from "./sectionDetails";

/** The course's other options that fit around the rest of the shown schedule, or null. */
export function useSectionChoices(course: Course | undefined): SectionChoices | null {
  const term = usePlanner((state) => state.term);
  const chosen = usePlanner(useShallow(selectChosenSections));
  const preferences = usePlanner((state) => state.preferences);

  return useMemo(() => {
    const own = course && chosen[course.code];
    if (!course || !own || !term) return null;
    const rest = Object.entries(chosen).flatMap(([code, ids]) => {
      const other = code === course.code ? undefined : term.courses.find((item) => item.code === code);
      return other ? sectionsById(other, ids) : [];
    });
    return sectionChoices(course, own, rest, preferences);
  }, [course, chosen, term, preferences]);
}
