import type { ReactNode } from "react";
import { Brand } from "@/components/shell/Brand";
import { MainTabs } from "@/components/shell/MainTabs";

/** The phone top bar on every page: the goat, Planner and My degree, and whatever the page puts on the right. */
export function PhoneTopBar({ children }: { children?: ReactNode }) {
  return (
    <div data-phone-topbar className="sticky top-0 z-10 flex min-h-(--size-topbar) items-center gap-8 border-b border-line bg-surface px-(--size-phone-gutter) py-4">
      <Brand variant="mark" />
      <MainTabs />
      <div className="ml-auto flex shrink-0 items-center">{children}</div>
    </div>
  );
}
