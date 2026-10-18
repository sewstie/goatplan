import type { Metadata } from "next";
import { CourseSearchPanel } from "@/components/courses/CourseSearchPanel";
import { TermBreadcrumbs } from "@/components/courses/TermBreadcrumbs";
import { TermPicker } from "@/components/courses/TermPicker";
import { PlanActions } from "@/components/plans/PlanActions";
import { RegistrationSheet } from "@/components/plans/RegistrationSheet";
import { RegistrationSummary } from "@/components/plans/RegistrationSummary";
import { PreferencesBar } from "@/components/preferences/PreferencesBar";
import { AppShell } from "@/components/shell/AppShell";
import { PlannerBootstrap } from "@/components/shell/PlannerBootstrap";
import { Sidebar } from "@/components/shell/Sidebar";
import { WorkspaceHeader } from "@/components/shell/WorkspaceHeader";

export const metadata: Metadata = {
  title: "Sections to register · GoatPlan",
};

/** Plans agent: "Sections to register" (docs/design/screens/div.app-22.md). */
export default function PlansPage() {
  return (
    <>
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
            actions={<PlanActions />}
          />
        }
        toolbar={<PreferencesBar />}
        schedule={<RegistrationSheet />}
        details={<RegistrationSummary />}
      />
      <PlannerBootstrap />
    </>
  );
}
