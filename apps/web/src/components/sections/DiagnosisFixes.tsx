"use client";

import { Clock, Eraser, LockSimpleOpen, Users, X } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import type { DiagnosisFix } from "@/lib/diagnosis/diagnosisText";
import { usePlanner } from "@/lib/store";

const icons = {
  relaxStartsAfter: <Clock aria-hidden />,
  clearBlocked: <Eraser aria-hidden />,
  allowFull: <Users aria-hidden />,
  clearAnyOf: <Users aria-hidden />,
  unlock: <LockSimpleOpen aria-hidden />,
  dropCourse: <X aria-hidden />,
};

export function DiagnosisFixes({ fixes }: { fixes: readonly DiagnosisFix[] }) {
  const applyFix = usePlanner((state) => state.applyFix);
  const ready = usePlanner((state) => state.solveStatus === "done" && state.termStatus === "ready");
  if (fixes.length === 0) return null;
  return (
    <div className="mt-12 flex flex-col gap-8">
      <h3 className="text-10 leading-14-5 font-650">Ways to fix it</h3>
      {fixes.map(({ fix, label, count }, index) => (
        <Button
          key={`${fix.kind}:${"course" in fix ? fix.course : ""}${"startsAfter" in fix ? `:${fix.startsAfter}` : ""}`}
          variant={index === 0 ? "primary" : "secondary"}
          size="md"
          fullWidth
          icon={fix.kind === "relaxStartsAfter" && fix.startsAfter === 0 ? <X aria-hidden /> : icons[fix.kind]}
          disabled={!ready}
          onClick={() => {
            document.getElementById("main")?.focus();
            applyFix(fix);
          }}
        >
          <span className="flex min-w-0 flex-col gap-3 whitespace-normal">
            <span>{label}</span>
            <span className="text-8 leading-11-6 font-400">{count}</span>
          </span>
        </Button>
      ))}
    </div>
  );
}
