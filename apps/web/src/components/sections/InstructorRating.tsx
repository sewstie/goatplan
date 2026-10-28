import { ArrowSquareOut, GraduationCap, Star } from "@phosphor-icons/react/ssr";
import { rateMyProfessorsUrl } from "@/lib/data";
import { usePlanner } from "@/lib/store";
import { cx } from "@/components/ui/cx";

/** The phone variant sets the name in bold and the review link in muted text. */
export function InstructorRating({ name, dense = false, showLink = true, phone = false }: { name: string; dense?: boolean; showLink?: boolean; phone?: boolean }) {
  const instructor = usePlanner((state) => Object.entries(state.term?.instructors ?? {})
    .find(([key]) => key.trim().toLowerCase() === name.toLowerCase())?.[1]);
  const rating = instructor?.rating;

  return (
    <div role="group" aria-label={showLink ? name : undefined} className={cx("flex flex-col gap-5 border-t border-line", phone ? (dense ? "pt-10" : "pt-14") : dense ? "pt-7" : "pt-9")}>
      <div className="flex items-start justify-between gap-8">
        <span className={cx("flex min-w-0 items-start gap-8 text-10 leading-14-5 text-ink", phone && "font-650")}>
          <GraduationCap aria-hidden className={cx("shrink-0", phone ? "mt-1.5 size-16" : "mt-1 size-12")} />
          {name}
        </span>
        <span className="inline-flex shrink-0 items-center gap-4 text-10 leading-14-5 font-650 text-accent">
          <Star aria-hidden className={phone ? "size-16" : "size-12"} />
          {rating ? rating.score.toFixed(1) : "—"} / 5
        </span>
      </div>
      <div className="flex items-start justify-between gap-5 text-8 leading-12">
        <span className="text-ink-muted">
          {rating ? `${rating.count} ${rating.count === 1 ? "rating" : "ratings"}${instructor?.ratingSource ? ` · ${instructor.ratingSource}` : ""}` : "Rating unavailable"}
        </span>
        {showLink && <a href={rateMyProfessorsUrl(name)} target="_blank" rel="noreferrer"
          className={cx("inline-flex shrink-0 items-center gap-3 rounded-badge hover:underline", phone ? "text-ink-muted hover:text-ink" : "text-accent")}>
          Rate My Professors<span className="sr-only">: {name} (opens in a new tab)</span>
          <ArrowSquareOut aria-hidden className="size-9" />
        </a>}
      </div>
    </div>
  );
}
