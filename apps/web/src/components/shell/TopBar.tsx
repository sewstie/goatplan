import type { ReactNode } from "react";
import { Brand } from "./Brand";
import { MainTabs } from "./MainTabs";

type TopBarProps = {
  center?: ReactNode;
  actions?: ReactNode;
  navigation?: ReactNode;
  appearance?: ReactNode;
};

export function TopBar({ center, actions, navigation = <MainTabs />, appearance }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-(--size-topbar) shrink-0 items-center justify-between gap-8 border-b border-line bg-surface px-12 wide:gap-12 print:hidden">
      <div className="flex items-center gap-12 wide:gap-16">
        <Brand variant="bar" />
        {navigation}
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-center">{center}</div>
      <div className="flex items-center justify-end gap-6">{actions}{appearance}</div>
    </header>
  );
}
