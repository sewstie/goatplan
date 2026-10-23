"use client";

import { CourseSearchPanel } from "@/components/courses/CourseSearchPanel";
import { termFieldLabel } from "@/components/courses/courseSummary";
import { TermPicker } from "@/components/courses/TermPicker";
import { Button } from "@/components/ui/Button";
import { SavedPlanCourses } from "./SavedPlanCourses";
import { useOpenPlan } from "./useOpenPlan";
import { useReadOnlyPlan } from "./useReadOnlyPlan";
import { useSelectedPlan } from "./useSelectedPlan";

export function PlansSidebar() {
  const { plan: selectedPlan } = useSelectedPlan();
  const plan = useReadOnlyPlan();
  const { requestOpen, dialog } = useOpenPlan();
  if (!selectedPlan) return null;
  if (!plan) return (
    <>
      <TermPicker />
      <CourseSearchPanel />
    </>
  );
  return (
    <>
      <p className="mb-15 rounded-control border border-line-control px-11 py-10 text-11 font-650">
        {termFieldLabel(plan.term)}
      </p>
      <SavedPlanCourses plan={plan} />
      <Button variant="secondary" fullWidth onClick={() => requestOpen(plan, "/")} className="mt-12">
        Open in planner to edit
      </Button>
      {dialog}
    </>
  );
}
