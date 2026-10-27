"use client";

import { BookmarkSimple, Check } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";

type SaveScheduleButtonProps = {
  saved: boolean;
  disabled: boolean;
  onSave: () => void;
};

/** "Save schedule", or "Saved" with a check while the plan is saved as it is (div.app-12). On phone: icon-only with tooltip. */
export function SaveScheduleButton({ saved, disabled, onSave }: SaveScheduleButtonProps) {
  const phone = usePhoneViewport();

  if (saved) {
    if (phone) {
      return (
        <Tooltip content="Schedule saved" describes={false}>
          <IconButton
            label="Schedule saved"
            icon={<Check aria-hidden />}
            aria-disabled="true"
            aria-live="polite"
            className="min-w-44 min-h-44"
          />
        </Tooltip>
      );
    }
    return (
      <Button variant="soft" aria-label="Schedule saved" aria-disabled="true" icon={<Check aria-hidden />} className="min-w-112" aria-live="polite">
        Saved
      </Button>
    );
  }

  if (phone) {
    return (
      <Tooltip content="Save schedule" describes={false}>
        <IconButton
          label="Save schedule"
          icon={<BookmarkSimple aria-hidden />}
          disabled={disabled}
          onClick={onSave}
          aria-live="polite"
          className="min-w-44 min-h-44"
        />
      </Tooltip>
    );
  }

  return (
    <Button icon={<BookmarkSimple aria-hidden />} disabled={disabled} onClick={onSave} className="min-w-112" aria-live="polite">
      Save schedule
    </Button>
  );
}
