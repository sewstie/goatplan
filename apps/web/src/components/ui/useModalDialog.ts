"use client";

import { useEffect, useRef, type MouseEvent, type PointerEvent } from "react";

export function useModalDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);
  const pressStartedOnBackdrop = useRef(false);
  const closingFromState = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocusTo.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      closingFromState.current = true;
      dialog.close();
      returnFocusTo.current?.focus();
      returnFocusTo.current = null;
    }
  }, [open]);

  function handleClose() {
    if (closingFromState.current) {
      closingFromState.current = false;
      return;
    }
    returnFocusTo.current?.focus();
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
