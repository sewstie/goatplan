import type { ReactNode } from "react";
import { Brand } from "@/components/shell/Brand";
import { MainTabs } from "@/components/shell/MainTabs";

/** The phone top bar: the brand, whatever sits on its right, like the term picker, and Planner and My degree under them. */
export function PhoneTopBar({ children }: { children?: ReactNode }) {
  return (
    <div className="sticky top-0 z-10 flex flex-col border-b border-line bg-surface px-(--size-phone-gutter) py-10">
      <div className="flex min-h-40 items-center justify-between gap-12">
        <Brand variant="phone" />
        {children}
      </div>
      <MainTabs phone />
    </div>
  );
}
