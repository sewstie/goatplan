import data from "./exam-credit.json";
import type { DegreeHistory, HistoryCourse } from "./history";

export type ExamProgram = "AP" | "IB";

export interface ExamCourse {
  code: string;
  title?: string;
  credits: number;
  minScore?: number;
}

export interface Exam {
  id: string;
  program: ExamProgram;
  name: string;
  courses: ExamCourse[];
}

export interface ExamProgramRules {
  source: string;
  scores: [number, number];
  minScore: number;
  level?: string;
}

export interface ExamPick {
  examId: string;
  score: number;
}

export interface SkippedExamCourse {
  code: string;
  exam: string;
}

export interface ExamCreditPlan {
  add: HistoryCourse[];
  skipped: SkippedExamCourse[];
}

export const EXAMS = data.exams as Exam[];
export const EXAM_PROGRAMS = data.programs as Record<ExamProgram, ExamProgramRules>;

export const examLabel = ({ program, name }: Exam) => `${program} ${name}${EXAM_PROGRAMS[program].level ? ` ${EXAM_PROGRAMS[program].level}` : ""}`;

export function findExam(id: string): Exam | undefined {
  return EXAMS.find((exam) => exam.id === id);
}

export function examScores(program: ExamProgram): number[] {
  const [low, high] = EXAM_PROGRAMS[program].scores;
  return Array.from({ length: high - low + 1 }, (_, index) => high - index);
}

export function examAward(exam: Exam, score: number): ExamCourse[] {
  return exam.courses.filter((course) => score >= (course.minScore ?? EXAM_PROGRAMS[exam.program].minScore));
}

export function planExamCredit(history: Pick<DegreeHistory, "courses">, picks: readonly ExamPick[], titleOf: (code: string) => string | undefined = () => undefined): ExamCreditPlan {
  const taken = new Set(history.courses.map((course) => course.code));
  const plan: ExamCreditPlan = { add: [], skipped: [] };
  for (const pick of picks) {
    const exam = findExam(pick.examId);
    if (!exam) continue;
    const added = new Map<string, HistoryCourse>();
    for (const course of examAward(exam, pick.score)) {
      const again = added.get(course.code);
      if (again) {
        again.credits += course.credits;
        again.copies = (again.copies ?? 1) + 1;
        continue;
      }
      if (taken.has(course.code)) {
        if (!plan.skipped.some((item) => item.code === course.code && item.exam === examLabel(exam))) plan.skipped.push({ code: course.code, exam: examLabel(exam) });
        continue;
      }
      taken.add(course.code);
      const record: HistoryCourse = {
        code: course.code,
        title: course.title ?? titleOf(course.code) ?? examLabel(exam),
        credits: course.credits,
        status: "taken",
        apIb: true,
        source: "found",
        creditSource: exam.program === "AP" ? "ap" : "ib",
      };
      added.set(course.code, record);
      plan.add.push(record);
    }
  }
  return plan;
}
