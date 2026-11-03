"use client";

import { usePathname, useRouter } from "next/navigation";
import { useGuideSession } from "./guideSession";

export function ReplayGuideButton({ className, label = "How to use GoatPlan" }: { className?: string; label?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const requestReplay = useGuideSession((state) => state.requestReplay);
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        requestReplay();
        if (pathname !== "/") router.push("/");
      }}
    >
      {label}
    </button>
  );
}
