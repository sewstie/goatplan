import { CourseSearchPanel } from "@/components/courses/CourseSearchPanel";
import { TermBreadcrumbs } from "@/components/courses/TermBreadcrumbs";
import { TermPicker } from "@/components/courses/TermPicker";
import { PlanActions } from "@/components/plans/PlanActions";
import { PreferencesBar } from "@/components/preferences/PreferencesBar";
import { ScheduleBanner } from "@/components/schedule/ScheduleBanner";
import { ScheduleSummary } from "@/components/schedule/ScheduleSummary";
import { ScheduleSwitcher } from "@/components/schedule/ScheduleSwitcher";
import { ScheduleView } from "@/components/schedule/ScheduleView";
import { ChooseAlternativeSheet } from "@/components/sections/ChooseAlternativeSheet";
import { CourseDetailsPanel } from "@/components/sections/CourseDetailsPanel";
import { AppShell } from "@/components/shell/AppShell";
import { PlannerBootstrap } from "@/components/shell/PlannerBootstrap";
import { Sidebar } from "@/components/shell/Sidebar";
import { WorkspaceHeader } from "@/components/shell/WorkspaceHeader";
import { FirstPlanTutorial } from "@/components/tutorial/FirstPlanTutorial";

export default function PlannerPage() {
  return (
    <>
      <FirstPlanTutorial />
      <AppShell
        sidebar={
          <Sidebar>
            <TermPicker />
            <CourseSearchPanel />
          </Sidebar>
        }
        header={
          <WorkspaceHeader
            title="Schedule planner"
            breadcrumbs={<TermBreadcrumbs />}
            titleAside={
              <div id="tutorial-schedules" role="region" aria-label="Schedule browser" tabIndex={-1} className="rounded-control">
                <ScheduleSwitcher />
              </div>
            }
            subtitle={<ScheduleSummary />}
            actions={<PlanActions />}
          />
        }
        toolbar={<PreferencesBar />}
        banner={<ScheduleBanner />}
        schedule={<ScheduleView />}
        hideDetailsOnTermError
        details={
          <>
            <CourseDetailsPanel />
            <ChooseAlternativeSheet />
          </>
        }
      />
      <PlannerBootstrap />
    </>
  );
}
