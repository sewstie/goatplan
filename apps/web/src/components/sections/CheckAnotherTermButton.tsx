"use client";

import { CalendarBlank } from "@phosphor-icons/react/ssr";
import { useTermsWithCourse } from "@/components/courses/useTermsWithCourse";
import { Button } from "@/components/ui/Button";
import { getPlannerStore, usePlanner } from "@/lib/store";

export function CheckAnotherTermButton({ code }: { code: string }) {
  const terms = useTermsWithCourse(code);
  const setTerm = usePlanner((state) => state.setTerm);
  const ready = usePlanner((state) => state.termStatus === "ready");
  const term = terms?.[0];
  if (!term) return null;
  return (
    <Button
      variant="secondary"
      size="md"
      fullWidth
      className="mt-4"
      icon={<CalendarBlank aria-hidden />}
      disabled={!ready}
      aria-label={`Check another term for ${code}: ${term.name}`}
      onClick={async () => {
        document.getElementById("main")?.focus();
        await setTerm(term.id);
        const state = getPlannerStore().getState();
        if (state.termId === term.id && state.termStatus === "ready") state.addCourse(code);
      }}
    >
      Check another term
    </Button>
  );
}
