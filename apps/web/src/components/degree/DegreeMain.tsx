"use client";

import { ShieldCheck } from "@phosphor-icons/react/ssr";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { Button } from "@/components/ui/Button";
import { getDegreeSource, type DegreeSnapshot } from "@/lib/degree";
import { CreditsCard } from "./CreditsCard";
import { DegreeSkeleton } from "./DegreeSkeleton";
import { DegreeProgressCard, DegreeSummary } from "./DegreeSummary";
import { FilterBar } from "./FilterBar";
import { FirstVisitPanel } from "./FirstVisitPanel";
import { InsightsSection } from "./InsightsSection";
import { NotOnALineRow } from "./NotOnALineRow";
import { PaceCard } from "./PaceCard";
import { PlanningFirstCard } from "./PlanningFirstCard";
import { RequirementsList } from "./RequirementsList";
import { SheetPanel } from "./SheetPanel";
import { TakeThisTermCard } from "./TakeThisTermCard";
import { useDegreeUi } from "./degreeUi";
import type { DegreeView } from "./useDegreeView";

type DegreeMainProps = { degree: DegreeSnapshot; view: DegreeView | null };

export function DegreeMain({ degree, view }: DegreeMainProps) {
  const layout = useDegreeUi((state) => state.view);
  const filter = useDegreeUi((state) => state.filter);
  const phone = usePhoneViewport();
  const { status } = degree.audit;
  const empty = degree.history.courses.length === 0;
  const auditStatus = <span hidden data-degree-audit-status={status} />;

  if (status === "failed" && !view) {
    return (
      <div role="alert" className="flex flex-col items-start gap-10 rounded-panel border border-card-line bg-surface p-22">
        {auditStatus}
        <p className="text-10 leading-16-5 text-ink-soft">We couldn’t check your progress. Your courses are still saved.</p>
        <Button variant="secondary" size="sm" onClick={() => getDegreeSource().retryAudit()}>Try again</Button>
      </div>
    );
  }
  if (!view) return <>{auditStatus}<DegreeSkeleton /></>;

  const sheet = (
    <>
      {empty && <FirstVisitPanel />}
      <FilterBar view={view} />
      {layout === "sheet" ? <SheetPanel view={view} history={degree.history} /> : <RequirementsList view={view} />}
      {empty && (
        <p className="flex items-center justify-center gap-10 py-8 text-center text-8-5 leading-16 text-ink-muted">
          <ShieldCheck aria-hidden className="size-16 shrink-0 text-ink" />
          Course history stays in this browser. You can import a history file from another device.
        </p>
      )}
    </>
  );
  const damaged = degree.damaged && <p role="alert" className="rounded-card bg-notice-warning px-15 py-10 text-8-5 leading-16 text-notice-warning-ink">Some of your saved courses couldn’t be read, so they aren’t listed.</p>;

  if (phone) {
    return (
      <div aria-busy={status === "waiting"} className="flex flex-col gap-22">
        {auditStatus}
        {damaged}
        <DegreeSummary view={view} />
        {sheet}
        {!empty && !filter && <InsightsSection view={view} degree={degree} />}
        {!empty && !filter && <NotOnALineRow view={view} history={degree.history} />}
      </div>
    );
  }

  return (
    <div aria-busy={status === "waiting"} className="flex flex-col gap-14 desk:grid desk:grid-cols-[minmax(0,65fr)_minmax(0,35fr)] desk:items-start desk:gap-16">
      {auditStatus}
      <div
        role="group"
        aria-label="Your progress and what to do next"
        tabIndex={0}
        className="flex items-start gap-12 overflow-x-auto rounded-panel pb-4 *:w-352 *:shrink-0 desk:sticky desk:top-[calc(var(--size-topbar)+0.75rem)] desk:order-last desk:max-h-[calc(100dvh-var(--size-topbar)-1.5rem)] desk:flex-col desk:overflow-x-hidden desk:overflow-y-auto desk:pb-0 desk:*:w-full"
      >
        <DegreeProgressCard view={view} />
        {!empty && <PaceCard view={view} />}
        {!empty && <TakeThisTermCard history={degree.history} />}
        {!empty && <PlanningFirstCard view={view} />}
        {!empty && <CreditsCard view={view} degree={degree} />}
      </div>
      <div className="flex min-w-0 flex-col gap-14">
        {damaged}
        {sheet}
        {!empty && !filter && <NotOnALineRow view={view} history={degree.history} />}
      </div>
    </div>
  );
}
