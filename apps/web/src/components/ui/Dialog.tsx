"use client";

import { useId, type ReactNode } from "react";
import { X } from "@phosphor-icons/react/ssr";
import { IconButton } from "./IconButton";
import { useModalDialog } from "./useModalDialog";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
};

export function Dialog({ open, onClose, title, description, children, footer }: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const { ref, handleClose, handlePointerDown, handleBackdropClick, close } = useModalDialog(open, onClose);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={handleClose}
      onPointerDown={handlePointerDown}
      onClick={handleBackdropClick}
      className="m-auto w-(--size-message) max-w-[calc(100vw-32px)] rounded-message bg-surface p-0 text-ink shadow-popover backdrop:bg-scrim"
    >
      <div className="flex flex-col gap-6 px-20 pt-24 pb-20">
        <div className="flex items-start justify-between gap-12">
          <h2 id={titleId} className="text-17 leading-23-8 font-700 tracking-message">
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
        {description && (
          <p id={descriptionId} className="text-11 leading-19-8 text-ink-muted">
            {description}
          </p>
        )}
        {children}
        {footer && <div className="flex flex-wrap justify-end gap-8 pt-9">{footer}</div>}
      </div>
    </dialog>
  );
}
