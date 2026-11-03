import type { ReactNode } from "react";
import { Brand } from "./Brand";
import { DataUpdated } from "./DataUpdated";
import { SupportLinks } from "./SupportLinks";

import type { ReactNode } from "react";
import { usePlanner } from "@/lib/store";

export function Sidebar({ children }: { children?: ReactNode; termId?: string }) {
  const shared = usePlanner((state) => state.temporaryPlan !== null);
  return (
    <aside
      aria-label="Term and courses"
      className="hidden w-(--size-sidebar) shrink-0 flex-col rounded-panel bg-surface px-13 pt-17 pb-14 tablet:flex"
    >
      {top && <div className="shrink-0 pb-10">{top}</div>}
      {/*
        The 4px padding, taken back by the negative margin, keeps focus rings from being cut off by the scroll edge.
        Relative, so screen-reader-only text in a long result list stays inside the scroll and doesn't stretch the page.
      */}
      <div className="relative -m-4 flex min-h-0 flex-1 flex-col overflow-y-auto p-4">{children}</div>
      <div className="mt-auto flex shrink-0 flex-col gap-2 border-t border-line pt-10.75">
        <DataUpdated termId={termId} />
        <SupportLinks />
      </div>
    </aside>
  );
}
