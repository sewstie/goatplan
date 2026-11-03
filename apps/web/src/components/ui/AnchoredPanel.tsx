"use client";

import { useId, type ReactNode, type RefObject } from "react";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { Popover } from "./Popover";
import { Sheet } from "./Sheet";

type AnchoredPanelProps = {
  id: string;
  title: string;
  anchor: RefObject<HTMLElement | null>;
  onClose(): void;
  initialFocus?: RefObject<HTMLElement | null>;
  children: ReactNode;
};

/** A quick action under its button: a popover from the tablet breakpoint up, a bottom sheet on a phone. */
export function AnchoredPanel({ id, title, anchor, onClose, initialFocus, children }: AnchoredPanelProps) {
  const phone = usePhoneViewport();
  const titleId = useId();

  if (phone) {
    return (
      <Sheet open onClose={onClose} title={title} side="bottom" lightScrim>
        <div id={id} className="flex flex-col">{children}</div>
      </Sheet>
    );
  }

  return (
    <Popover id={id} labelledBy={titleId} anchor={anchor} onClose={onClose} initialFocus={initialFocus}>
      <h2 id={titleId} className="text-12 leading-17-4 font-700 text-ink">{title}</h2>
      {children}
    </Popover>
  );
}
