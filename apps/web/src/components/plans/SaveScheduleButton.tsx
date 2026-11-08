"use client";

import { BookmarkSimple, Check } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";

type SaveScheduleButtonProps = {
  saved: boolean;
  disabled: boolean;
  onSave: () => void;
};

/** "Save", or "Saved" with a check while the plan is saved as it is (div.app-12). On phone, it shares a row with the switcher. */
export function SaveScheduleButton({ saved, disabled, onSave }: SaveScheduleButtonProps) {
  const phone = usePhoneViewport();

  if (phone) {
    return (
      saved ? (
        <Button fullWidth aria-label="Schedule saved" aria-disabled="true" icon={<Check aria-hidden />} className="min-h-44 min-w-90" aria-live="polite">
          Saved
        </Button>
      ) : (
        <Button fullWidth icon={<BookmarkSimple aria-hidden />} disabled={disabled} onClick={onSave} className="min-h-44 min-w-90" aria-live="polite">
          Save
        </Button>
      )
    );
  }

  if (saved) {
    return (
      <Button variant="soft" aria-label="Schedule saved" aria-disabled="true" icon={<Check aria-hidden />} className="tablet:max-wide:min-w-0 min-w-84" aria-live="polite">
        <span className="tablet:max-wide:sr-only">Saved</span>
      </Button>
    );
  }

  return (
    <Button aria-label="Save schedule" icon={<BookmarkSimple aria-hidden />} disabled={disabled} onClick={onSave} className="tablet:max-wide:min-w-0 min-w-84" aria-live="polite">
      <span className="tablet:max-wide:sr-only">Save</span>
    </Button>
  );
}
