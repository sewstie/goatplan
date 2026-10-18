"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { countLabel, savedLabel, sectionCount, type SavedPlan } from "@/lib/plans";
import type { TermFileState } from "@/lib/plans/useTermFile";
import { ButtonLink } from "./ButtonLink";
import { PlanChangeNote } from "./PlanChangeNote";

type SavedPlanRowProps = {
  plan: SavedPlan;
  data: TermFileState;
  isOpen: boolean;
  disabled: boolean;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
};

/** One saved plan in the list on /plans, with what changed since it was saved. */
export function SavedPlanRow({ plan, data, isOpen, disabled, onOpen, onRename, onDelete }: SavedPlanRowProps) {
  const name = <span className="sr-only"> {plan.name}</span>;
  return (
    <li className="flex flex-wrap items-start justify-between gap-x-16 gap-y-10 rounded-card border border-line bg-surface px-14 py-12">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-8">
          <h4 className="text-12 leading-17-4 font-700 break-words text-ink">{plan.name}</h4>
          {isOpen && (
            <Badge tone="accent" size="sm">
              In the planner
            </Badge>
          )}
        </div>
        <p className="text-9 leading-13 text-ink-muted">
          {countLabel(plan.schedule.length, "course")} · {countLabel(sectionCount(plan), "section")} ·{" "}
          {savedLabel(plan.savedAt)}
        </p>
        <PlanChangeNote plan={plan} data={data} />
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <ButtonLink size="sm" href={`/plans?plan=${encodeURIComponent(plan.id)}`}>
          Sections to register{name}
        </ButtonLink>
        <Button size="sm" variant="secondary" disabled={disabled} onClick={onOpen}>
          Open in planner{name}
        </Button>
        <Button size="sm" variant="secondary" onClick={onRename}>
          Rename{name}
        </Button>
        <Button size="sm" variant="warning" onClick={onDelete}>
          Delete{name}
        </Button>
      </div>
    </li>
  );
}
