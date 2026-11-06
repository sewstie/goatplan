"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isDegreeAvailable } from "@/lib/flags";

type GateState = "checking" | "allowed" | "denied";

export function DegreeGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<GateState>("checking");

  useEffect(() => {
    const allowed = isDegreeAvailable();
    const resolve = () => setState(allowed ? "allowed" : "denied");
    resolve();
    if (!allowed) router.replace("/");
  }, [router]);

  if (state !== "allowed") return null;
  return <>{children}</>;
}
