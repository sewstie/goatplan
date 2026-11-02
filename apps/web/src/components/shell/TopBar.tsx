import type { ReactNode } from "react";
import { Brand } from "./Brand";
import { MainTabs } from "./MainTabs";
import { TopBarTerm } from "./TopBarTerm";

type TopBarProps = {
  /** The planner's schedule switcher. */
  center?: ReactNode;
  /** The planner's Share, Export, Save and Saved plans. */
  actions?: ReactNode;
};

/** The one bar above every page from the tablet breakpoint up. The equal side columns keep the center where it is. */
export function TopBar({ center, actions }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 grid h-(--size-topbar) shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-12 border-b border-line bg-surface px-20 print:hidden">
      <div className="flex min-w-0 items-center gap-16">
        <Brand variant="bar" />
        <MainTabs />
      </div>
      <div className="flex min-w-0 justify-center">{center}</div>
      <div className="flex min-w-0 items-center justify-end gap-6">
        <TopBarTerm />
        {actions}
      </div>
    </header>
  );
}
