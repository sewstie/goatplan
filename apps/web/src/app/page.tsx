import { TermBreadcrumbs } from "@/components/courses/TermBreadcrumbs";
import { PlanActions } from "@/components/plans/PlanActions";
import { PreferencesBar } from "@/components/preferences/PreferencesBar";
import { ScheduleBanner } from "@/components/schedule/ScheduleBanner";
import { ScheduleSummary } from "@/components/schedule/ScheduleSummary";
import { ScheduleBrowser } from "@/components/schedule/ScheduleBrowser";
import { PlannerViewSync } from "@/components/shell/PlannerViewSync";
import { ScheduleView } from "@/components/schedule/ScheduleView";
import { PlannerBootstrap } from "@/components/shell/PlannerBootstrap";
import { PlannerShell } from "@/components/shell/PlannerShell";
import { WorkspaceHeader } from "@/components/shell/WorkspaceHeader";
import { FirstPlanTutorial } from "@/components/tutorial/FirstPlanTutorial";

export default function PlannerPage() {
  return (
    <>
      <PlannerShell
        header={
          <WorkspaceHeader
            title="Schedule planner"
            breadcrumbs={<TermBreadcrumbs />}
            titleAside={
              <div id="tutorial-schedules" role="region" aria-label="Schedule browser" tabIndex={-1} className="rounded-control">
                <ScheduleBrowser />
              </div>
            }
            subtitle={<ScheduleSummary />}
            actions={<PlanActions />}
          />
        }
        toolbar={<PreferencesBar />}
        banner={<><PlannerViewSync /><FirstPlanTutorial /><ScheduleBanner /></>}
        schedule={<ScheduleView />}
      />
      <PlannerBootstrap />
    </>
  );
}
