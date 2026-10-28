import { lectureInstructorChoices, type Course } from "@/lib/data";

/** Whether picking a lecture professor would leave out some lecture times. */
export function hasProfessorChoice(course: Pick<Course, "sections">): boolean {
  const count = course.sections.filter((section) => section.type === "lecture").length;
  return lectureInstructorChoices(course.sections).some(({ lectureCount }) => lectureCount < count);
}
