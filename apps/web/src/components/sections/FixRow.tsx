import { CaretRight } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

export function FixRow({ icon, title, detail, label, recommended = false, disabled, onClick }: {
  icon: ReactNode;
  title: string;
  detail: string;
  label?: string;
  recommended?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "group flex w-full cursor-pointer items-center gap-10 px-11 py-10 text-left transition-colors focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        recommended ? "bg-choice-surface not-disabled:hover:bg-accent-soft" : "not-disabled:hover:bg-surface-selected",
      )}
    >
      <span
        aria-hidden
        className={cx(
          "flex size-28 shrink-0 items-center justify-center rounded-full [&_svg]:size-15",
          recommended ? "bg-accent text-on-accent" : "bg-surface-subtle text-ink-muted",
        )}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-10 leading-14-5 font-600 text-ink">{title}</span>
        <span className="text-8 leading-11-6 text-ink-muted">{detail}</span>
      </span>
      <CaretRight aria-hidden className="size-14 shrink-0 text-ink-faint transition-transform motion-safe:group-not-disabled:group-hover:translate-x-2" />
    </button>
  );
}
