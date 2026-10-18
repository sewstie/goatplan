"use client";

import { sectionListText, termLabel } from "@/lib/plans";
import { PrintedPlan } from "./PrintedPlan";
import { SectionListPreview } from "./SectionListPreview";
import { useSelectedPlan } from "./useSelectedPlan";

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
