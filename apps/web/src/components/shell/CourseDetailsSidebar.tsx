"use client";

import { useEffect, useRef } from "react";
import { CourseDetailsPanel } from "@/components/sections/CourseDetailsPanel";
import { cx } from "@/components/ui/cx";
import { MODAL_OPEN } from "@/components/ui/useModalDialog";
import { selectViewedCourse, selectViewedSection, usePlanner } from "@/lib/store";
import { COURSE_DETAILS_ID, returnFromDetails } from "./detailsFocus";

/** Always open, so the whole week stays in view while checking a class. Under the calendar on a tablet, beside it from the wide breakpoint. */
export function CourseDetailsSidebar() {
  const hasCourses = usePlanner((state) => state.courses.length > 0 || state.savedPlanId !== null);
  const termFailed = usePlanner((state) => state.termStatus === "error");
  const shared = usePlanner((state) => state.temporaryPlan !== null);
  const drawing = usePlanner((state) => state.drawing);
  const course = usePlanner(selectViewedCourse);
  const section = usePlanner(selectViewedSection);
  const sectionCode = usePlanner((state) => state.term?.courses.find((item) => item.code === course)?.sections.find((item) => item.id === section)?.code);
  const aside = useRef<HTMLElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const shownCourse = useRef(course);

  useEffect(() => {
    const newCourse = course !== shownCourse.current;
    const firstCourse = shownCourse.current === null;
    shownCourse.current = course;
    if (!newCourse && !section) return;
    const panel = aside.current;
    if (!panel || panel.checkVisibility?.() === false) return;
    if (newCourse) panel.scrollTop = 0;
    if (section) panel.querySelector(`[data-section="${CSS.escape(section)}"]`)?.scrollIntoView({ block: "nearest" });
    if (course && !firstCourse && status.current) status.current.textContent = `Showing ${[course, sectionCode].filter(Boolean).join(" ")} in Course details`;
  }, [course, section, sectionCode]);

  useEffect(() => {
    const leave = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented && !document.querySelector(MODAL_OPEN) && aside.current?.contains(document.activeElement)) returnFromDetails();
    };
    // On window, the last stop, so a list or disclosure inside can take Escape for itself first.
    window.addEventListener("keydown", leave);
    return () => window.removeEventListener("keydown", leave);
  }, []);

  if (termFailed || shared) return null;

  return (
    <>
      <p ref={status} role="status" aria-label="Selected course" className="sr-only" />
      <aside
        ref={aside}
        id={COURSE_DETAILS_ID}
        tabIndex={0}
        aria-label="Course details"
        data-guide-hide={hasCourses ? undefined : ""}
        // Drawing on a tablet needs the height, since a swipe on the calendar draws instead of scrolling.
        className={cx("relative min-h-0 shrink-0 basis-1/3 overflow-y-auto rounded-panel bg-surface px-14 py-16 wide:w-(--size-course-details) wide:rounded-r-none wide:basis-auto print:hidden", drawing && "max-wide:hidden")}
      >
        <CourseDetailsPanel />
      </aside>
    </>
  );
}
