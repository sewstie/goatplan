import Image from "next/image";

export function Brand() {
  return (
    <div className="flex items-center gap-9 pb-20">
      <Image src="/brand/goatplan-logo.png" alt="" width={36} height={36} preload />
      <span className="text-21 leading-30-45 font-750 tracking-title">GoatPlan</span>
    </div>
  );
}
