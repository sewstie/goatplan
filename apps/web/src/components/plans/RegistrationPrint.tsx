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
import { useSelectedPlan } from "./useSelectedPlan";

function PrintedPlan({ plan }: { plan: SavedPlan }) {
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

/**
 * What /plans prints: just the sections to register (or each plan's section list), without the
 * sidebar, preferences and buttons. Hidden on screen; the page hides the app shell when printing.
 */
export function RegistrationPrint() {
  const { plan, planId, snapshot } = useSelectedPlan();
  if (!snapshot) return null;
  return (
    <div className="hidden bg-surface text-ink print:block">
      <h1 className="text-25 leading-30 font-700 tracking-title">Sections to register</h1>
      {plan ? (
        <PrintedPlan plan={plan} />
      ) : planId ? null : (
        snapshot.plans.map((item) => (
          <section key={item.id} className="mt-20 break-inside-avoid">
            <h2 className="text-12 leading-17-4 font-700">
              {item.name} · {termLabel(item.term)}
            </h2>
            <SectionListPreview text={sectionListText(item.schedule)} className="mt-8" />
          </section>
        ))
      )}
    </div>
  );
}
