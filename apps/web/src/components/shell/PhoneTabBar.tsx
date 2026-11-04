"use client";

import { useDegreeEnabled } from "@/lib/flags";
import { MainTabs } from "./MainTabs";

export function PhoneTabBar() {
  const degreeEnabled = useDegreeEnabled();
  if (!degreeEnabled) return null;
  return (
    <div data-phone-tabs className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface px-(--size-phone-gutter) pt-6 pb-[calc(0.375rem+env(safe-area-inset-bottom))] print:hidden">
      <MainTabs phone />
    </div>
  );
}
