import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cx } from "@/components/ui/cx";

type SearchMessageProps = {
  title: string;
  /** A card that ends with a button has less space under it (div.app-5.png). */
  endsWithButton?: boolean;
  children: ReactNode;
};

/** The card under the search box when there's nothing to list (div.app-4.md, div.app-5.md). */
export function SearchMessage({ title, endsWithButton = false, children }: SearchMessageProps) {
  return (
    <div className="shrink-0 pb-20">
      <Card className={cx("flex flex-col gap-5 px-12 pt-12", endsWithButton ? "pb-13" : "pb-24")}>
        <h2 className="text-12 leading-19-2 font-700">{title}</h2>
        {children}
      </Card>
    </div>
  );
}
