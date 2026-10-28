"use client";

import { BookmarkSimple, Check } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";

type SaveScheduleButtonProps = {
  saved: boolean;
  disabled: boolean;
  /** "Unsaved changes" under the phone button while a saved plan has edits. */
  unsaved?: boolean;
  onSave: () => void;
};

/** "Save schedule", or "Saved" with a check while the plan is saved as it is (div.app-12). On phone: "Save" with its status under it. */
export function SaveScheduleButton({ saved, disabled, unsaved = false, onSave }: SaveScheduleButtonProps) {
  const phone = usePhoneViewport();

  if (phone) {
    return (
      <div className="flex w-full flex-col items-center gap-5">
        {saved ? (
          <Button fullWidth aria-label="Schedule saved" aria-disabled="true" icon={<Check aria-hidden />} className="min-h-44" aria-live="polite">
            Saved
          </Button>
        ) : (
          <Button fullWidth icon={<BookmarkSimple aria-hidden />} disabled={disabled} onClick={onSave} className="min-h-44" aria-live="polite">
            Save
          </Button>
        )}
        {saved && <p className="text-8 text-saved">Schedule saved</p>}
        {!saved && unsaved && <p className="text-8 text-ink-muted">Unsaved changes</p>}
      </div>
    );
  }

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
