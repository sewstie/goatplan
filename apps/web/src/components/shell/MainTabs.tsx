"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui/cx";

export function MainTabs() {
  const pathname = usePathname();
  const onDegree = pathname === "/degree" || pathname.startsWith("/degree/");
  const tabs = [
    { href: "/", label: "Planner", active: !onDegree },
    { href: "/degree", label: "My degree", active: onDegree },
  ];

  return (
    <nav aria-label="Main" className="flex gap-5">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={cx(
            "flex min-h-34 items-center justify-center rounded-row px-8 text-9 leading-13 whitespace-nowrap wide:px-12 transition-colors",
            tab.active ? "bg-accent-soft font-600 text-accent" : "font-510 text-ink-muted hover:bg-surface-selected hover:text-ink",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
