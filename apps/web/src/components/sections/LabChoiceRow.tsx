import type { Section } from "@/lib/data/types";
import { meetingLines } from "./sectionDetails";
import { useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { cx } from "@/components/ui/cx";
import { useSectionPreview } from "./sectionPreview";

export function LabChoiceRow({ courseCode, section, onChoose }: { courseCode: string; section: Section; onChoose: () => void }) {
  const previewing = useSectionPreview((state) => state.courseCode === courseCode && state.sectionId === section.id);
  const start = useSectionPreview((state) => state.start);
  const end = useSectionPreview((state) => state.end);
  useEffect(() => () => end(section.id), [end, section.id]);
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
        className={cx("flex w-full cursor-pointer items-center justify-between gap-7 rounded-row border px-7 pb-8 text-left", previewing ? "border-dashed border-accent bg-choice-preview pt-11" : "border-line pt-8 hover:bg-surface-selected")}
      >
        <span className="flex min-w-0 flex-col gap-2">
          <span className="text-10 leading-14-5 font-650 text-ink">{section.code}</span>
          <span className="text-8 leading-11-6 text-ink-muted">{meetingLines(section).join(", ")}</span>
        </span>
        {previewing ? <Badge tone="accent" size="sm">Previewing</Badge> : <span className="shrink-0 text-8 leading-11-6 text-ink-muted">{Math.max(0, section.capacity - section.enrolled)} open</span>}
      </button>
    </li>
  );
}
