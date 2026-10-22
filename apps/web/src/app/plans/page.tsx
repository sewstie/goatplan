import type { Metadata } from "next";
import { Suspense } from "react";
import { PlansBreadcrumbs } from "@/components/plans/PlansBreadcrumbs";
import { PlansPageActions } from "@/components/plans/PlansPageActions";
import { PlansPreferences } from "@/components/plans/PlansPreferences";
import { PlansSidebar } from "@/components/plans/PlansSidebar";
import { PlansSubtitle } from "@/components/plans/PlansSubtitle";
import { PlansTitle } from "@/components/plans/PlansTitle";
import { RegistrationPrint } from "@/components/plans/RegistrationPrint";
import { RegistrationSheet } from "@/components/plans/RegistrationSheet";
import { RegistrationSummary } from "@/components/plans/RegistrationSummary";
import { SavedPlanPill } from "@/components/plans/SavedPlanPill";
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
              <Suspense>
                <PlansSidebar />
              </Suspense>
            </Sidebar>
          }
          header={
            <WorkspaceHeader
              title={
                <Suspense fallback="Sections to register">
                  <PlansTitle />
                </Suspense>
              }
              breadcrumbs={
                <Suspense>
                  <PlansBreadcrumbs />
                </Suspense>
              }
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
              actions={<PlansPageActions />}
            />
          }
          toolbar={
            <Suspense>
              <PlansPreferences />
            </Suspense>
          }
          scheduleLabel="Sections to register"
          detailsLabel="Plan summary"
          scheduleFit="content"
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
