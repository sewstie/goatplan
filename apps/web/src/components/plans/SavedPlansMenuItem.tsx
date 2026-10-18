import Link from "next/link";
import type { ReactNode } from "react";

const itemClasses =
  "flex w-full cursor-pointer items-center gap-8 rounded-row px-8 py-7 text-left text-10 leading-14-5 text-ink hover:bg-surface-selected";

type SavedPlansMenuItemProps = {
  /** A link when set, else a button. */
  href?: string;
  onSelect: () => void;
  children: ReactNode;
};

export function SavedPlansMenuItem({ href, onSelect, children }: SavedPlansMenuItemProps) {
  return (
    <li>
      {href ? (
        <Link href={href} className={itemClasses} onClick={onSelect}>
          {children}
        </Link>
      ) : (
        <button type="button" className={itemClasses} onClick={onSelect}>
          {children}
        </button>
      )}
    </li>
  );
}
