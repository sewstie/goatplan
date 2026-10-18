"use client";

import {
  countLabel,
  registrationRows,
  savedLabel,
  sectionCount,
  sectionListText,
  termLabel,
  type SavedPlan,
} from "@/lib/plans";
import { useTermFile } from "@/lib/plans/useTermFile";
import { RegistrationTable } from "./RegistrationTable";
import { SectionListPreview } from "./SectionListPreview";

/** One plan's sections to register, as printed. */
export function PrintedPlan({ plan }: { plan: SavedPlan }) {
  const { term } = useTermFile(plan.termId);
  return (
    <>
      <p className="pt-4 text-11 leading-17-6 text-ink-muted">
        {plan.name} · {termLabel(plan.term)} · {countLabel(sectionCount(plan), "section")} across{" "}
        {countLabel(plan.schedule.length, "course")} · {savedLabel(plan.savedAt)}
      </p>
      <RegistrationTable rows={registrationRows(plan, term)} className="mt-16" />
      <SectionListPreview text={sectionListText(plan.schedule)} className="mt-20 break-inside-avoid" />
      <p className="pt-12 text-10 leading-17 text-ink-muted">
        Saving a plan in GoatPlan keeps your choices. Complete registration in Workday.
      </p>
    </>
  );
}
