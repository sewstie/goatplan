import { useId } from "react";
import { Clock } from "@phosphor-icons/react/ssr";
import { uniqueInstructors } from "@/lib/data";
import { cx } from "@/components/ui/cx";
import { InstructorRating } from "./InstructorRating";
import { meetingLines, placeLine, sectionHeading, seatsLine } from "./sectionDetails";
import type { LectureChoice } from "./sectionSteps";

export function LectureChoiceRow({ choice: { section, reason }, onChoose }: { choice: LectureChoice; onChoose: () => void }) {
  const reasonId = useId();
  const place = placeLine(section);
  return (
    <li className="rounded-card border border-line bg-surface px-10 pt-13 pb-8">
      <button type="button" aria-label={`Choose ${sectionHeading(section)}`} aria-disabled={!!reason} aria-describedby={reason ? reasonId : undefined}
        onClick={() => { if (!reason) onChoose(); }}
        className={cx("flex w-full flex-col gap-2 rounded-badge text-left", reason ? "cursor-not-allowed text-ink-muted" : "cursor-pointer text-ink hover:text-accent")}>
        <span className="mb-6 text-10 leading-14-5 font-700">{sectionHeading(section)}</span>
        {meetingLines(section).map((line) => (
          <span key={line} className="flex items-start gap-8 text-9 leading-13-5">
            <span aria-hidden className="flex h-13.5 shrink-0 items-center [&_svg]:size-12"><Clock /></span>
            {line}
          </span>
        ))}
        <span className="mt-1 flex items-start justify-between gap-5 text-8 leading-12-8 text-ink-muted">
          <span title={place && place.full !== place.text ? place.full : undefined} className="min-w-0">{place?.text}</span>
          <span className="shrink-0">{seatsLine(section)}</span>
        </span>
      </button>
      {reason && <p id={reasonId} className="mt-5 text-8 leading-12 text-ink-muted">{reason}</p>}
      <div className="mt-8 flex flex-col gap-7 border-t border-line pt-8 empty:hidden">
        {uniqueInstructors([section]).map((name) => <InstructorRating key={name} name={name} dense showLink={false} />)}
      </div>
    </li>
  );
}
