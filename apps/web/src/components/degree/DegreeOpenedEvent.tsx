"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/track";

export function DegreeOpenedEvent() {
  useEffect(() => {
    track("degree_opened");
  }, []);
  return null;
}
