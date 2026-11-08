"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "@/components/ui/cx";
import { MODAL_OPEN } from "@/components/ui/useModalDialog";
import { selectViewedCourse, selectViewedSection, usePlanner } from "@/lib/store";
import { COURSE_DETAILS_ID, returnFromDetails } from "./detailsFocus";

type DetailsPanelProps = {
  label: string;
  /** Leaves the panel out while the planner's term can't load, so the calendar takes the width (div.app-2.md). */
  hideOnTermError: boolean;
  children: ReactNode;
};

/** The panel to the right of the calendar, or under it on narrow screens. */
export function DetailsPanel({ label, hideOnTermError, children }: DetailsPanelProps) {
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
    if (course && !firstCourse && status.current) status.current.textContent = `Showing ${[course, sectionCode].filter(Boolean).join(" ")} in ${label}`;
  }, [course, section, sectionCode, label]);

  useEffect(() => {
    const leave = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented && !document.querySelector(MODAL_OPEN) && aside.current?.contains(document.activeElement)) returnFromDetails();
    };
    // On window, the last stop, so a list or disclosure inside can take Escape for itself first.
    window.addEventListener("keydown", leave);
    return () => window.removeEventListener("keydown", leave);
  }, []);

  if ((hideOnTermError && termFailed) || shared) return null;
  return (
    <>
      <p ref={status} role="status" aria-label="Selected course" className="sr-only" />
      <aside
        ref={aside}
        id={COURSE_DETAILS_ID}
        tabIndex={0}
        aria-label={label}
        data-guide-hide={hideOnTermError && !hasCourses ? "" : undefined}
        className={cx(
          "relative hidden flex-col rounded-panel bg-surface px-16 py-20 wide:w-(--size-details) wide:shrink-0 wide:overflow-y-auto",
          // With no courses yet, the calendar gets the whole window on tablet.
          hideOnTermError && !hasCourses ? "wide:flex" : "tablet:flex tablet:empty:hidden",
          // Drawing on a tablet needs the height, since a swipe on the calendar draws instead of scrolling.
          drawing && "max-wide:hidden!",
        )}
      >
        {children}
      </aside>
    </>
  );
}
