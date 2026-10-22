"use client";

import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/Button";
import { sectionHeading, sectionsById } from "@/components/sections/sectionDetails";
import { selectChosenSections, usePlanner } from "@/lib/store";
import { focusTutorialTarget } from "./focusTutorialTarget";

export function TutorialSections() {
  const course = usePlanner((state) => state.term?.courses.find((item) => item.code === state.selectedCourse));
  const ready = usePlanner((state) => state.termStatus === "ready" && state.solveStatus === "done" && state.response?.ok === true && !state.response.diagnosis?.unsure);
  const chosen = usePlanner(useShallow(selectChosenSections));
  const sections = course && ready ? sectionsById(course, chosen[course.code] ?? []) : [];

  return (
    <div className="pt-8">
      {course && sections.length > 0 && (
        <>
          <h3 className="text-12 font-650">Section details for {course.code}</h3>
          <p className="pt-5 text-12 text-ink-soft">These are the sections in your displayed schedule. Select another class or browse schedules to compare.</p>
          <div className="flex flex-wrap gap-8 pt-8">
            {sections.map((section) => (
              <Button key={section.id} variant="soft" onClick={() => focusTutorialTarget(`tutorial-section-${encodeURIComponent(section.id)}`)}>
                Find {sectionHeading(section)}
              </Button>
            ))}
          </div>
        </>
      )}
      <p className="pt-8 text-12 text-ink-soft">To keep a schedule, use Save schedule. Then open Saved plans → All saved plans and choose Sections to register for its section identifiers and Copy section list. Use your browser’s Print command to print the list. Register in Workday. You can finish this guide without saving.</p>
    </div>
  );
}
