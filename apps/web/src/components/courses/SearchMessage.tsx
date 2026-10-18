import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

/** The card under the search box when there's nothing to list (div.app-4.md, div.app-5.md). */
export function SearchMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="shrink-0 pb-20">
      <Card className="flex flex-col gap-5 px-12 pt-12 pb-24">
        <h2 className="text-12 leading-19-2 font-700">{title}</h2>
        {children}
      </Card>
    </div>
  );
}
