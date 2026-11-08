"use client";

import { useState, useSyncExternalStore } from "react";
import { parseTerm } from "@/lib/degree/terms";

const KEY = "goatplan:degree:projects";
export function reservationSnapshot() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
function subscribe(changed: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === KEY || event.key === null) changed(); };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}
export function useRecommendationReservations(blocks: Record<string, string>) {
  const [initial] = useState(reservationSnapshot);
  const revision = useSyncExternalStore(subscribe, reservationSnapshot, () => null);
  if (revision === initial) return { blocks, revision };
  try {
    const value: unknown = JSON.parse(revision ?? "{}");
    const updated = value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).filter(([term, name]) => parseTerm(term) && (name === "IQP" || name === "MQP"))) : {};
    return { blocks: updated as Record<string, string>, revision };
  } catch { return { blocks, revision }; }
}
