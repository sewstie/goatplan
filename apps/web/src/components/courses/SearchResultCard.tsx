"use client";

import { Check, Plus } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Course } from "@/lib/data/types";
import type { CourseFit } from "./courseFit";
import { formatCredits } from "./courseSummary";
import { FitBadge } from "./FitBadge";

type SearchResultCardProps = {
  course: Course;
  fit: CourseFit | null;
  added: boolean;
  countsToward?: readonly string[];
  onAdd(code: string): void;
};

/** A course in the search results: code, Add, title, credits and fit badge. */
export function SearchResultCard({ course, fit, added, countsToward, onAdd }: SearchResultCardProps) {
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
      {course.credits !== null && <p className="text-9 leading-13-5 text-ink-muted">{formatCredits(course.credits)}</p>}
      {fit && (
        <div className="mt-5 flex">
          <FitBadge fit={fit} />
        </div>
      )}
      {countsToward && (
        <div className="flex flex-wrap gap-4">
          {countsToward.map((name) => <Badge key={name} tone="accent" className="whitespace-normal!">Counts toward: {name}</Badge>)}
        </div>
      )}
    </li>
  );
}
