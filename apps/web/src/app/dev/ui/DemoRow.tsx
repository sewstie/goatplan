import type { ReactNode } from "react";

export function DemoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-8">
      <h3 className="text-9 leading-13 font-650 text-ink-muted">{label}</h3>
      <div className="flex flex-wrap items-center gap-12">{children}</div>
    </div>
  );
}
