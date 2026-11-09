"use client";

import { createContext, useContext, useEffect, useRef, type MouseEvent, type PointerEvent, type RefObject } from "react";

export const ModalReturnFocusContext = createContext<RefObject<HTMLElement | null> | null>(null);

export const MODAL_OPEN = "dialog[open]";
const FOCUSABLE = "button:not(:disabled):not([tabindex='-1']), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])";

/** Back to what opened the dialog, or to the screen's heading when that's gone. */
function restoreFocus(target: HTMLElement | null) {
  if (target?.isConnected) target.focus();
  else document.querySelector<HTMLElement>("[data-screen-heading]")?.focus();
}

export function useModalDialog(open: boolean, onClose: () => void) {
  const returnTarget = useContext(ModalReturnFocusContext);
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);
  const pressStartedOnBackdrop = useRef(false);
  const closingFromState = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocusTo.current = returnTarget?.current ?? document.activeElement as HTMLElement | null;
      dialog.showModal();
      const start = dialog.querySelector<HTMLElement>("[data-autofocus]");
      (start?.matches(FOCUSABLE) || start?.hasAttribute("tabindex") ? start : start?.querySelector<HTMLElement>(FOCUSABLE))?.focus();
    } else if (!open && dialog.open) {
      closingFromState.current = true;
      dialog.close();
      restoreFocus(returnFocusTo.current);
      returnFocusTo.current = null;
    }
  }, [open, returnTarget]);

  // Some screens remove the dialog while it's open, which never fires its close event.
  useEffect(
    () => () => {
      if (!returnFocusTo.current) return;
      restoreFocus(returnFocusTo.current);
      returnFocusTo.current = null;
    },
    [],
  );

  function handleClose() {
    if (closingFromState.current) {
      closingFromState.current = false;
      return;
    }
    restoreFocus(returnFocusTo.current);
    returnFocusTo.current = null;
    onClose();
  }

  function handlePointerDown(event: PointerEvent<HTMLDialogElement>) {
    pressStartedOnBackdrop.current = event.target === event.currentTarget;
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (pressStartedOnBackdrop.current && event.target === event.currentTarget) {
      event.currentTarget.close();
    }
    pressStartedOnBackdrop.current = false;
  }

  function close() {
    ref.current?.close();
  }

  return { ref, handleClose, handlePointerDown, handleBackdropClick, close };
}
