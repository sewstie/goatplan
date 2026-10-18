"use client";

import { useSyncExternalStore } from "react";
import { getPlansSource, type PlansSnapshot } from "./plansSource";

const subscribe = (listener: () => void) => getPlansSource().subscribe(listener);
const getSnapshot = () => getPlansSource().getSnapshot();
const getServerSnapshot = () => null;

/** The saved plans in this browser, or null before they're read (on the server and while hydrating). */
export function usePlans(): PlansSnapshot | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
