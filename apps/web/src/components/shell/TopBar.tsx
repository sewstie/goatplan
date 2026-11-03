import type { ReactNode } from "react";
import { Brand } from "./Brand";
import { MainTabs } from "./MainTabs";

export function TopBar({ center, actions }: { center?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex h-(--size-topbar) shrink-0 items-center justify-between gap-8 border-b border-line bg-surface px-12 wide:gap-12 wide:px-20 print:hidden">
      <div className="flex items-center gap-12 wide:gap-16">
        <Brand variant="bar" />
        <MainTabs />
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-center">{center}</div>
      <div className="flex items-center justify-end gap-6">{actions}</div>
    </header>
  );
}
