"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Sheet } from "@/components/ui/Sheet";

export function DialogDemo() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" size="md" onClick={() => setDialogOpen(true)}>
        Open dialog
      </Button>
      <Button variant="secondary" size="md" onClick={() => setSheetOpen(true)}>
        Open sheet
      </Button>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Example dialog"
        description="Sample text. Escape, the close button or a click outside closes it, and focus goes back to the button that opened it."
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="md" onClick={() => setDialogOpen(false)}>
              Confirm
            </Button>
          </>
        }
      />

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Example sheet">
        <p className="text-11 leading-20-35 text-ink-muted">
          Sample text. On tablets the course details panel can open in this sheet.
        </p>
      </Sheet>
    </>
  );
}
