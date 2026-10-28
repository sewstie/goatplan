"use client";

import type { ReactNode } from "react";
import { CaretLeft } from "@phosphor-icons/react/ssr";
import { usePhoneScreen } from "./phoneScreen";

/** "‹ Back to schedule" at the top of a phone screen, with anything that shares its row on the right. */
export function BackLink({ aside }: { aside?: ReactNode }) {
  const show = usePhoneScreen((state) => state.show);
  return (
    <div className="flex items-center justify-between gap-8">
      <button
        type="button"
        onClick={() => show("schedule")}
        className="-ml-4 inline-flex min-h-44 shrink-0 cursor-pointer whitespace-nowrap items-center gap-6 rounded-badge px-4 text-9 text-ink-muted hover:text-ink"
      >
        <CaretLeft aria-hidden className="size-12" />
        Back to schedule
      </button>
      {aside}
    </div>
  );
}
