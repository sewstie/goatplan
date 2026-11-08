"use client";

import { useId, type ComponentProps } from "react";
import { cx } from "./cx";
import { Listbox } from "./Listbox";

type ListboxFieldProps = Omit<ComponentProps<typeof Listbox>, "variant" | "menuLabel"> & { fieldClassName?: string };

export function ListboxField({ label, fieldClassName, id, ...props }: ListboxFieldProps) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <div className={cx("flex flex-col", fieldClassName)}>
      <label htmlFor={fieldId} aria-hidden className="pb-5 text-10 leading-14-5 font-650 text-ink">{label}</label>
      <Listbox id={fieldId} label={label} {...props} />
    </div>
  );
}
