import { ArrowSquareOut, GraduationCap, Star } from "@phosphor-icons/react/ssr";
import { rateMyProfessorsUrl } from "@/lib/data";
import { usePlanner } from "@/lib/store";
import { cx } from "@/components/ui/cx";

export function InstructorRating({ name, dense = false }: { name: string; dense?: boolean }) {
  const instructor = usePlanner((state) => Object.entries(state.term?.instructors ?? {})
    .find(([key]) => key.trim().toLowerCase() === name.toLowerCase())?.[1]);
  const rating = instructor?.rating;

  return (
    <div role="group" aria-label={name} className={cx("flex flex-col gap-5 border-t border-line", dense ? "pt-7" : "pt-9")}>
      <div className="flex items-start justify-between gap-8">
        <span className="flex min-w-0 items-start gap-8 text-10 leading-14-5 text-ink">
          <GraduationCap aria-hidden className="mt-1 size-12 shrink-0" />
          {name}
        </span>
        <span className="inline-flex shrink-0 items-center gap-4 text-10 leading-14-5 font-650 text-accent">
          <Star aria-hidden className="size-12" />
          {rating ? rating.score.toFixed(1) : "—"} / 5
        </span>
      </div>
      <div className="flex items-start justify-between gap-5 text-8 leading-12">
        <span className="text-ink-muted">
          {rating ? `${rating.count} ${rating.count === 1 ? "rating" : "ratings"}${instructor?.ratingSource ? ` · ${instructor.ratingSource}` : ""}` : "Rating unavailable"}
        </span>
        <a href={rateMyProfessorsUrl(name)} target="_blank" rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-3 rounded-badge text-accent hover:underline">
          Rate My Professors<span className="sr-only">: {name} (opens in a new tab)</span>
          <ArrowSquareOut aria-hidden className="size-9" />
        </a>
      </div>
    </div>
  );
}
