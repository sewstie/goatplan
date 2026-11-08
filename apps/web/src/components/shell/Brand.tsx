import Image from "next/image";
import Link from "next/link";
import { cx } from "@/components/ui/cx";

export function Brand({ variant = "sidebar" }: { variant?: "sidebar" | "bar" | "mark" }) {
  return (
    <div className={cx("flex", variant === "sidebar" && "pb-20")}>
      <Link href="/" aria-label="GoatPlan" className={cx("block shrink-0 overflow-hidden rounded-control", variant === "bar" && "max-[77.5rem]:w-44", variant === "mark" && "w-44")}>
        <Image src="/brand/logo.png" alt="" width={144} height={48} preload className="brand-logo h-48 w-144 max-w-none" />
      </Link>
    </div>
  );
}
