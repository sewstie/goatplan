"use client";

import { useEffect, useState } from "react";

export const DEGREE_FLAG_KEY = "goatplan:degree:v1";

const ON = "on";

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
    const sync = () => setEnabled(isDegreeEnabled());
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
