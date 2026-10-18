import type { ReactNode } from "react";
import { Brand } from "./Brand";
import { SupportLinks } from "./SupportLinks";

export function Sidebar({ children }: { children?: ReactNode }) {
  return (
    <aside
      aria-label="Term and courses"
      className="flex w-(--size-sidebar) shrink-0 flex-col rounded-panel bg-surface px-16 pt-22 pb-15"
    >
      <Brand />
      {/* The 4px padding, taken back by the negative margin, keeps focus rings from being cut off by the scroll edge. */}
      <div className="-m-4 flex min-h-0 flex-1 flex-col overflow-y-auto p-4">{children}</div>
      <SupportLinks />
    </aside>
  );
}
