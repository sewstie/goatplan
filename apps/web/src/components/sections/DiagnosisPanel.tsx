import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import { ButtonLink } from "@/components/ui/ButtonLink";
import type { Course } from "@/lib/data/types";
import type { diagnosisText } from "@/lib/diagnosis/diagnosisText";
import { DiagnosisFixes } from "./DiagnosisFixes";
import { DiagnosisIssueCard } from "./DiagnosisIssueCard";
import { SectionChoiceCard } from "./SectionChoiceCard";
import { CheckAnotherTermButton } from "./CheckAnotherTermButton";
import { ProfessorPicker } from "./ProfessorPicker";

export function DiagnosisPanel({ course, diagnosis, locks }: {
  course?: Course;
  diagnosis: ReturnType<typeof diagnosisText>;
  locks: Readonly<Record<string, readonly string[]>>;
}) {
  const ordered = [...diagnosis.issues].sort((a, b) => Number(b.courses.includes(course?.code ?? "")) - Number(a.courses.includes(course?.code ?? "")));
  const primary = ordered[0];
  const ids = primary?.sectionIds ?? [];
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
          problem={primary.problemSectionIds.includes(section.id)}
          readOnly
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
