"use client";

import { useSyncExternalStore } from "react";
import { getDegreeSource, type DegreeSnapshot } from "./degreeSource";

const subscribe = (listener: () => void) => getDegreeSource().subscribe(listener);
const getSnapshot = () => getDegreeSource().getSnapshot();
const getServerSnapshot = () => null;

export function useDegree(): DegreeSnapshot | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
