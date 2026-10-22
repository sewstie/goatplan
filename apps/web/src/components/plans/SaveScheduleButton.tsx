"use client";

import { BookmarkSimple, Check } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";

type SaveScheduleButtonProps = {
  saved: boolean;
  disabled: boolean;
  onSave: () => void;
};

/** "Save schedule", or "Saved" with a check while the plan is saved as it is (div.app-12). */
export function SaveScheduleButton({ saved, disabled, onSave }: SaveScheduleButtonProps) {
  if (saved) {
    return (
      <Button variant="soft" aria-label="Schedule saved" aria-disabled="true" icon={<Check aria-hidden />} className="min-w-112" aria-live="polite">
        Saved
      </Button>
    );
  }
  return (
    <Button icon={<BookmarkSimple aria-hidden />} disabled={disabled} onClick={onSave} className="min-w-112" aria-live="polite">
      Save schedule
    </Button>
  );
}
