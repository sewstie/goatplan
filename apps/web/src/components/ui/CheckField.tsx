import type { ComponentProps, ReactNode } from "react";
import { Check } from "@phosphor-icons/react/ssr";
import { cx } from "./cx";

type CheckFieldProps = Omit<ComponentProps<"input">, "type"> & {
  label: ReactNode;
  description?: ReactNode;
  /** The label's text style. */
  labelClassName?: string;
};

export function CheckBox({ className, small = false, ...rest }: Omit<ComponentProps<"input">, "type"> & { small?: boolean }) {
  return (
    <span className={cx("relative flex shrink-0 items-center justify-center", small ? "size-13" : "size-16", className)}>
      <input
        type="checkbox"
        className={cx("peer cursor-[inherit] appearance-none rounded-swatch border border-ink-secondary bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:border-line-strong", small ? "size-13" : "size-16")}
        {...rest}
      />
      <Check aria-hidden weight="bold" className={cx("pointer-events-none absolute text-ink opacity-0 peer-checked:opacity-100", small ? "size-9" : "size-11")} />
    </span>
  );
}

/** A square tick box with its label, and a line of explanation under the label when there's one. */
export function CheckField({ label, description, labelClassName, className, ...rest }: CheckFieldProps) {
  return (
    <label className={cx("flex cursor-pointer items-start gap-13 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60", className)}>
      <CheckBox className="mt-1" {...rest} />
      <span className="flex min-w-0 flex-col gap-4">
        <span className={labelClassName ?? "text-9 leading-16 font-570 text-ink"}>{label}</span>
        {description && <span className="text-8-5 leading-16 text-ink-muted">{description}</span>}
      </span>
    </label>
  );
}
