import { PlannerTitle } from "@/components/share/PlannerTitle";
import { PreferencesBar } from "@/components/preferences/PreferencesBar";
import { SortSelect } from "@/components/preferences/SortSelect";
import { ScheduleBanner } from "@/components/schedule/ScheduleBanner";
import { ScheduleSummary } from "@/components/schedule/ScheduleSummary";
import { ScheduleBrowser } from "@/components/schedule/ScheduleBrowser";
import { PlannerViewSync } from "@/components/shell/PlannerViewSync";
import { ScheduleView } from "@/components/schedule/ScheduleView";
import { PlannerBootstrap } from "@/components/shell/PlannerBootstrap";
import { PlannerShell } from "@/components/shell/PlannerShell";
import { PlannerBarActions } from "@/components/shell/PlannerBarActions";
import { FirstPlanTutorial } from "@/components/tutorial/FirstPlanTutorial";

export default function PlannerPage() {
  return (
    <>
      <PlannerShell
        header={<h1 data-screen-heading tabIndex={-1} className="sr-only"><PlannerTitle badge={false} /></h1>}
        barCenter={
          <div id="tutorial-schedules" role="region" aria-label="Schedule browser" tabIndex={-1} className="rounded-control">
            <ScheduleBrowser />
          </div>
        }
        barActions={<PlannerBarActions />}
        toolbar={
          <>
            <ScheduleSummary />
            <div className="flex items-start gap-8">
              <div className="min-w-0 flex-1"><PreferencesBar /></div>
              <div className="flex h-44 shrink-0 items-center empty:hidden"><SortSelect className="shrink-0" /></div>
            </div>
          </>
        }
        banner={<><PlannerViewSync /><FirstPlanTutorial /><ScheduleBanner /></>}
        schedule={<ScheduleView />}
      />
      <PlannerBootstrap />
    </>
  );
}
