"use client";

import { cx } from "@/components/ui/cx";
import { Listbox, type ListboxOption } from "@/components/ui/Listbox";
import { lectureInstructors, type Course } from "@/lib/data";
import { usePlanner } from "@/lib/store";
import { hasProfessorChoice } from "./professorChoice";

/** "Lecture professor": limits the course's lectures to one professor. The phone gets the bigger top-bar style. */
export function ProfessorPicker({ course, phone = false }: { course: Course; phone?: boolean }) {
  const name = usePlanner((state) => state.professorByCourse[course.code] ?? null);
  const setProfessor = usePlanner((state) => state.setProfessor);
  const ready = usePlanner((state) => state.termStatus === "ready");
  const instructors = lectureInstructors(course.sections);
  if (!name && !hasProfessorChoice(course)) return null;
  const options: ListboxOption[] = [
    { value: "", label: "Any professor" },
    ...instructors.map((name) => ({ value: name, label: name })),
  ];
  if (name && !options.some((option) => option.value.toLowerCase() === name.toLowerCase())) options.push({ value: name, label: name });
  const value = options.find((option) => option.value.toLowerCase() === name?.toLowerCase())?.value ?? "";
  const compatible = course.sections.some((section) => section.type === "lab") && course.sections.some((section) => section.type === "discussion");

  return (
    <div className={cx("flex flex-col gap-5", phone ? "mt-16" : "mt-7")}>
      <div className="flex items-end justify-between">
        <label id="lecture-professor-label" htmlFor="tutorial-professor" className="text-10 leading-14-5 font-650 text-ink">Lecture professor</label>
        {instructors.length > 1 && <span className="text-8 leading-11-6 text-ink-muted">Optional</span>}
      </div>
      <Listbox
        key={course.code}
        id="tutorial-professor"
        variant={phone ? "pill" : "field"}
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
      <div data-guide-slot="professor" className="empty:hidden" />
    </div>
  );
}
