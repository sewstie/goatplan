import type { ReactNode } from "react";
import { X } from "@phosphor-icons/react/ssr";
import { cx } from "./cx";
import { IconButton } from "./IconButton";

type ChipProps = {
  id?: string;
  variant?: "solid" | "dashed";
  icon?: ReactNode;
  label?: ReactNode;
  value?: ReactNode;
  detail?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  /** Makes it a toggle button (aria-pressed), drawn solid in the accent color while pressed. */
  pressed?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
};

const variantClasses = {
  solid: "min-h-32 gap-6 px-10",
  dashed: "min-h-30 gap-5 border px-10",
};

const colorClasses = {
  solid: "bg-surface text-ink",
  dashed: "border-dashed border-line-strong text-ink",
};

const pressedClasses = "border-accent bg-accent-soft font-600 text-accent";

export function Chip({
  id,
  variant = "solid",
  icon,
  label,
  value,
  detail,
  children,
  onClick,
  pressed,
  onRemove,
  removeLabel = "Remove",
  className,
}: ChipProps) {
  const pill = cx(
    "inline-flex shrink-0 items-center rounded-pill text-9 leading-13 whitespace-nowrap",
    variantClasses[variant],
    pressed ? pressedClasses : colorClasses[variant],
    className,
  );
  const content = (
    <>
      {icon && (
        <span aria-hidden className="flex [&_svg]:size-11">
          {icon}
        </span>
      )}
      {label && <span className="text-ink-muted">{label}</span>}
      {value && <b className="text-10 leading-14-5 font-650">{value}</b>}
      {detail && <span>{detail}</span>}
      {children}
    </>
  );

  if (onRemove) {
    return (
      <span id={id} className={pill}>
        {onClick ? (
          <button
            type="button"
            onClick={onClick}
            className="inline-flex cursor-pointer items-center gap-6 rounded-badge"
          >
            {content}
          </button>
        ) : (
          content
        )}
        <IconButton
          variant="ghost"
          label={removeLabel}
          icon={<X />}
          onClick={onRemove}
          className="ml-2"
        />
      </span>
    );
  }

  if (onClick) {
    return (
      <button
        id={id}
        type="button"
        aria-pressed={pressed}
        onClick={onClick}
        className={cx(pill, "cursor-pointer transition-[color,background-color,border-color]", !pressed && "hover:bg-surface-selected")}
      >
        {content}
      </button>
    );
  }

  return <span id={id} className={pill}>{content}</span>;
}
