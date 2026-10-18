import Image from "next/image";
import Link from "next/link";

export function Brand() {
  return (
    <div className="flex pb-20">
      <Link href="/" className="flex items-center gap-9 rounded-control">
        <Image src="/brand/goatplan-logo.png" alt="" width={36} height={36} preload />
        <span className="text-21 leading-30-45 font-750 tracking-title">GoatPlan</span>
      </Link>
    </div>
  );
}
