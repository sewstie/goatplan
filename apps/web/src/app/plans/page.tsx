import type { Metadata } from "next";
import { Suspense } from "react";
import { CourseSearchPanel } from "@/components/courses/CourseSearchPanel";
import { TermBreadcrumbs } from "@/components/courses/TermBreadcrumbs";
import { TermPicker } from "@/components/courses/TermPicker";
import { PlanActions } from "@/components/plans/PlanActions";
import { PlansSubtitle } from "@/components/plans/PlansSubtitle";
import { RegistrationPrint } from "@/components/plans/RegistrationPrint";
import { RegistrationSheet } from "@/components/plans/RegistrationSheet";
import { RegistrationSummary } from "@/components/plans/RegistrationSummary";
import { SavedPlanPill } from "@/components/plans/SavedPlanPill";
import { PreferencesBar } from "@/components/preferences/PreferencesBar";
import { AppShell } from "@/components/shell/AppShell";
import { PlannerBootstrap } from "@/components/shell/PlannerBootstrap";
import { Sidebar } from "@/components/shell/Sidebar";
import { WorkspaceHeader } from "@/components/shell/WorkspaceHeader";

export const metadata: Metadata = {
  title: "Sections to register · GoatPlan",
};

/**
 * /plans lists the saved plans; /plans?plan=<id> shows one plan's sections to register
 * (docs/design/screens/div.app-22.md). Plans live in this browser, so the parts that read the
 * address render in the browser, under Suspense.
 */
export default function PlansPage() {
  return (
    <>
      <div className="print:hidden">
        <AppShell
          sidebar={
            <Sidebar>
              <TermPicker />
              <CourseSearchPanel />
            </Sidebar>
          }
          header={
            <WorkspaceHeader
              title="Sections to register"
              breadcrumbs={<TermBreadcrumbs />}
              titleAside={
                <Suspense>
                  <SavedPlanPill />
                </Suspense>
              }
              subtitle={
                <Suspense>
                  <PlansSubtitle />
                </Suspense>
              }
              actions={<PlanActions />}
            />
          }
          toolbar={<PreferencesBar />}
          schedule={
            <Suspense>
              <RegistrationSheet />
            </Suspense>
          }
          details={
            <Suspense>
              <RegistrationSummary />
            </Suspense>
          }
        />
      </div>
      <Suspense>
        <RegistrationPrint />
      </Suspense>
      <PlannerBootstrap />
    </>
  );
}
