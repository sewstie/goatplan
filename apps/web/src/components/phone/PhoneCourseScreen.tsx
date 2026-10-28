"use client";

import { Trash } from "@phosphor-icons/react/ssr";
import { CourseDetailsPanel } from "@/components/sections/CourseDetailsPanel";
import { Button } from "@/components/ui/Button";
import { usePlanner } from "@/lib/store";
import { BackLink } from "./BackLink";
import { PhoneCourseDetails } from "./PhoneCourseDetails";
import { usePhoneScreen } from "./phoneScreen";

/** One course's details as a full screen, in place of the tablet side panel (phone-fix-1 to 4). */
export function PhoneCourseScreen() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <BackLink />
      <section data-screen-heading tabIndex={-1} aria-label="Course details" className="outline-none">
        <CourseDetailsPanel renderCourse={(course) => <PhoneCourseDetails key={course.code} course={course} />} />
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
    <div className="mt-auto pt-24">
      <Button
        variant="secondary"
        fullWidth
        icon={<Trash aria-hidden />}
        className="min-h-44"
        aria-label={`Remove course ${code}`}
        onClick={() => {
          removeCourse(code);
          show("schedule");
        }}
      >
        Remove course
      </Button>
    </div>
  );
}
