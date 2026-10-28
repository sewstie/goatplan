"use client";

import { useRef, useState } from "react";
import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { countLabel, registrationRows, sectionCount, sectionListText, type SavedPlan } from "@/lib/plans";
import { useTermFile } from "@/lib/plans/useTermFile";
import { CopySectionListButton } from "./CopySectionListButton";
import { PrintSectionListButton } from "./PrintSectionListButton";
import { RegistrationCardList } from "./RegistrationCardList";
import { RegistrationTable } from "./RegistrationTable";
import { SectionListPreview } from "./SectionListPreview";

const WORKDAY_URL = "https://workday.wpi.edu";

/**
 * "Ready for Workday": the table, the section list to copy and the closing note (div.app-22). The phone
 * shows only Copy, Workday and a card per course; the list appears if copying fails.
 */
export function RegistrationSheetView({ plan }: { plan: SavedPlan }) {
  const { term } = useTermFile(plan.termId);
  const previewRef = useRef<HTMLPreElement>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const text = sectionListText(plan.schedule);
  const phone = usePhoneViewport();
  const rows = registrationRows(plan, term);

  if (phone) {
    // The page title names the plan and counts its sections, so the phone goes straight to the actions.
    return (
      <div className="flex flex-col gap-12">
        <div className="grid grid-cols-2 gap-8">
          <CopySectionListButton
            text={text}
            previewRef={previewRef}
            onCopied={() => setCopyFailed(false)}
            onFallback={() => setCopyFailed(true)}
            fullWidth
            phone
          />
          <ButtonLink href={WORKDAY_URL} external variant="secondary" fullWidth icon={<ArrowSquareOut aria-hidden />} className="min-h-44">
            Open Workday
          </ButtonLink>
        </div>
        {copyFailed && (
          <>
            <p role="alert" className="text-9 text-ink-muted">Couldn&apos;t copy by itself. Press and hold the list below to copy it.</p>
            <SectionListPreview ref={previewRef} text={text} />
          </>
        )}
        <RegistrationCardList rows={rows} />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-10 overflow-y-auto px-20 py-23">
      <div className="flex flex-wrap items-center justify-between gap-12">
        <div className="flex flex-col gap-5">
          <h2 className="text-19 leading-27-55 font-700 tracking-heading-sm text-ink">Ready for Workday</h2>
          <p className="text-10 leading-14-5 text-ink-muted">
            {countLabel(sectionCount(plan), "section")} across {countLabel(plan.schedule.length, "course")}
          </p>
        </div>
        <div className="flex items-center gap-7">
          <PrintSectionListButton />
          <CopySectionListButton
            text={text}
            previewRef={previewRef}
            onCopied={() => setCopyFailed(false)}
            onFallback={() => setCopyFailed(true)}
          />
        </div>
      </div>

      <RegistrationTable rows={rows} className="mt-15" />

      <SectionListPreview ref={previewRef} text={text} className="mt-6" />
      {copyFailed && (
        <p role="alert" className="text-9 leading-13 text-ink-muted">
          Couldn&apos;t copy by itself. The list is selected: press Ctrl+C, or ⌘C on a Mac.
        </p>
      )}
      <p className="mt-10 text-10 leading-17 text-ink-muted">
        Saving a plan in GoatPlan keeps your choices. Complete registration in Workday.
      </p>
    </div>
  );
}
