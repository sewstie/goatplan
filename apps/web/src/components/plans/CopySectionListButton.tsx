"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Check, Copy } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";

const COPIED_FOR_MS = 2000;

type CopySectionListButtonProps = {
  text: string;
  /** The preview to select when the clipboard can't be used, so the student can copy it by hand. */
  previewRef: RefObject<HTMLElement | null>;
  onCopied: () => void;
  onFallback: () => void;
  /** Full-width on phones (ticket 13). */
  fullWidth?: boolean;
  /** 44px touch target on phones (ticket 13). */
  phone?: boolean;
};

function selectContents(element: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

/** "Copy section list". After copying it reads "Copied" with a check for a moment, like "Saved". */
export function CopySectionListButton({ text, previewRef, onCopied, onFallback, fullWidth, phone }: CopySectionListButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopied();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED_FOR_MS);
    } catch {
      if (previewRef.current) selectContents(previewRef.current);
      onFallback();
    }
  }

  return (
    <>
      <Button
        size="md"
        icon={copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        onClick={copy}
        fullWidth={fullWidth}
        className={cx(!fullWidth && "min-w-127", phone && "min-h-44")}
      >
        {copied ? "Copied" : "Copy section list"}
      </Button>
      <span role="status" className="sr-only">
        {copied ? "Section list copied." : ""}
      </span>
    </>
  );
}
