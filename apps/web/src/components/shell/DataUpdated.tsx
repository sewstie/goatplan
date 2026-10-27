"use client";

import { formatDataDate } from "@/lib/data/terms";
import { usePlanner } from "@/lib/store";

/**
 * "Course data updated Oct 25, 2026" — the date the selected term's data was last generated.
 * When `termId` is given (the plans page), it looks up that term instead of the store's active one.
 * Returns null before the term list loads or when the term isn't found.
 */
export function DataUpdated({ termId: termIdOverride }: { termId?: string } = {}) {
  const terms = usePlanner((s) => s.terms);
  const storeTermId = usePlanner((s) => s.termId);
  const effectiveTermId = termIdOverride ?? storeTermId;

  const term = effectiveTermId ? terms.find((t) => t.id === effectiveTermId) : null;
  if (!term) return null;

  const formatted = formatDataDate(term.generatedAt);
  if (!formatted) return null;

  return (
    <p className="text-9 font-400 text-ink-muted">
      Course data updated{" "}
      <time dateTime={term.generatedAt}>{formatted}</time>
    </p>
  );
}
