import { Banner } from "@/components/schedule/Banner";
import { selectSavedPlan, usePlanner } from "@/lib/store";
import { restoredPlanSummary } from "@/lib/store/restoredPlanSummary";

export function VisitBanner({ storageFailed }: { storageFailed: boolean }) {
  const draftSummary = usePlanner((state) => state.restoredPlanSummary);
  const saved = usePlanner(selectSavedPlan);
  const summary = saved ? restoredPlanSummary(saved, { courses: saved.schedule }) : draftSummary;
  return <>
    {summary && <Banner message={{ tone: "success", title: "", detail: summary }} />}
    {storageFailed && <Banner message={{ tone: "info", title: "", detail: "Guide progress can’t be remembered in this browser. You may see the guide again next visit." }} />}
  </>;
}
