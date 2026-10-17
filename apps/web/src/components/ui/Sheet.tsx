"use client";

import { useId, type ReactNode } from "react";
import { X } from "@phosphor-icons/react/ssr";
import { IconButton } from "./IconButton";
import { useModalDialog } from "./useModalDialog";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children?: ReactNode;
};

export function Sheet({ open, onClose, title, children }: SheetProps) {
  const titleId = useId();
  const { ref, handleClose, handlePointerDown, handleBackdropClick, close } = useModalDialog(open, onClose);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={handleClose}
      onPointerDown={handlePointerDown}
      onClick={handleBackdropClick}
      className="my-0 mr-0 ml-auto h-dvh max-h-dvh w-[calc(var(--size-details)+2*var(--size-app-padding))] max-w-[calc(100vw-32px)] rounded-l-panel bg-surface p-0 text-ink shadow-popover backdrop:bg-scrim"
    >
      <div className="flex h-full flex-col gap-12 overflow-y-auto px-16 py-20">
        <div className="flex items-start justify-between gap-12">
          <h2 id={titleId} className="text-21 leading-25-2 font-700 tracking-heading">
            {title}
          </h2>
          <IconButton
            variant="ghost"
            label="Close"
            icon={<X />}
            onClick={close}
            className="mt-6 text-ink-muted [&_svg]:size-12"
          />
        </div>
        {children}
      </div>
    </dialog>
  );
}
