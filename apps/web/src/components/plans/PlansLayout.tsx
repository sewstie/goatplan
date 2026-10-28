"use client";

import type { ReactNode } from "react";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";

/** The phone layout of /plans below the tablet breakpoint, the shell with sidebar from there up. */
export function PlansLayout({ phone, children }: { phone: ReactNode; children: ReactNode }) {
  return usePhoneViewport() ? phone : children;
}
