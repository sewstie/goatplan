"use client";

import type { ReactNode } from "react";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";

export function DegreeLayout({ phone, children }: { phone: ReactNode; children: ReactNode }) {
  return usePhoneViewport() ? phone : children;
}
