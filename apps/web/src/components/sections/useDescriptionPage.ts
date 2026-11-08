import { useEffect, useRef, useState } from "react";

/**
 * Whether the details panel shows the course description instead of its sections.
 * A click on another calendar block (a new resetKey) goes back to the sections.
 */
export function useDescriptionPage(resetKey: string | null) {
  const [openFor, setOpenFor] = useState<{ key: string | null } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const returning = useRef(false);
  if (openFor && openFor.key !== resetKey) setOpenFor(null);
  const reading = openFor?.key === resetKey;

  useEffect(() => {
    if (reading || !returning.current) return;
    returning.current = false;
    button.current?.focus();
  }, [reading]);

  return {
    reading,
    button,
    open: () => setOpenFor({ key: resetKey }),
    back: () => {
      returning.current = true;
      setOpenFor(null);
    },
  };
}
