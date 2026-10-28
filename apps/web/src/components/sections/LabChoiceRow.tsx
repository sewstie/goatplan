import { useEffect } from "react";
import { Clock } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/Badge";
import { cx } from "@/components/ui/cx";
import type { Section } from "@/lib/data/types";
import { meetingLines, placeLine, sectionHeading, seatsLine } from "./sectionDetails";
import { useSectionPreview } from "./sectionPreview";

/** Another lab or discussion, laid out like the chosen section's card so the list doesn't jump on preview. */
export function LabChoiceRow({ courseCode, section, onChoose }: { courseCode: string; section: Section; onChoose: () => void }) {
  const previewing = useSectionPreview((state) => state.courseCode === courseCode && state.sectionId === section.id);
  const start = useSectionPreview((state) => state.start);
  const end = useSectionPreview((state) => state.end);
  useEffect(() => () => end(section.id), [end, section.id]);
  const place = placeLine(section);

  return (
    <li>
      <button
        type="button"
        aria-label={`Choose ${section.code}`}
        onClick={onChoose}
        onMouseEnter={() => start(courseCode, section.id)}
        onFocus={() => start(courseCode, section.id)}
        onMouseLeave={() => end(section.id)}
        onBlur={() => end(section.id)}
        className={cx(
          "flex w-full cursor-pointer flex-col gap-2 rounded-card border px-10 pt-13 pb-8 text-left",
          previewing ? "border-dashed border-accent bg-choice-preview" : "border-line bg-surface hover:bg-surface-selected",
        )}
      >
        <span className="mb-6 flex items-center justify-between gap-8">
          <span className="text-10 leading-14-5 font-700 text-ink">{sectionHeading(section)}</span>
          {previewing && <span className="-my-3 flex"><Badge tone="accent" size="sm">Previewing</Badge></span>}
        </span>
        {meetingLines(section).map((line) => (
          <span key={line} className="flex items-start gap-8 text-9 leading-13-5 text-ink">
            <span aria-hidden className="flex h-13.5 shrink-0 items-center [&_svg]:size-12"><Clock /></span>
            {line}
          </span>
        ))}
        <span className="mt-1 flex items-start justify-between gap-5 text-8 leading-12-8 text-ink-muted">
          <span className="min-w-0">{place?.text}</span>
          <span className="shrink-0">{seatsLine(section)}</span>
        </span>
      </button>
    </li>
  );
}
