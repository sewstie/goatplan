import { PlannerTitle } from "@/components/share/PlannerTitle";
import { SeatRefreshNotice } from "@/components/schedule/SeatRefreshNotice";
import { SeatStatus } from "@/components/shell/SeatStatus";
import { PreferencesBar } from "@/components/preferences/PreferencesBar";
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
        toolbar={<><ScheduleSummary /><SeatStatus /><PreferencesBar /></>}
        banner={<><PlannerViewSync /><FirstPlanTutorial /><SeatRefreshNotice /><ScheduleBanner /></>}
        schedule={<ScheduleView />}
      />
      <PlannerBootstrap />
    </>
  );
}
