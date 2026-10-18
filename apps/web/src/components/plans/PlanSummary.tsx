"use client";

import { ArrowSquareOut, CheckCircle, Warning } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { describeChange, findPlanChanges, isSeriousChange, termLabel, type SavedPlan } from "@/lib/plans";
import { useTermFile } from "@/lib/plans/useTermFile";
import { usePlanner } from "@/lib/store";
import { ButtonLink } from "./ButtonLink";
import { useOpenPlan } from "./useOpenPlan";

const WORKDAY_URL = "https://workday.wpi.edu";

const CHECKS = ["Lecture and lab choices included", "No overlapping meeting times", "Preferences respected"];

/**
 * "Plan ready" with what the planner guarantees for the plan (div.app-22). When a saved section
 * filled up, changed time or was removed, it says so and offers to open the plan instead.
 */
export function PlanSummary({ plan }: { plan: SavedPlan }) {
  const data = useTermFile(plan.termId);
  const termStatus = usePlanner((state) => state.termStatus);
  const { requestOpen, dialog } = useOpenPlan();
  const problems = data.term ? findPlanChanges(plan, data.term).filter(isSeriousChange) : [];
  const workday = (
    <ButtonLink
      href={WORKDAY_URL}
      external
      fullWidth
      variant={problems.length > 0 ? "secondary" : "primary"}
      icon={<ArrowSquareOut aria-hidden />}
    >
      Open Workday
    </ButtonLink>
  );

  return (
    <div className="flex flex-col gap-4">
      {data.status === "loading" ? (
        <p className="min-h-13 text-9 leading-13 text-ink-muted">Checking the latest course data…</p>
      ) : problems.length > 0 ? (
        <p className="text-9 leading-13 font-650 text-attention">Saved plan needs attention</p>
      ) : (
        <p className="text-9 leading-13 font-650 text-ready">Plan ready</p>
      )}
      <h2 className="mt-4 text-21 leading-25-2 font-700 tracking-heading text-ink">Your registration list</h2>
      <p className="text-11 leading-17-6 font-510 text-ink">{termLabel(plan.term)}</p>

      {problems.length > 0 ? (
        <>
          <Card variant="issue" className="mt-20 flex flex-col gap-6 px-12 pt-12 pb-13">
            <Warning aria-hidden className="size-16 text-attention" />
            <h3 className="text-12 leading-18 font-700 text-ink">{describeChange(problems[0])}</h3>
            {problems.slice(1).map((change) => (
              <p key={describeChange(change)} className="text-10 leading-17 font-650 text-ink">
                {describeChange(change)}
              </p>
            ))}
            <p className="text-10 leading-17 text-issue-ink">
              Open the plan in the planner to pick other sections, then save it again.
            </p>
          </Card>
          <div className="mt-8 flex flex-col gap-8">
            <Button
              fullWidth
              disabled={termStatus === "idle" || termStatus === "loading"}
              onClick={() => requestOpen(plan, "/")}
            >
              Open in planner
            </Button>
            {workday}
          </div>
          {dialog}
        </>
      ) : (
        <>
          {data.status !== "loading" && (
            <ul className="mt-20 flex flex-col gap-15">
              {CHECKS.map((check) => (
                <li key={check} className="flex items-center gap-8 text-10 leading-14-5 text-ink">
                  <CheckCircle aria-hidden className="size-15 shrink-0" />
                  {check}
                </li>
              ))}
            </ul>
          )}
          <p className="pt-11 pb-13 text-10 leading-17-5 text-ink-muted">
            {data.status === "error" && "Couldn’t check the latest course data. "}
            Copy these section codes into Workday. Check availability there before registering.
          </p>
          {workday}
        </>
      )}
    </div>
  );
}
