"use client";

import { X } from "@phosphor-icons/react/ssr";
import { ScheduleBrowser } from "@/components/schedule/ScheduleBrowser";
import { CourseDetailsPanel } from "@/components/sections/CourseDetailsPanel";
import { Button } from "@/components/ui/Button";
import { usePlanner } from "@/lib/store";
import { BackLink } from "./BackLink";
import { usePhoneScreen } from "./phoneScreen";

/** One course's details as a full screen, in place of the tablet side panel (div-app-phone-25). */
export function PhoneCourseScreen() {
  return (
    <div className="flex flex-col gap-10">
      <BackLink aside={<ScheduleBrowser compact />} />
      <section data-screen-heading tabIndex={-1} aria-label="Course details" className="outline-none">
        <CourseDetailsPanel />
      </section>
      <RemoveCourseButton />
    </div>
  );
}

/** Removes the open course and goes back to the schedule, where the toast offers Undo. */
function RemoveCourseButton() {
  const code = usePlanner((state) =>
    state.savedPlanId === null && state.termStatus === "ready" && state.selectedCourse && state.courses.includes(state.selectedCourse)
      ? state.selectedCourse
      : null,
  );
  const removeCourse = usePlanner((state) => state.removeCourse);
  const show = usePhoneScreen((state) => state.show);
  if (!code) return null;
  return (
    <Button
      variant="secondary"
      fullWidth
      icon={<X aria-hidden />}
      className="mt-20 min-h-44"
      onClick={() => {
        removeCourse(code);
        show("schedule");
      }}
    >
      Remove {code}
    </Button>
  );
}
