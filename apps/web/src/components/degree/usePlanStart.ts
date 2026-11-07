"use client";

import { useSyncExternalStore } from "react";

const KEY = "goatplan:degree:start";
const EVENT = "goatplan:degree-start-changed";
let unsaved: number | null = null;

export function readPlanStart() {
  if (unsaved !== null) return unsaved;
  try { return localStorage.getItem(KEY) === "2027" ? 2027 : 2026; } catch { return 2026; }
}

export function savePlanStart(year: number) {
  const next = year === 2027 ? 2027 : 2026;
  let saved = true;
  try { localStorage.setItem(KEY, String(next)); unsaved = null; } catch { unsaved = next; saved = false; }
  window.dispatchEvent(new Event(EVENT));
  return saved;
}

function subscribe(changed: () => void) {
  const sync = (event: StorageEvent) => { if (event.key === KEY || event.key === null) { unsaved = null; changed(); } };
  window.addEventListener(EVENT, changed);
  window.addEventListener("storage", sync);
  return () => { window.removeEventListener(EVENT, changed); window.removeEventListener("storage", sync); };
}

export function usePlanStart() {
  return useSyncExternalStore(subscribe, readPlanStart, () => 2026);
}
