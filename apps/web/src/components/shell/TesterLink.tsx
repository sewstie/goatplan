"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { enableDegree } from "@/lib/flags";

export const ENABLE_DEGREE_HASH = "#enable-degree";

export function TesterLink() {
  const router = useRouter();

  useEffect(() => {
    const handle = () => {
      if (window.location.hash !== ENABLE_DEGREE_HASH) return;
      enableDegree();
      // Drop the hash from the address bar without adding a history entry.
      const { pathname, search } = window.location;
      window.history.replaceState(null, "", pathname + search);
      router.push("/degree");
    };

    handle();
    window.addEventListener("hashchange", handle);
    return () => window.removeEventListener("hashchange", handle);
  }, [router]);

  return null;
}
