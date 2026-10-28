"use client";

import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import { ButtonLink } from "@/components/ui/ButtonLink";
import type { Course } from "@/lib/data/types";
import type { diagnosisText } from "@/lib/diagnosis/diagnosisText";
import { DiagnosisFixes } from "./DiagnosisFixes";
import { DiagnosisIssueCard } from "./DiagnosisIssueCard";
import { SectionChoiceCard } from "./SectionChoiceCard";
import { CheckAnotherTermButton } from "./CheckAnotherTermButton";
import { ProfessorPicker } from "./ProfessorPicker";
import { usePlanner } from "@/lib/store";

export function DiagnosisPanel({ course: selected, diagnosis, locks }: {
  course?: Course;
  diagnosis: ReturnType<typeof diagnosisText>;
  locks: Readonly<Record<string, readonly string[]>>;
}) {
  const term = usePlanner((state) => state.term);
  const ordered = [...diagnosis.issues].sort((a, b) => Number(b.courses.includes(selected?.code ?? "")) - Number(a.courses.includes(selected?.code ?? "")));
  const primary = ordered[0];
  // The selected course only heads the card when the problem involves it.
  const course = selected && (!primary || primary.courses.includes(selected.code))
    ? selected
    : term?.courses.find((item) => item.code === primary?.courses[0]);
  const ids = [...(primary?.sectionIds ?? []), ...(course ? locks[course.code] ?? [] : [])];
  const sections = course?.sections.filter((section) => ids.includes(section.id)) ?? [];
  const waitlist = sections.some((section) => section.status === "waitlist") || primary?.kind === "full";
  return (
    <div className="flex flex-col gap-4">
      <p className="text-9 leading-13 font-650 text-attention">Needs attention</p>
      <h2 tabIndex={-1} className="mt-4 text-21 leading-25-2 font-700 tracking-heading text-ink">{course?.code ?? "No schedule fits"}</h2>
      {course && <p className="text-11 leading-17-6 font-510 text-ink">{course.title}</p>}
      <div className="mt-12 flex flex-col gap-8">
        {ordered.map((issue) => <DiagnosisIssueCard key={issue.key} issue={issue} />)}
      </div>
      {course && sections.map((section) => (
        <SectionChoiceCard
          key={section.id}
          course={course}
          section={section}
          locked={locks[course.code]?.includes(section.id) ?? false}
          problem={primary?.problemSectionIds.includes(section.id) ?? false}
          readOnly={!locks[course.code]?.includes(section.id)}
          onUnlocked={() => document.getElementById("main")?.focus()}
        />
      ))}
      <DiagnosisFixes fixes={diagnosis.fixes} />
      {course && primary && (primary.kind === "pair" || primary.kind === "missing") && <CheckAnotherTermButton code={course.code} />}
      {waitlist && (
        <ButtonLink href="https://workday.wpi.edu" external fullWidth variant="secondary" size="md" icon={<ArrowSquareOut aria-hidden />} className="mt-4">
          Join waitlist in Workday
        </ButtonLink>
      )}
      {course && <ProfessorPicker course={course} />}
    </div>
  );
}
