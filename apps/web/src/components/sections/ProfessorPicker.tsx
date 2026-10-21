"use client";

import { Select } from "@/components/ui/Select";
import { lectureInstructors, type Course } from "@/lib/data";
import { usePlanner } from "@/lib/store";

export function ProfessorPicker({ course }: { course: Course }) {
  const name = usePlanner((state) => state.professorByCourse[course.code] ?? null);
  const setProfessor = usePlanner((state) => state.setProfessor);
  const ready = usePlanner((state) => state.termStatus === "ready");
  const instructors = lectureInstructors(course.sections);
  if (!name && (!course.sections.some((section) => section.type === "lecture") || instructors.length === 0)) return null;
  const options = [...instructors];
  if (name && !options.some((instructor) => instructor.toLowerCase() === name.toLowerCase())) options.push(name);
  const value = options.find((instructor) => instructor.toLowerCase() === name?.toLowerCase()) ?? "";
  const compatible = course.sections.some((section) => section.type === "lab") && course.sections.some((section) => section.type === "discussion");

  return (
    <div className="mt-7 flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <label id="lecture-professor-label" htmlFor="tutorial-professor" className="text-10 leading-14-5 font-650 text-ink">Lecture professor</label>
        {instructors.length > 1 && <span className="text-8 leading-11-6 text-ink-muted">Optional</span>}
      </div>
      <Select
        id="tutorial-professor"
        variant="box"
        className="min-h-36.5"
        label="Lecture professor"
        aria-labelledby="lecture-professor-label"
        options={[{ value: "", label: "Any professor" }, ...options.map((instructor) => ({ value: instructor, label: instructor }))]}
        value={value}
        aria-describedby="lecture-professor-hint"
        disabled={!ready}
        onChange={(event) => setProfessor(course.code, event.target.value || null)}
      />
      <p id="lecture-professor-hint" className="text-9 leading-13-95 text-ink-muted">
        {compatible ? "Filters lectures only. Compatible labs and discussions can have other instructors." : "Filters lectures only. Labs and discussions can have other instructors."}
      </p>
    </div>
  );
}
