"use client";

import { useEffect, useState } from "react";
import { PlanNotFound } from "@/components/plans/PlanNotFound";
import { getPlansSource } from "@/lib/plans";
import { usePlannerStore } from "@/lib/store";

export function PlannerViewSync() {
  const store = usePlannerStore();
  const [missingPlan, setMissingPlan] = useState(false);
  useEffect(() => {
    const source = getPlansSource();
    let reading = true;
    let cancelled = false;
    let request = 0;

    function writeLocation(replace = false) {
      if (window.location.pathname !== "/") return;
      const url = new URL(window.location.href);
      const id = store.getState().savedPlanId;
      if (id) {
        url.searchParams.set("view", "saved");
        url.searchParams.set("plan", id);
      } else {
        url.searchParams.delete("view");
        url.searchParams.delete("plan");
      }
      if (url.href !== window.location.href) window.history[replace ? "replaceState" : "pushState"](null, "", url);
    }

    function syncPlans() {
      store.getState().setSavedPlans(source.getSnapshot().plans);
    }

    async function readLocation() {
      const token = ++request;
      reading = true;
      const params = new URLSearchParams(window.location.search);
      await store.getState().init();
      if (cancelled || token !== request) return;
      const plan = params.get("view") === "saved" ? source.getSnapshot().plans.find((plan) => plan.id === params.get("plan")) : null;
      if (plan && store.getState().termId !== plan.termId) await store.getState().setTerm(plan.termId);
      if (cancelled || token !== request) return;
      setMissingPlan(params.get("view") === "saved" && !plan);
      if (plan && store.getState().termStatus === "ready") store.getState().showSaved(plan.id);
      else store.getState().showFound();
      reading = false;
      writeLocation(true);
    }

    syncPlans();
    const unsubscribePlans = source.subscribe(syncPlans);
    const unsubscribeStore = store.subscribe((state, previous) => {
      if (reading) return;
      if (state.courses !== previous.courses || state.termId !== previous.termId || state.savedPlanId !== previous.savedPlanId) setMissingPlan(false);
      if (state.savedPlanId !== previous.savedPlanId) writeLocation();
    });
    const onPopState = () => { void readLocation(); };
    window.addEventListener("popstate", onPopState);
    void readLocation();
    return () => {
      cancelled = true;
      unsubscribePlans();
      unsubscribeStore();
      window.removeEventListener("popstate", onPopState);
      store.getState().showFound();
    };
  }, [store]);
  return missingPlan ? <div role="alert" className="rounded-panel bg-surface"><PlanNotFound /></div> : null;
}
