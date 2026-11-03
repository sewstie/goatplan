import { useEffect, useId } from "react";
import { Clock, GraduationCap } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/Badge";
import { cx } from "@/components/ui/cx";
import { uniqueInstructors } from "@/lib/data";
import { meetingLines, placeLine, sectionHeading, seatsLine } from "./sectionDetails";
import type { LectureChoice } from "./sectionSteps";
import { useSectionPreview } from "./sectionPreview";

/** Another lecture, styled and previewed like a lab or discussion choice. One that can't be chosen says why and isn't previewed. */
export function LectureChoiceRow({ courseCode, choice: { section, reason }, onChoose }: { courseCode: string; choice: LectureChoice; onChoose: () => void }) {
  const reasonId = useId();
  const previewing = useSectionPreview((state) => state.courseCode === courseCode && state.sectionId === section.id);
  const start = useSectionPreview((state) => state.start);
  const end = useSectionPreview((state) => state.end);
  useEffect(() => () => end(section.id), [end, section.id]);
  const place = placeLine(section);
  const preview = () => { if (!reason) start(courseCode, section.id); };

  return (
    <li>
      <button
        type="button"
        aria-label={`Choose ${sectionHeading(section)}`}
        aria-disabled={!!reason}
        aria-describedby={reason ? reasonId : undefined}
        onClick={() => { if (!reason) onChoose(); }}
        onMouseEnter={preview}
        onFocus={preview}
        onMouseLeave={() => end(section.id)}
        onBlur={() => end(section.id)}
        className={cx(
          "flex w-full flex-col gap-2 rounded-card border px-10 pt-13 pb-8 text-left",
          reason ? "cursor-not-allowed border-line bg-surface" : "cursor-pointer",
          !reason && (previewing ? "border-dashed border-accent bg-choice-preview" : "border-line bg-surface hover:bg-surface-selected"),
        )}
      >
        <span className="mb-6 flex items-center justify-between gap-8">
          <span className={cx("text-10 leading-14-5 font-700", reason ? "text-ink-muted" : "text-ink")}>{sectionHeading(section)}</span>
          {previewing && <span className="-my-3 flex"><Badge tone="accent" size="sm">Previewing</Badge></span>}
        </span>
        {meetingLines(section).map((line) => (
          <span key={line} className={cx("flex items-start gap-8 text-9 leading-13-5", reason ? "text-ink-muted" : "text-ink")}>
            <span aria-hidden className="flex h-13.5 shrink-0 items-center [&_svg]:size-12"><Clock /></span>
            {line}
          </span>
        ))}
        <span className="mt-1 flex items-start justify-between gap-5 text-8 leading-12-8 text-ink-muted">
          <span title={place && place.full !== place.text ? place.full : undefined} className="min-w-0">{place?.text}</span>
          <span className="shrink-0">{seatsLine(section)}</span>
        </span>
        {reason && <span id={reasonId} className="mt-3 text-8 leading-12 text-ink-muted">{reason}</span>}
        {uniqueInstructors([section]).map((name) => (
          <span key={name} className="mt-6 flex min-w-0 items-start gap-8 border-t border-line pt-7 text-10 leading-14-5 text-ink">
            <GraduationCap aria-hidden className="mt-1 size-12 shrink-0" />
            {name}
          </span>
        ))}
      </button>
    </li>
  );
}
