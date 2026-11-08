import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

export type TagTone = "good" | "warn" | "plain";

const TONES: Record<TagTone, string> = {
  good: "bg-success-soft text-success-ink",
  warn: "bg-notice-warning text-notice-warning-ink",
  plain: "bg-neutral-soft text-neutral-ink",
};

export function SuggestionTag({ tone, children }: { tone: TagTone; children: ReactNode }) {
  return <span className={cx("inline-flex items-center rounded-badge px-6 py-2 text-8 leading-12 font-570", TONES[tone])}>{children}</span>;
}
