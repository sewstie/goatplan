"use client";

import { MagnifyingGlass } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import { usePlanner } from "@/lib/store";
import { usePhoneScreen } from "./phoneScreen";

/** Looks like the search box; a tap opens the "Find a course" screen, where the real box is. */
export function SearchTrigger() {
  const ready = usePlanner((state) => state.termStatus === "ready");
  const saved = usePlanner((state) => state.savedPlanId !== null);
  const show = usePhoneScreen((state) => state.show);
  const disabled = !ready || saved;

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        disabled={disabled}
        aria-describedby={!ready ? "phone-search-hint" : undefined}
        onClick={() => show("search")}
        className={cx(
          "flex min-h-44 w-full cursor-pointer items-center gap-10 rounded-control border px-12 text-left text-10",
          disabled ? "cursor-not-allowed border-line-disabled bg-surface-disabled text-ink-faint" : "border-line bg-surface text-ink-muted",
        )}
      >
        <MagnifyingGlass aria-hidden className={cx("size-16 shrink-0", disabled ? "opacity-38" : "text-ink opacity-65")} />
        <span>Course code or professor</span>
        <span className="sr-only">. Find a course</span>
      </button>
      {!ready && (
        <p id="phone-search-hint" className="px-2 text-9 text-ink-muted">
          Search works once sections load.
        </p>
      )}
    </div>
  );
}
