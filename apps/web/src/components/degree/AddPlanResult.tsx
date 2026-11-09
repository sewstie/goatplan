import Link from "next/link";
import { ArrowRight, Check, WarningCircle } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import type { AddPlanMessage } from "./addPlanMessage";

export function AddPlanResult({ message, className }: { message: AddPlanMessage; className?: string }) {
  const success = message.tone === "success";
  return (
    <div role="status" className={cx("flex items-start gap-10", className)}>
      <span aria-hidden className={cx("flex size-32 shrink-0 items-center justify-center rounded-control [&_svg]:size-16", success ? "bg-success-soft text-success-ink" : "bg-warning-soft text-warning-ink")}>
        {success ? <Check weight="bold" /> : <WarningCircle weight="bold" />}
      </span>
      <span className="flex min-w-0 flex-col gap-2">
        <span className="text-10 leading-14-5 font-570 text-ink">{message.title}</span>
        <span className="text-9 leading-13 text-ink-muted">{message.detail}</span>
        {success && (
          <Link href="/degree" className="mt-4 inline-flex w-fit items-center gap-4 rounded-row text-9 leading-13 font-570 text-accent hover:underline">
            Open My degree <ArrowRight aria-hidden weight="bold" className="size-11" />
          </Link>
        )}
      </span>
    </div>
  );
}
