"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useShallow } from "zustand/react/shallow";
import type { Course } from "@/lib/data/types";
import { selectChosenSections, usePlanner } from "@/lib/store";
import { CourseListSkeleton } from "./CourseListSkeleton";
import { CourseRow } from "./CourseRow";
import { selectedCourse, useCourseSelection } from "./courseSelection";
import { courseCredits, formatCredits, rowSections, sectionsLine } from "./courseSummary";
import { courseSwatch } from "./courseSwatch";

function EmptyText({ lines }: { lines: [string, string] }) {
  return (
    <p className="px-2 pt-7 pb-8 text-11 leading-18-7 text-ink-muted">
      {lines[0]}
      <br />
      {lines[1]}
    </p>
  );
}

/** "Your courses": the planned courses with their sections, a count and the credit total. */
export function YourCourses({ searchRef }: { searchRef: RefObject<HTMLInputElement | null> }) {
  const termStatus = usePlanner((state) => state.termStatus);
  const term = usePlanner((state) => state.term);
  const codes = usePlanner((state) => state.courses);
  const locks = usePlanner((state) => state.locks);
  const removeCourse = usePlanner((state) => state.removeCourse);
  const chosen = usePlanner(useShallow(selectChosenSections));
  const picked = useCourseSelection((state) => state.selected);
  const select = useCourseSelection((state) => state.select);
  const listRef = useRef<HTMLUListElement>(null);
  const focusAfterRemove = useRef<string | null>(null);

  const ready = termStatus === "ready" && term !== null;
  const courses = ready
    ? codes.flatMap((code) => term.courses.find((course) => course.code === code) ?? [])
    : [];
  const selected = selectedCourse(picked, codes);

  const rows = courses.map((course: Course, position) => {
    const sections = rowSections(course, chosen[course.code], locks[course.code]);
    return { course, position, sections, credits: courseCredits(course, sections) };
  });
  const counted = rows.flatMap((row) => row.credits ?? []);
  const count = `${codes.length} selected${counted.length > 0 ? ` · ${formatCredits(counted.reduce((a, b) => a + b, 0))}` : ""}`;

  useEffect(() => {
    const target = focusAfterRemove.current;
    if (target === null) return;
    focusAfterRemove.current = null;
    const row = listRef.current?.querySelector<HTMLElement>(`[data-course-row="${CSS.escape(target)}"]`);
    (row ?? searchRef.current)?.focus();
  }, [codes, searchRef]);

  function remove(code: string) {
    const index = codes.indexOf(code);
    focusAfterRemove.current = codes[index + 1] ?? codes[index - 1] ?? "";
    removeCourse(code);
  }

  return (
    <section aria-labelledby="your-courses-heading" className="flex shrink-0 flex-col">
      <div className="flex items-end justify-between gap-8 pb-10">
        <h2 id="your-courses-heading" className="text-11 leading-15-95 font-650">
          Your courses
        </h2>
        <span className="text-9 leading-13 font-450 text-ink-muted">{count}</span>
      </div>
      {termStatus === "error" ? (
        <EmptyText lines={["Your courses will appear here", "once sections load."]} />
      ) : !ready ? (
        <CourseListSkeleton />
      ) : rows.length === 0 ? (
        <EmptyText lines={["Your courses will appear here.", "Search above to get started."]} />
      ) : (
        <ul ref={listRef} className="flex flex-col gap-5">
          {rows.map(({ course, position, sections }) => (
            <CourseRow
              key={course.code}
              code={course.code}
              title={course.title}
              sections={sectionsLine(sections)}
              swatch={courseSwatch(position)}
              locked={(locks[course.code]?.length ?? 0) > 0}
              selected={course.code === selected}
              onSelect={() => select(course.code)}
              onRemove={() => remove(course.code)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
