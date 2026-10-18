"use client";

import { useRef, useState } from "react";
import { countLabel, registrationRows, sectionCount, sectionListText, type SavedPlan } from "@/lib/plans";
import { useTermFile } from "@/lib/plans/useTermFile";
import { CopySectionListButton } from "./CopySectionListButton";
import { RegistrationTable } from "./RegistrationTable";
import { SectionListPreview } from "./SectionListPreview";

/** "Ready for Workday": the table, the section list to copy and the closing note (div.app-22). */
export function RegistrationSheetView({ plan }: { plan: SavedPlan }) {
  const { term } = useTermFile(plan.termId);
  const previewRef = useRef<HTMLPreElement>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const text = sectionListText(plan.schedule);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-10 overflow-y-auto px-20 py-23">
      <div className="flex flex-wrap items-center justify-between gap-12">
        <div className="flex flex-col gap-5">
          <h2 className="text-19 leading-27-55 font-700 tracking-heading-sm text-ink">Ready for Workday</h2>
          <p className="text-10 leading-14-5 text-ink-muted">
            {countLabel(sectionCount(plan), "section")} across {countLabel(plan.schedule.length, "course")}
          </p>
        </div>
        <CopySectionListButton
          text={text}
          previewRef={previewRef}
          onCopied={() => setCopyFailed(false)}
          onFallback={() => setCopyFailed(true)}
        />
      </div>
      <RegistrationTable rows={registrationRows(plan, term)} className="mt-15" />
      <SectionListPreview ref={previewRef} text={text} className="mt-6" />
      {copyFailed && (
        <p role="alert" className="text-9 leading-13 text-ink-muted">
          Couldn’t copy by itself. The list is selected: press Ctrl+C, or ⌘C on a Mac.
        </p>
      )}
      <p className="mt-10 text-10 leading-17 text-ink-muted">
        Saving a plan in GoatPlan keeps your choices. Complete registration in Workday.
      </p>
    </div>
  );
}
