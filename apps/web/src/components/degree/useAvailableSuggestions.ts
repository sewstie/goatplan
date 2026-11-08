"use client";

import { useEffect, useState } from "react";
import type { TermFile } from "@/lib/data/types";
import { EngineClient } from "@/lib/engine";
import { createScheduleCheck } from "@/lib/degree/recommendations/schedules";

export function useAvailableSuggestions(file: TermFile | null, candidates: readonly string[], chosen: readonly string[], attempt = 0) {
  const [answer, setAnswer] = useState<{ file: TermFile; key: string; available: Set<string>; unchecked: boolean } | null>(null);
  const key = JSON.stringify([candidates, chosen, attempt]);

  useEffect(() => {
    if (!file) return;
    let live = true;
    const engine = new EngineClient();
    const schedules = createScheduleCheck(engine);
    const [candidates, chosen] = JSON.parse(key) as string[][];
    async function check() {
      const available = new Set<string>();
      let unchecked = false;
      try {
        for (const code of candidates) {
          if (!live) return;
          const fit = await schedules.fit(file!, [...chosen, code]);
          if (fit === "fits") available.add(code);
          if (fit === "unknown") unchecked = true;
        }
        if (live) setAnswer({ file: file!, key, available, unchecked });
      } finally { engine.dispose(); }
    }
    void check();
    return () => { live = false; engine.dispose(); };
  }, [file, key]);

  return file && answer?.file === file && answer.key === key ? answer : null;
}
