"use client";

import { usePlanner, selectSavedPlan, selectViewedCourse, selectViewedSchedule } from "@/lib/store";
import { SectionChoiceCard } from "./SectionChoiceCard";
import { PanelIntro } from "./PanelIntro";

export function SavedCourseDetails() {
  const plan = usePlanner(selectSavedPlan);
  const code = usePlanner(selectViewedCourse);
  const schedule = usePlanner(selectViewedSchedule);
  const options = usePlanner((state) => state.term?.courses.find((course) => course.code === code)?.options);
  const saved = schedule?.find((course) => course.code === code);
  if (!plan || !saved) return <PanelIntro />;
  const course = { ...saved, options: options ?? [] };
  const sections = [...saved.sections].sort((a, b) => Number(b.type === "lecture") - Number(a.type === "lecture"));
  return (
    <div className="flex flex-col gap-4">
      <h2 tabIndex={-1} className="text-21 leading-25-2 font-700 tracking-heading text-ink">{saved.code}</h2>
      <p className="text-11 leading-17-6 font-510 text-ink">{saved.title}</p>
      <section aria-label="Sections in this schedule" className="mt-11 flex flex-col gap-4">
        <h3 className="text-10 leading-14-5 font-650 text-ink">Sections in this schedule</h3>
        {sections.map((section) => <SectionChoiceCard key={section.id} course={course} section={section} locked={plan.locks[saved.code]?.includes(section.id) ?? false} readOnly />)}
      </section>
    </div>
  );
}
