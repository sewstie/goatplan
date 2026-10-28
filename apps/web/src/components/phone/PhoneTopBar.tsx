import type { ReactNode } from "react";
import { Brand } from "@/components/shell/Brand";

/** The phone top bar: the brand, and whatever sits on its right, like the term picker. */
export function PhoneTopBar({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-(--size-phone-bar) items-center justify-between gap-12 border-b border-line bg-surface px-(--size-phone-gutter)">
      <Brand variant="phone" />
      {children}
    </div>
  );
}
