"use client";

import { Badge } from "@/components/ui/Badge";
import { changeLabel, findPlanChanges, isSeriousChange, type SavedPlan } from "@/lib/plans";
import type { TermFileState } from "@/lib/plans/useTermFile";

/**
 * What changed in the latest data since the plan was saved, as badges in the plan list. `quiet` (the
 * phone) says nothing while checking or when nothing changed.
 */
export function PlanChangeNote({ plan, data, quiet = false }: { plan: SavedPlan; data: TermFileState; quiet?: boolean }) {
  if (data.status === "loading") {
    if (quiet) return null;
    return <p className="text-9 leading-13 text-ink-muted">Checking for changes…</p>;
  }
  if (data.status === "error") {
    return <p className="text-9 leading-13 text-ink-muted">Couldn’t check the latest course data.</p>;
  }
  const changes = findPlanChanges(plan, data.term);
  if (changes.length === 0) {
    if (quiet) return null;
    return <p className="text-9 leading-13 text-ink-muted">No changes since you saved.</p>;
  }
  return (
    <ul aria-label="Changes since you saved" className="flex flex-wrap gap-4">
      {changes.map((change) => (
        <li key={changeLabel(change)}>
          <Badge tone={isSeriousChange(change) ? "warning" : "neutral"}>{changeLabel(change)}</Badge>
        </li>
      ))}
    </ul>
  );
}
