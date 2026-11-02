"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui/cx";
import { useDegreeEnabled } from "@/lib/flags";

/** Planner and My degree. With My degree still hidden there's nothing to switch to, so no tabs show. */
export function MainTabs({ phone = false }: { phone?: boolean }) {
  const degreeEnabled = useDegreeEnabled();
  const pathname = usePathname();
  if (!degreeEnabled) return null;

  const onDegree = pathname === "/degree" || pathname.startsWith("/degree/");
  const tabs = [
    { href: "/", label: "Planner", active: !onDegree },
    { href: "/degree", label: "My degree", active: onDegree },
  ];

  return (
    <nav aria-label="Main" className={cx("flex gap-5", phone && "w-full gap-8")}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={cx(
            "flex min-h-34 items-center justify-center rounded-row px-8 text-9 leading-13 whitespace-nowrap wide:px-12 transition-colors focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none",
            phone && "min-h-44 flex-1",
            tab.active ? "bg-accent-soft font-600 text-accent" : "font-510 text-ink-muted hover:bg-surface-selected hover:text-ink",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
