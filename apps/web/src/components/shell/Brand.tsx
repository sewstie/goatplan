import Image from "next/image";
import Link from "next/link";
import { cx } from "@/components/ui/cx";

/**
 * The GoatPlan logo and wordmark. The default "sidebar" variant keeps the bottom padding that
 * separates it from the courses below. The "phone" variant drops that padding so it reads as a
 * compact brand row above the header on a phone, where the sidebar is hidden.
 */
export function Brand({ variant = "sidebar" }: { variant?: "sidebar" | "phone" | "bar" }) {
  return (
    <div className={cx("flex", variant === "sidebar" && "pb-20")}>
      <Link href="/" aria-label="GoatPlan" className="flex items-center gap-9 rounded-control">
        <Image src="/brand/goatplan-logo.png" alt="" width={36} height={36} preload className={variant === "bar" ? "size-24" : undefined} />
        <span className={cx("font-750 tracking-title", variant === "bar" ? "text-21 leading-30-45" : "text-21 leading-30-45", variant === "phone" && "max-narrow:sr-only", variant === "bar" && "max-[77.5rem]:sr-only")}>GoatPlan</span>
      </Link>
    </div>
  );
}
