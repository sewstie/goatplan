"use client";

import { useEffect } from "react";
import { useDetailsDrawer } from "./detailsDrawer";

const DOCKED = "(min-width: 100rem)";

export function useDockedDetails(): boolean {
  const docked = useDetailsDrawer((state) => state.docked);
  const setDocked = useDetailsDrawer((state) => state.setDocked);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(DOCKED);
    const update = () => setDocked(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [setDocked]);
  return docked;
}
