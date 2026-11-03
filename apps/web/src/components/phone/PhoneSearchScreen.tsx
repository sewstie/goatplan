"use client";

import { useEffect } from "react";
import { CourseSearchPanel } from "@/components/courses/CourseSearchPanel";
import { BackLink } from "./BackLink";

/** "Find a course": the search box, its results and the planned courses (div-app-phone-4). */
export function PhoneSearchScreen() {
  useEffect(() => {
    document.getElementById("tutorial-search")?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="flex flex-col">
      <BackLink />
      <h1 data-screen-heading tabIndex={-1} className="pt-6 text-25 leading-30 font-700 tracking-title outline-none">
        Find a course
      </h1>
      <p className="pt-6 pb-16 text-9 text-ink-muted">Add courses. GoatPlan finds sections that fit.</p>
      <CourseSearchPanel />
    </div>
  );
}
