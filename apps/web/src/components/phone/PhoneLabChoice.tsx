import { meetingLines } from "@/components/sections/sectionDetails";
import { cx } from "@/components/ui/cx";
import { isFull } from "@/lib/data";
import type { Section } from "@/lib/data/types";
import { openSeatsShort } from "./phoneSectionText";

/** Another lab time in the Change list. Without `onChoose` it's shown but can't be picked. */
export function PhoneLabChoice({ section, onChoose }: { section: Section; onChoose?: () => void }) {
  const content = (
    <>
      <span className="flex items-start justify-between gap-8">
        <span className="text-10 font-700 text-ink">{section.code}</span>
        <span className={cx("shrink-0 text-8 font-570", isFull(section) ? "text-warning" : "text-success")}>{openSeatsShort(section)}</span>
      </span>
      {meetingLines(section, "shared").map((line) => <span key={line} className="text-9 text-ink-muted">{line}</span>)}
    </>
  );
  return (
    <li>
      {onChoose ? (
        <button type="button" aria-label={`Choose ${section.code}, ${meetingLines(section, "shared").join(", ")}`} onClick={onChoose}
          className="flex w-full cursor-pointer flex-col gap-4 px-16 py-14 text-left hover:bg-surface-selected focus-visible:-outline-offset-2">
          {content}
        </button>
      ) : (
        <div className="flex flex-col gap-4 px-16 py-14">{content}</div>
      )}
    </li>
  );
}
