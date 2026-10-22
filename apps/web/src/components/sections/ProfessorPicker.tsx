"use client";

import { Listbox, type ListboxOption } from "@/components/ui/Listbox";
import { lectureInstructorChoices, type Course } from "@/lib/data";
import { usePlanner } from "@/lib/store";

export function ProfessorPicker({ course }: { course: Course }) {
  const name = usePlanner((state) => state.professorByCourse[course.code] ?? null);
  const setProfessor = usePlanner((state) => state.setProfessor);
  const ready = usePlanner((state) => state.termStatus === "ready");
  const instructors = lectureInstructorChoices(course.sections);
  if (!name && (!course.sections.some((section) => section.type === "lecture") || instructors.length === 0)) return null;
  const count = course.sections.filter((section) => section.type === "lecture").length;
  const options: ListboxOption[] = [
    { value: "", label: "Any professor", description: `All ${count} lecture times` },
    ...instructors.map(({ name, lectureCount, coTaughtCount }) => ({
      value: name,
      label: name,
      description: coTaughtCount === lectureCount
        ? `${lectureCount} co-taught lecture${lectureCount === 1 ? "" : "s"}`
        : `${lectureCount} lecture time${lectureCount === 1 ? "" : "s"}${coTaughtCount > 0 ? " · includes co-teaching" : ""}`,
    })),
  ];
  if (name && !options.some((option) => option.value.toLowerCase() === name.toLowerCase())) options.push({ value: name, label: name });
  const value = options.find((option) => option.value.toLowerCase() === name?.toLowerCase())?.value ?? "";
  const compatible = course.sections.some((section) => section.type === "lab") && course.sections.some((section) => section.type === "discussion");

  return (
    <div className="mt-7 flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <label id="lecture-professor-label" htmlFor="tutorial-professor" className="text-10 leading-14-5 font-650 text-ink">Lecture professor</label>
        {instructors.length > 1 && <span className="text-8 leading-11-6 text-ink-muted">Optional</span>}
      </div>
      <Listbox
        key={course.code}
        id="tutorial-professor"
        label="Lecture professor"
        aria-labelledby="lecture-professor-label"
        options={options}
        value={value}
        aria-describedby="lecture-professor-hint"
        disabled={!ready}
        onChange={(value) => setProfessor(course.code, value || null)}
      />
      <p id="lecture-professor-hint" className="text-9 leading-13-95 text-ink-muted">
        {compatible ? "Filters lectures only. Compatible labs and discussions can have other instructors." : "Filters lectures only. Labs and discussions can have other instructors."}
      </p>
    </div>
  );
}
