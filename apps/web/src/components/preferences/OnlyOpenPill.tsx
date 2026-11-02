import { CheckCircle, Circle } from "@phosphor-icons/react/ssr";

type OnlyOpenPillProps = {
  id?: string;
  checked: boolean;
  disabled?: boolean;
  onChange(checked: boolean): void;
};

export function OnlyOpenPill({ id, checked, disabled = false, onChange }: OnlyOpenPillProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-32 shrink-0 cursor-pointer items-center gap-6 rounded-pill bg-surface px-11 text-9 leading-13 text-ink disabled:cursor-default max-tablet:min-h-44"
    >
      {checked ? <CheckCircle aria-hidden className="size-14" /> : <Circle aria-hidden className="size-14 text-ink-muted" />}
      Only open sections
    </button>
  );
}
