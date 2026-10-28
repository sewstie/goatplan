import Image from "next/image";
import Link from "next/link";
import { cx } from "@/components/ui/cx";

/**
 * The GoatPlan logo and wordmark. The default "sidebar" variant keeps the bottom padding that
 * separates it from the courses below. The "phone" variant drops that padding so it reads as a
 * compact brand row above the header on a phone, where the sidebar is hidden.
 */
export function Brand({ variant = "sidebar" }: { variant?: "sidebar" | "phone" }) {
  return (
    <div className={cx("flex", variant === "sidebar" && "pb-20")}>
      <Link href="/" className="flex items-center gap-9 rounded-control">
        <Image src="/brand/goatplan-logo.png" alt="" width={36} height={36} preload />
        <span className={cx("text-21 leading-30-45 font-750 tracking-title", variant === "phone" && "max-narrow:sr-only")}>GoatPlan</span>
      </Link>
    </div>
  );
}
