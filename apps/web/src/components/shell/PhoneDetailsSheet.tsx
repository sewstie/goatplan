"use client";

import type { ReactNode } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { usePlanner } from "@/lib/store";

type PhoneDetailsSheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

/**
 * On a phone the course details live in a bottom sheet instead of a side panel. It opens only when
 * the student taps a course row or a search result, not when the selected course changes on its own,
 * so the shell owns the `open` state. Closing the sheet keeps the selection; it never clears it.
 */
export function PhoneDetailsSheet({ open, onClose, children }: PhoneDetailsSheetProps) {
  const code = usePlanner((state) => state.selectedCourse);
  const title = code ?? "Course details";

  return (
    <Sheet open={open} onClose={onClose} title={title} side="bottom">
      {children}
    </Sheet>
  );
}
