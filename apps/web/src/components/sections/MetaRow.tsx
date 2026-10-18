import type { ReactNode } from "react";

type MetaRowProps = {
  icon: ReactNode;
  children: ReactNode;
};

/** A section fact with its icon: clock, room, seats or instructor. */
export function MetaRow({ icon, children }: MetaRowProps) {
  return (
    <li className="flex items-start gap-8 text-9 leading-13-5 text-ink">
      <span aria-hidden className="flex h-13.5 shrink-0 items-center [&_svg]:size-12">
        {icon}
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}
