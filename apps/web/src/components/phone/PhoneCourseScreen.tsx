"use client";

import { CourseDetailsPanel } from "@/components/sections/CourseDetailsPanel";
import { RemoveCourseButton } from "@/components/sections/RemoveCourseButton";
import { BackLink } from "./BackLink";
import { PhoneCourseDetails } from "./PhoneCourseDetails";
import { usePhoneScreen } from "./phoneScreen";

/** One course's details as a full screen, in place of the tablet side panel (phone-fix-1 to 4). */
export function PhoneCourseScreen() {
  const show = usePhoneScreen((state) => state.show);
  return (
    <div className="flex flex-1 flex-col gap-6">
      <BackLink />
      <section data-screen-heading tabIndex={-1} aria-label="Course details" className="outline-none">
        <CourseDetailsPanel renderCourse={(course) => <PhoneCourseDetails key={course.code} course={course} />} />
      </section>
      <div className="mt-auto pt-24 empty:hidden">
        <RemoveCourseButton className="min-h-44" onRemoved={() => show("schedule")} />
      </div>
    </div>
  );
}
