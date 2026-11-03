"use client";

import { useEffect, useRef, useState } from "react";
import { SharedLinkError } from "@/components/share/SharedLinkError";
import { SharedPlanFresh } from "@/components/share/SharedPlanFresh";
import { Notice } from "@/components/ui/Notice";
import { closeSharedView } from "@/lib/share/closeSharedView";
import { loadSharedPlan } from "@/lib/share/loadSharedPlan";
import { clearShareData, shareData } from "@/lib/share/url";
import { PlanNotFound } from "@/components/plans/PlanNotFound";
import { getPlansSource } from "@/lib/plans";
import { usePlanner, usePlannerStore } from "@/lib/store";

export function PlannerViewSync() {
  const store = usePlannerStore();
  const temporary = usePlanner((state) => state.temporaryPlan);
  const focusDraft = useRef(false);
  const [sharedError, setSharedError] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [loadingShare, setLoadingShare] = useState(false);
  const [missingPlan, setMissingPlan] = useState(false);
  const [opened, setOpened] = useState<string | null>(null);
  useEffect(() => {
    const source = getPlansSource();
    let reading = true;
    let cancelled = false;
    let request = 0;

    function writeLocation(replace = false) {
      if (window.location.pathname !== "/") return;
      const url = new URL(window.location.href);
      const id = store.getState().savedPlanId;
      if (id && !store.getState().temporaryPlan) {
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
      const encoded = shareData(window.location.hash);
      const params = new URLSearchParams(window.location.search);
      await store.getState().init();
      if (cancelled || token !== request) return;
      if (encoded !== null) {
        setMissingPlan(false);
        setSharedError(false);
        setReviewing(false);
        setLoadingShare(true);
        store.getState().showFound();
        const result = await loadSharedPlan(encoded);
        if (cancelled || token !== request) return;
        setLoadingShare(false);
        if (result.ok) store.getState().showTemporaryPlan(result.plan);
        else setSharedError(true);
        reading = false;
        writeLocation(true);
        return;
      }
      setSharedError(false);
      setLoadingShare(false);
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
      if (previous.temporaryPlan && !state.temporaryPlan) {
        request += 1;
        window.history.replaceState(null, "", clearShareData(window.location.href));
        setSharedError(false);
        setLoadingShare(false);
        focusDraft.current = true;
      }
      if (state.courses !== previous.courses || state.termId !== previous.termId || state.savedPlanId !== previous.savedPlanId) {
        setMissingPlan(false);
        setOpened(null);
      }
      if (state.savedPlanId !== previous.savedPlanId) writeLocation();
    });
    const onPopState = () => { void readLocation(); };
    window.addEventListener("popstate", onPopState);
    window.addEventListener("hashchange", onPopState);
    void readLocation();
    return () => {
      cancelled = true;
      unsubscribePlans();
      unsubscribeStore();
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("hashchange", onPopState);
      store.getState().showFound();
    };
  }, [store]);
  useEffect(() => {
    if (focusDraft.current && !temporary) {
      document.getElementById("tutorial-schedules")?.focus();
      focusDraft.current = false;
    }
  }, [temporary, sharedError, loadingShare]);

  function closeShare() {
    focusDraft.current = true;
    closeSharedView(() => store.getState().showFound());
  }

  if (sharedError) return <SharedLinkError onReturn={closeShare} />;
  if (loadingShare) {
    return (
      <div className="flex items-center gap-12">
        <p role="status" className="text-9 leading-13 text-ink-muted">Opening shared plan…</p>
        <button type="button" onClick={closeShare} className="cursor-pointer rounded-badge text-9 leading-13 font-600 text-accent hover:underline">Close preview</button>
      </div>
    );
  }
  if (temporary) {
    const missing = temporary.missing ?? [];
    if (missing.length > 0 && !reviewing) {
      return <SharedPlanFresh missing={missing} termName={temporary.view?.term.name ?? ""} onClose={closeShare} onReview={() => setReviewing(true)} />;
    }
    return (
      <section aria-label="Shared plan" className="flex flex-col gap-8">
        <Notice className="py-8">
          <p><b className="font-650">Viewing a shared plan.</b> Your own draft is safe. Changes require opening a separate copy.</p>
          {temporary.warnings?.map((warning) => <p key={warning} className="pt-3 font-570">{warning}</p>)}
        </Notice>
      </section>
    );
  }
  return (
    <>
      {opened && <span role="status" className="sr-only">Opened “{opened}” for editing.</span>}
      {missingPlan && <div role="alert" className="rounded-panel bg-surface"><PlanNotFound /></div>}
    </>
  );
}
