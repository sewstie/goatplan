import { useId } from "react";
import { InstructorRating } from "@/components/sections/InstructorRating";
import { meetingLines, placeLine, sectionHeading } from "@/components/sections/sectionDetails";
import type { LectureChoice } from "@/components/sections/sectionSteps";
import { cx } from "@/components/ui/cx";
import { isFull, uniqueInstructors } from "@/lib/data";
import { openSeatsShort } from "./phoneSectionText";

/** Another lecture in the Change list, with its professor's rating. Without `onChoose` it can't be picked. */
export function PhoneLectureChoice({ choice: { section, reason }, onChoose }: { choice: LectureChoice; onChoose?: () => void }) {
  const reasonId = useId();
  const place = placeLine(section);
  const times = meetingLines(section, "shared");
  const content = (
    <>
      <span className="flex items-start justify-between gap-8">
        <span className="text-10 font-700">{sectionHeading(section)}</span>
        <span className={cx("shrink-0 text-8 font-570", isFull(section) ? "text-warning" : "text-success")}>{openSeatsShort(section)}</span>
      </span>
      {times.map((line) => <span key={line} className="text-9 text-ink-muted">{line}</span>)}
      {place && <span className="text-9 text-ink-muted">{place.text}</span>}
    </>
  );

  return (
    <li className="flex flex-col gap-12 px-16 py-14">
      {onChoose ? (
        <button type="button" aria-label={`Choose ${sectionHeading(section)}, ${times.join(", ")}`} aria-disabled={!!reason} aria-describedby={reason ? reasonId : undefined}
          onClick={() => { if (!reason) onChoose(); }}
          className={cx("-m-4 flex flex-col gap-2 rounded-badge p-4 text-left", reason ? "cursor-not-allowed text-ink-muted" : "cursor-pointer text-ink hover:text-accent")}>
          {content}
        </button>
      ) : (
        <div className="flex flex-col gap-2 text-ink">{content}</div>
      )}
      {reason && <p id={reasonId} className="text-8 text-ink-muted">{reason}</p>}
      {uniqueInstructors([section]).map((name) => <InstructorRating key={name} name={name} phone dense />)}
    </li>
  );
}
