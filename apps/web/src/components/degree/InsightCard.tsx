import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";

type InsightCardProps = {
  title: string;
  badge?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function InsightCard({ title, badge, action, children }: InsightCardProps) {
  return (
    <article className="flex flex-col rounded-panel border border-card-line bg-surface px-17 py-18 tablet:px-14 tablet:py-12">
      <div className="flex min-h-26 items-center justify-between gap-12 pb-12 tablet:pb-6">
        <h3 className="text-10 leading-16-5 font-650">{title}</h3>
        {badge && <Badge className="px-6! py-2! text-8! leading-12!">{badge}</Badge>}
        {action}
      </div>
      {children}
    </article>
  );
}
