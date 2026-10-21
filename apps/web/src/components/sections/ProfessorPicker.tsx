"use client";

import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import { Select } from "@/components/ui/Select";
import { lectureInstructors, rateMyProfessorsUrl, type Course } from "@/lib/data";
import { usePlanner } from "@/lib/store";

export function ProfessorPicker({ course }: { course: Course }) {
  const name = usePlanner((state) => state.professorByCourse[course.code] ?? null);
  const setProfessor = usePlanner((state) => state.setProfessor);
  const notice = usePlanner((state) => state.professorNotice?.course === course.code ? state.professorNotice : null);
  const ready = usePlanner((state) => state.termStatus === "ready");
  const instructors = lectureInstructors(course.sections);
  if (!course.sections.some((section) => section.type === "lecture") || (instructors.length === 0 && !name)) return null;
  const options = [...instructors];
  if (name && !options.some((instructor) => instructor.toLowerCase() === name.toLowerCase())) options.push(name);
  const value = options.find((instructor) => instructor.toLowerCase() === name?.toLowerCase()) ?? "";

  return (
    <div className="mt-12 flex flex-col gap-4">
      <Select
        variant="box"
        label="Professor"
        hideLabel={false}
        options={[{ value: "", label: "Any professor" }, ...options.map((instructor) => ({ value: instructor, label: instructor }))]}
        value={value}
        disabled={!ready}
        onChange={(event) => setProfessor(course.code, event.target.value || null)}
      />
      {notice && <p role="status" className="text-10 leading-17-5 text-ink-muted">Unlocked {notice.sections.join(", ")} for this professor.</p>}
      {name && <a
        href={rateMyProfessorsUrl(name)}
        target="_blank"
        rel="noreferrer"
        className="mt-7.5 inline-flex items-center gap-5 self-start rounded-badge text-10 leading-14-5 text-accent hover:underline"
      >
        Rate My Professors
        <span className="sr-only">: {name} (opens in a new tab)</span>
        <ArrowSquareOut aria-hidden className="size-12" />
      </a>}
    </div>
  );
}
