"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { usePlannerStore } from "@/lib/store";

export function OpenInPlanner({ termId, code }: { termId: string; code?: string }) {
  const store = usePlannerStore();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function open() {
    setBusy(true);
    setError("");
    await store.getState().init();
    if (store.getState().termId !== termId || store.getState().termStatus !== "ready") await store.getState().setTerm(termId);
    const state = store.getState();
    if (state.termId !== termId || state.termStatus !== "ready") {
      setError("This term couldn’t be opened. Try again.");
      setBusy(false);
      return;
    }
    state.showFound();
    if (code) state.addCourse(code);
    router.push("/");
  }

  return <div><Button variant="secondary" size="sm" disabled={busy} onClick={() => void open()}>{code ? "Add to schedule" : "Open in planner"}</Button>{error && <p role="alert" className="pt-6 text-8 text-warning-ink">{error}</p>}</div>;
}
