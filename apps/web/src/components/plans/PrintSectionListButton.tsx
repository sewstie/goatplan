"use client";

import { Printer } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";

type PrintSectionListButtonProps = {
  /** Full-width on phones (ticket 13). */
  fullWidth?: boolean;
  /** 44px touch target on phones (ticket 13). */
  phone?: boolean;
};

export function PrintSectionListButton({ fullWidth, phone }: PrintSectionListButtonProps = {}) {
  return (
    <Button
      size="md"
      variant="secondary"
      icon={<Printer aria-hidden />}
      onClick={() => window.print()}
      fullWidth={fullWidth}
      className={cx(phone && "min-h-44")}
    >
      Print
    </Button>
  );
}
