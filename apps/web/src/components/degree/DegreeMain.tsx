"use client";

import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { Button } from "@/components/ui/Button";
import { getDegreeSource, type DegreeSnapshot } from "@/lib/degree";
import { DegreeSkeleton } from "./DegreeSkeleton";
import { DegreeSummary } from "./DegreeSummary";
import { FilterBar } from "./FilterBar";
import { FirstVisitPanel } from "./FirstVisitPanel";
import { PlanningFirstCard } from "./PlanningFirstCard";
import { RequirementsList } from "./RequirementsList";
import { SheetPanel } from "./SheetPanel";
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
      {layout === "sheet" ? <SheetPanel view={view} history={degree.history} /> : <RequirementsList view={view} history={degree.history} />}
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
        {!empty && !filter && <PlanningFirstCard view={view} />}
      </div>
    );
  }

  return (
    <div aria-busy={status === "waiting"} className="degree-sheet-view flex min-w-0 flex-col gap-16">
      {auditStatus}
      <DegreeSummary view={view} />
      {damaged}
      {sheet}
      {!empty && !filter && <PlanningFirstCard view={view} />}
    </div>
  );
}
