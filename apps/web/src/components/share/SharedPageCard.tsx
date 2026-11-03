"use client";

import { useId, type ReactNode } from "react";
import { useModalDialog } from "@/components/ui/useModalDialog";

type SharedPageCardProps = {
  icon: ReactNode;
  title: string;
  onClose(): void;
  children: ReactNode;
};

/** The whole page under the top bar, with one centered message about a shared link. */
export function SharedPageCard({ icon, title, onClose, children }: SharedPageCardProps) {
  const titleId = useId();
  const { ref, handleClose } = useModalDialog(true, onClose);
  return (
    <dialog ref={ref} aria-labelledby={titleId} onClose={handleClose} className="fixed inset-x-0 top-(--size-topbar) bottom-0 m-0 h-auto max-h-none w-full max-w-none overflow-y-auto bg-canvas p-0 text-ink backdrop:bg-transparent">
      <div className="flex min-h-full flex-col">
        <div className="flex flex-1 items-center justify-center px-(--size-phone-gutter) py-24">
          <div className="flex w-full max-w-560 flex-col items-center rounded-panel border border-card-line bg-surface px-20 py-40 text-center tablet:px-34">
            <span aria-hidden className="flex size-56 items-center justify-center rounded-tile bg-accent-soft text-ink [&_svg]:size-26">{icon}</span>
            <h1 id={titleId} className="pt-20 text-24 leading-30 font-700 tracking-tight">{title}</h1>
            {children}
          </div>
        </div>
      </div>
    </dialog>
  );
}
