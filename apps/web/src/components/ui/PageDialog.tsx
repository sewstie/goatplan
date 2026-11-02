"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react/ssr";
import { PageFooter } from "@/components/shell/PageFooter";
import { cx } from "./cx";
import { useModalDialog } from "./useModalDialog";

type PageDialogProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** "Planner / C Term 2027", at the top left of the page behind the card. */
  breadcrumb?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** The bigger of the two card widths, for the pin decisions. */
  wide?: boolean;
  termId?: string;
};

/**
 * A modal that takes over the page under the top bar: the card sits on the plain page background, with
 * the footer below it. On a phone there's no card, and it reads as a page of its own.
 */
export function PageDialog({ open, onClose, title, description, breadcrumb, children, footer, wide = false, termId }: PageDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const { ref, handleClose, close } = useModalDialog(open, onClose);

  useEffect(() => {
    if (open) heading.current?.focus();
  }, [open, title]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={handleClose}
      className="fixed inset-x-0 top-(--size-topbar) bottom-0 m-0 h-auto max-h-none w-full max-w-none overflow-y-auto bg-canvas p-0 text-ink backdrop:bg-transparent"
    >
      <div className="flex min-h-full flex-col">
        {breadcrumb && <p className="px-(--size-phone-gutter) pt-22 text-8-5 leading-16 text-ink-muted tablet:px-28">{breadcrumb}</p>}
        <div className="flex flex-1 items-start justify-center tablet:items-center tablet:px-16 tablet:py-24">
          <div className={cx("flex w-full flex-col px-(--size-phone-gutter) pt-16 pb-20 tablet:rounded-panel tablet:border tablet:border-card-line tablet:bg-surface tablet:p-28 tablet:shadow-guide", wide ? "tablet:w-544" : "tablet:w-(--size-modal-page)")}>
            <div className="flex items-start justify-between gap-12">
              <h2 ref={heading} id={titleId} tabIndex={-1} className="text-24 leading-30 font-700 tracking-tight outline-none">
                {title}
              </h2>
              <button type="button" aria-label="Close" onClick={close} className="flex size-30 shrink-0 cursor-pointer items-center justify-center rounded-row bg-surface-selected text-ink-muted hover:text-ink tablet:bg-canvas">
                <X aria-hidden className="size-14" />
              </button>
            </div>
            {description && <p id={descriptionId} className="pt-12 text-10 leading-17-5 text-ink-muted">{description}</p>}
            {children}
            {footer && <div className="mt-16 flex flex-wrap justify-end gap-8 border-t border-line pt-22">{footer}</div>}
          </div>
        </div>
        <PageFooter termId={termId} />
      </div>
    </dialog>
  );
}
