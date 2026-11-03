import type { ReactNode } from "react";
import { Brand } from "@/components/shell/Brand";
import { PhoneTabBar } from "@/components/shell/PhoneTabBar";

/** The phone top bar: the brand and whatever sits on its right, like the term picker. The tabs live in a bar at the bottom. */
export function PhoneTopBar({ children }: { children?: ReactNode }) {
  return (
    <>
      <div className="sticky top-0 z-10 flex min-h-40 items-center justify-between gap-12 border-b border-line bg-surface px-(--size-phone-gutter) py-4">
        <Brand variant="phone" />
        {children}
      </div>
      <PhoneTabBar />
    </>
  );
}
