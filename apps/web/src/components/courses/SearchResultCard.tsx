"use client";

import { useId, useState } from "react";
import { CaretDown, Check, Plus } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import type { Course } from "@/lib/data/types";
import type { CourseFit } from "./courseFit";
import { courseMeta } from "./courseSummary";
import { CourseSections } from "./CourseSections";
import { FitBadge } from "./FitBadge";

type SearchResultCardProps = {
  course: Course;
  fit: CourseFit | null;
  added: boolean;
  onAdd(code: string): void;
};

/** A course in the search results: code, Add, title, sections summary, fit badge, and its sections on request. */
export function SearchResultCard({ course, fit, added, onAdd }: SearchResultCardProps) {
  const [open, setOpen] = useState(false);
  const sectionsId = useId();

  return (
    <li className="flex flex-col gap-4 rounded-control border border-line p-9">
      <div className="flex items-center justify-between gap-8">
        <h3 className="text-11 leading-15-95 font-700">{course.code}</h3>
        <Button
          variant="soft"
          size="xs"
          icon={added ? <Check aria-hidden /> : <Plus aria-hidden />}
          aria-label={added ? `${course.code} added` : `Add ${course.code}`}
          aria-disabled={added || undefined}
          onClick={() => !added && onAdd(course.code)}
          data-result-action
        >
          {added ? "Added" : "Add"}
        </Button>
      </div>
      <p className="text-10 leading-14-5">{course.title}</p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? sectionsId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="-mx-2 flex cursor-pointer items-start justify-between gap-6 rounded-badge px-2 text-left text-9 leading-13-5 text-ink-muted hover:text-ink"
      >
        <span>
          {courseMeta(course)}
          <span className="sr-only">. Sections</span>
        </span>
        <CaretDown aria-hidden className={cx("mt-1 size-11 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {fit && (
        <div className="mt-5 flex">
          <FitBadge fit={fit} />
        </div>
      )}
      {open && <CourseSections id={sectionsId} course={course} />}
    </li>
  );
}
