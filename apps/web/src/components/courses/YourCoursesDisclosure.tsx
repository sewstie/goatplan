"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { CaretDown } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import { usePlanner } from "@/lib/store";

type YourCoursesDisclosureProps = {
  children: ReactNode;
};

/**
 * The phone-only "Your courses" disclosure (below the tablet breakpoint). It wraps the term picker,
 * search box, search results and the planned courses list. It opens while there are no courses and
 * closes itself once the first course lands, but stays open while the student has opened it by hand.
 * The open state is session-only React state, not part of the planner store.
 */
export function YourCoursesDisclosure({ children }: YourCoursesDisclosureProps) {
  const courses = usePlanner((state) => state.courses);
  const count = courses.length;
  const [open, setOpen] = useState(count === 0);
  // True once the student has opened the panel by hand, so the auto-close on the first course
  // doesn't fight a student who is deliberately working inside an open panel.
  const [manuallyOpened, setManuallyOpened] = useState(false);
  // The count at the last render, kept in state so the open state can react to the edges it crosses.
  const [prevCount, setPrevCount] = useState(count);
  const contentId = useId();
  // While the first-plan guide is up, its steps point at the term picker and search inside here, so
  // the panel has to stay open and keep those targets in the DOM.
  const [guideActive, setGuideActive] = useState(false);

  // Adjust the open state as the course count crosses its edges. Comparing against a state value and
  // setting state during render is the React-sanctioned way to derive state from changing inputs; it
  // folds into the same render without an extra paint or an effect.
  if (prevCount !== count) {
    setPrevCount(count);
    if (count === 0) {
      // Back to an empty plan: reopen and forget the session's manual-open streak.
      setManuallyOpened(false);
      setOpen(true);
    } else if (prevCount === 0 && count === 1 && !manuallyOpened) {
      // The first course arrived with no deliberate open: fold the panel away.
      setOpen(false);
    }
  }

  useEffect(() => {
    if (typeof MutationObserver !== "function") return;
    const check = () => setGuideActive(document.querySelector(".guide-popover") !== null);
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    check();
    return () => observer.disconnect();
  }, []);

  function toggle() {
    setOpen((value) => !value);
    // Opening by hand marks the session, so adding the first course won't snap it shut.
    if (!open) setManuallyOpened(true);
  }

  const expanded = open || guideActive;
  const label = `Your courses${count > 0 ? ` (${count})` : ""}`;
  const codes = courses.join(", ");

  return (
    <div className="flex flex-col tablet:hidden">
      <button
        type="button"
        data-your-courses-disclosure
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={toggle}
        className="flex w-full cursor-pointer items-center justify-between gap-8 rounded-control px-2 py-8 text-left"
      >
        <span className="text-11 leading-15-95 font-650">{label}</span>
        <CaretDown
          aria-hidden
          className={cx("size-12 shrink-0 text-ink-muted transition-transform", expanded && "rotate-180")}
        />
      </button>
      {!expanded && codes && (
        <p className="truncate px-2 pb-8 text-9 leading-13 text-ink-muted">{codes}</p>
      )}
      <div id={contentId} hidden={!expanded} className="flex flex-col">
        {expanded && children}
      </div>
    </div>
  );
}
