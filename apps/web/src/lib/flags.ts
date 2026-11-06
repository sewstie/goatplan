"use client";

import { useEffect, useState } from "react";
import { isDegreeReleased, SHEETS } from "./degree/sheets";

export const DEGREE_FLAG_KEY = "goatplan:degree:v1";

const ON = "on";

export function isDegreeAvailable(): boolean {
  return isDegreeReleased() || isDegreeEnabled();
}

export function isSheetAvailable(id: string): boolean {
  const sheet = SHEETS.find((item) => item.id === id);
  return !!sheet && (isDegreeEnabled() || (isDegreeReleased() && sheet.status === "checked"));
}

export function isDegreeEnabled(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(DEGREE_FLAG_KEY) === ON;
  } catch {
    return false;
  }
}

export function enableDegree(): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DEGREE_FLAG_KEY, ON);
  } catch {
    // Blocked storage: the flag just isn't kept, and the feature stays hidden.
  }
}

export function disableDegree(): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(DEGREE_FLAG_KEY);
  } catch {
    // Blocked storage: nothing was there to remove.
  }
}

export function useDegreeEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => setEnabled(isDegreeAvailable());
    sync();

    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === DEGREE_FLAG_KEY || event.key === null) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return enabled;
}
