import type { ReactNode } from "react";

/** An icon and a line of text, as in the section cards of the details panel. */
export function MetaRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-8 text-9 leading-13-5 text-ink">
      <span aria-hidden className="flex h-13.5 shrink-0 items-center [&_svg]:size-12">
        {icon}
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}
