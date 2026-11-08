"use client";

import { Check } from "@phosphor-icons/react/ssr";
import { ListboxField } from "@/components/ui/ListboxField";
import { examScores, unitLabel, type Exam, type ExamCreditPlan, type ExamProgram } from "@/lib/degree";
import { ChoiceChips } from "./ChoiceChips";

export type ExamChoice = { examId: string; score: number | null };

type ExamCreditFieldsProps = {
  program: ExamProgram;
  exams: readonly Exam[];
  pick: ExamChoice;
  plan: ExamCreditPlan | null;
  onPick(pick: ExamChoice): void;
  onTypeInstead(): void;
};

export function ExamCreditFields({ program, exams, pick, plan, onPick, onTypeInstead }: ExamCreditFieldsProps) {
  const scores = examScores(program).map((score) => ({ value: String(score), label: String(score) }));
  return (
    <div className="flex flex-col gap-16 pt-18">
      <ListboxField label={`${program} exam`} value={pick.examId} options={[{ value: "", label: "Choose your exam" }, ...exams.map((exam) => ({ value: exam.id, label: exam.name }))]} onChange={(examId) => onPick({ ...pick, examId })} />
      <ChoiceChips label="Score" options={scores} value={pick.score === null ? "" : String(pick.score)} onChange={(score) => onPick({ ...pick, score: Number(score) })} />
      {plan && (
        <section aria-label="What this exam earns" className="rounded-card border border-card-line px-14 py-12">
          {plan.add.length > 0 ? (
            <>
              <h3 className="pb-6 text-8-5 leading-16 font-650">Counts as</h3>
              <ul>
                {plan.add.map((course) => (
                  <li key={course.code} className="flex items-center gap-8 border-b border-line py-7 last:border-b-0">
                    <Check aria-hidden weight="bold" className="size-12 shrink-0 text-success-ink" />
                    <span className="text-9 leading-15 font-650">{course.code}{course.copies ? ` ×${course.copies}` : ""}</span>
                    <span className="min-w-0 flex-1 truncate text-8 leading-12 text-ink-muted">{course.title}</span>
                    <span className="text-8 leading-12 text-ink-muted">{unitLabel(course.credits)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : plan.skipped.length === 0 ? (
            <p className="text-8-5 leading-16 text-ink-muted">A score of {pick.score} doesn’t earn WPI credit for this exam.</p>
          ) : null}
          {plan.skipped.map((course) => <p key={course.code} className="pt-4 text-8 leading-12 text-ink-muted">{course.code} is already in your history.</p>)}
        </section>
      )}
      <button type="button" onClick={onTypeInstead} className="cursor-pointer self-start rounded-badge text-8-5 leading-16 font-570 text-accent hover:underline">My exam isn’t listed. Enter the course instead</button>
    </div>
  );
}
