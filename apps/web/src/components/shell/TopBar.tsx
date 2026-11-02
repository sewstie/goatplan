import type { ReactNode } from "react";
import { Brand } from "./Brand";
import { MainTabs } from "./MainTabs";
import { TopBarTerm } from "./TopBarTerm";

/** The side columns share the spare width but never go below their content, so nothing here can overlap. */
export function TopBar({ center, actions }: { center?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="sticky top-0 z-16 grid h-(--size-topbar) shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-8 border-b border-line bg-surface px-12 wide:gap-12 wide:px-20 print:hidden">
      <div className="flex items-center gap-12 wide:gap-16">
        <Brand variant="bar" />
        <MainTabs />
      </div>
      <div className="flex justify-center">{center}</div>
      <div className="flex items-center justify-end gap-6">
        <TopBarTerm />
        {actions}
      </div>
    </header>
  );
}
