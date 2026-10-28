import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import { rateMyProfessorsUrl, showsInstructor, uniqueInstructors } from "@/lib/data";
import type { Course } from "@/lib/data/types";
import { SectionItem } from "./SectionItem";

/** Every section of a course, then a Rate My Professors link for each instructor. */
export function CourseSections({ id, course }: { id: string; course: Course }) {
  const instructors = uniqueInstructors(course.sections.filter(showsInstructor));

  return (
    <div id={id} className="mt-5 flex flex-col gap-10 border-t border-line pt-10">
      <ul aria-label={`Sections of ${course.code}`} className="flex flex-col gap-10">
        {course.sections.map((section) => (
          <SectionItem key={section.id} section={section} />
        ))}
      </ul>
      {instructors.length > 0 && (
        <ul aria-label="Rate My Professors" className="flex flex-col gap-4">
          {instructors.map((name) => (
            <li key={name}>
              <a
                href={rateMyProfessorsUrl(name)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-5 rounded-badge text-10 leading-14-5 text-accent hover:underline"
              >
                {instructors.length === 1 ? "Rate My Professors" : `${name} on Rate My Professors`}
                <ArrowSquareOut aria-hidden className="size-12 shrink-0" />
                <span className="sr-only">
                  {instructors.length === 1 && ` for ${name}`} (opens in a new tab)
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
