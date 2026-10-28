"use client";

import { Trash } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { usePlanner } from "@/lib/store";

/** Removes the open course from the plan; the toast then offers Undo. Hidden for saved plans. */
export function RemoveCourseButton({ className, onRemoved }: { className?: string; onRemoved?: () => void }) {
  const code = usePlanner((state) =>
    state.savedPlanId === null && state.termStatus === "ready" && state.selectedCourse && state.courses.includes(state.selectedCourse)
      ? state.selectedCourse
      : null,
  );
  const removeCourse = usePlanner((state) => state.removeCourse);
  if (!code) return null;
  return (
    <Button
      variant="secondary"
      fullWidth
      icon={<Trash aria-hidden />}
      className={className}
      aria-label={`Remove course ${code}`}
      onClick={() => {
        removeCourse(code);
        onRemoved?.();
      }}
    >
      Remove course
    </Button>
  );
}
