"use client";

import { useEffect, useState } from "react";

/**
 * True while the viewport is below the tablet breakpoint (640px), the phone layout. It reads the
 * same `--breakpoint-tablet` token the CSS uses, so the JS and the Tailwind `tablet:` prefix agree.
 * Starts false so the server and the first client render match; it corrects after mount.
 */
export function usePhoneViewport(): boolean {
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(max-width: 39.99rem)");
    const update = () => setPhone(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return phone;
}
