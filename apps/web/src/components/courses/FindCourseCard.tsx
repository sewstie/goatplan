"use client";

import { useId, useState } from "react";
import { Check, GraduationCap, Plus } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Course } from "@/lib/data/types";
import type { CourseFit } from "./courseFit";
import { courseMeta } from "./courseSummary";
import { CourseSections } from "./CourseSections";
import { FitBadge } from "./FitBadge";

type FindCourseCardProps = {
  course: Course;
  fit: CourseFit | null;
  added: boolean;
  countsToward?: readonly string[];
  onAdd(code: string): void;
};

export function FindCourseCard({ course, fit, added, countsToward, onAdd }: FindCourseCardProps) {
  const [open, setOpen] = useState(false);
  const sectionsId = useId();
  return (
    <li className="flex flex-col rounded-panel border border-card-line bg-surface px-20 pt-18 pb-18">
      <div className="flex items-center justify-between gap-12">
        <h3 className="text-14 leading-22 font-650">{course.code}</h3>
        <Button
          size="md"
          variant={added ? "secondary" : "primary"}
          className="min-h-38 px-14"
          icon={added ? <Check aria-hidden /> : <Plus aria-hidden />}
          aria-label={added ? `${course.code} added` : `Add ${course.code}`}
          aria-disabled={added || undefined}
          onClick={() => !added && onAdd(course.code)}
          data-result-action
        >
          {added ? "Added" : "Add"}
        </Button>
      </div>
      <p className="pt-4 text-10 leading-17-5">{course.title}</p>
      <button type="button" aria-expanded={open} aria-controls={open ? sectionsId : undefined} onClick={() => setOpen(!open)} className="cursor-pointer self-start rounded-badge pt-8 text-left text-8 leading-14-4 text-ink-muted hover:text-ink">
        {courseMeta(course)}
        <span className="sr-only">. Sections</span>
      </button>
      {(fit || countsToward) && (
        <div className="flex flex-wrap gap-6 pt-12">
          {fit && <FitBadge fit={fit} />}
          {countsToward?.map((name) => (
            <Badge key={name} tone="accent" className="gap-5 whitespace-normal!">
              <GraduationCap aria-hidden className="size-13 text-ink" />
              <span className="sr-only">Counts toward: </span>
              {name}
            </Badge>
          ))}
        </div>
      )}
      {open && <CourseSections id={sectionsId} course={course} />}
    </li>
  );
}
