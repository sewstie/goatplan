import { useId } from "react";
import { uniqueInstructors } from "@/lib/data";
import { cx } from "@/components/ui/cx";
import { InstructorRating } from "./InstructorRating";
import { meetingLines } from "./sectionDetails";
import type { LectureChoice } from "./sectionSteps";

export function LectureChoiceRow({ choice: { section, reason }, onChoose }: { choice: LectureChoice; onChoose: () => void }) {
  const reasonId = useId();
  return (
    <li className="rounded-row border border-line px-7 py-8">
      <button type="button" aria-label={`Choose ${section.code}`} aria-disabled={!!reason} aria-describedby={reason ? reasonId : undefined}
        onClick={() => { if (!reason) onChoose(); }}
        className={cx("flex w-full flex-col gap-2 rounded-badge text-left", reason ? "cursor-not-allowed text-ink-muted" : "cursor-pointer text-ink hover:text-accent")}>
        <span className="text-10 leading-14-5 font-650">Lecture {section.code}</span>
        <span className="text-8 leading-11-6 text-ink-muted">{meetingLines(section).join(", ")}</span>
      </button>
      {reason && <p id={reasonId} className="mt-5 text-8 leading-12 text-ink-muted">{reason}</p>}
      <div className="mt-7 flex flex-col gap-7">
        {uniqueInstructors([section]).map((name) => <InstructorRating key={name} name={name} dense showLink={false} />)}
      </div>
    </li>
  );
}
