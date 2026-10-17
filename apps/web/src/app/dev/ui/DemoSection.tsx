import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

type DemoSectionProps = {
  title: string;
  note?: string;
  children: ReactNode;
};

export function DemoSection({ title, note, children }: DemoSectionProps) {
  return (
    <Card as="section" variant="panel" aria-label={title} className="flex flex-col gap-16 px-20 py-20">
      <div className="flex flex-col gap-4">
        <h2 className="text-19 leading-24-7 font-700 tracking-heading">{title}</h2>
        {note && <p className="text-10 leading-14-5 text-ink-muted">{note}</p>}
      </div>
      {children}
    </Card>
  );
}
