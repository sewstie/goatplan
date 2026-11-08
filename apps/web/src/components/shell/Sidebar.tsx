import type { ReactNode } from "react";
import { SidebarFooter } from "./SidebarFooter";

export function Sidebar({ children, termId, footer }: { children?: ReactNode; termId?: string; footer?: ReactNode }) {
  return (
    <aside
      aria-label="Term and courses"
      className="hidden w-(--size-sidebar) shrink-0 flex-col rounded-panel bg-surface px-11 pt-15 pb-12 tablet:flex"
    >
      {/*
        The 4px padding, taken back by the negative margin, keeps focus rings from being cut off by the scroll edge.
        Relative, so screen-reader-only text in a long result list stays inside the scroll and doesn't stretch the page.
      */}
      <div className="relative -m-4 flex min-h-0 flex-1 flex-col overflow-y-auto p-4">{children}</div>
      <div className="mt-auto pt-10">
        <SidebarFooter termId={termId} extra={footer} />
      </div>
    </aside>
  );
}
