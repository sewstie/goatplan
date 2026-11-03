"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react/ssr";
import { useModalDialog } from "./useModalDialog";

const DRAWER_TITLE_ID = "drawer-title";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
};

/** A panel from the right, or from the bottom on a phone. The top bar stays in view above it. */
export function Drawer({ open, onClose, children }: DrawerProps) {
  const { ref, handleClose, close } = useModalDialog(open, onClose);
  return (
    <dialog
      ref={ref}
      aria-labelledby={DRAWER_TITLE_ID}
      onClose={handleClose}
      className="fixed inset-x-0 top-(--size-topbar) bottom-0 m-0 h-auto max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 text-ink backdrop:bg-transparent open:flex open:flex-col"
    >
      <div className="flex min-h-0 flex-1 flex-col tablet:flex-row">
        <div aria-hidden onClick={close} className="h-28 shrink-0 bg-scrim-flat tablet:h-auto tablet:flex-1" />
        <div className="-mt-1 flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-t-panel bg-surface shadow-popover tablet:mt-0 tablet:w-(--size-drawer) tablet:flex-none tablet:rounded-none">
          {children}
        </div>
      </div>
    </dialog>
  );
}

type DrawerFrameProps = {
  title: ReactNode;
  onClose: () => void;
  tabs?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
};

/** The inside of a drawer: the "MY DEGREE" title, tabs when there are any, a scrolling body and a footer. */
export function DrawerFrame({ title, onClose, tabs, children, footer }: DrawerFrameProps) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, [title]);

  return (
    <section aria-labelledby={DRAWER_TITLE_ID} className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-20 pt-30 tablet:px-25">
        <div className="flex items-start justify-between gap-12">
          <div className="min-w-0">
            <p className="text-micro leading-13 font-570 tracking-[0.06em] text-ink-muted uppercase">My degree</p>
            <h2 ref={heading} id={DRAWER_TITLE_ID} tabIndex={-1} className="pt-3 text-24 leading-30 font-700 tracking-tight outline-none">
              {title}
            </h2>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="mt-2 flex size-30 shrink-0 cursor-pointer items-center justify-center rounded-row bg-canvas text-ink-muted hover:text-ink">
            <X aria-hidden className="size-14" />
          </button>
        </div>
        {tabs}
        <div role={tabs ? "tabpanel" : undefined} aria-labelledby={tabs ? DRAWER_TITLE_ID : undefined} className="flex flex-1 flex-col pt-20 pb-20">{children}</div>
      </div>
      {footer && <div className="mx-20 flex shrink-0 gap-8 border-t border-line py-19 tablet:mx-25">{footer}</div>}
    </section>
  );
}
