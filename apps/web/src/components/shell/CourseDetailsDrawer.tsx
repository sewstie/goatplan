"use client";

import { useCallback, useEffect, useRef } from "react";
import { X } from "@phosphor-icons/react/ssr";
import { selectLockedFull } from "@/components/schedule/lockedFull";
import { useDiagnosis } from "@/components/schedule/useDiagnosis";
import { CourseDetailsPanel } from "@/components/sections/CourseDetailsPanel";
import { useSectionPreview } from "@/components/sections/sectionPreview";
import { Drawer } from "@/components/ui/Drawer";
import { usePlanner } from "@/lib/store";
import { useDetailsDrawer } from "./detailsDrawer";
import { useDockedDetails } from "./useDockedDetails";

export function CourseDetailsDrawer() {
  const docked = useDockedDetails();
  const open = useDetailsDrawer((state) => state.open);
  const takeFocus = useDetailsDrawer((state) => state.takeFocus);
  const show = useDetailsDrawer((state) => state.show);
  const hide = useDetailsDrawer((state) => state.hide);
  const hasCourses = usePlanner((state) => state.courses.length > 0 || state.savedPlanId !== null);
  const termFailed = usePlanner((state) => state.termStatus === "error");
  const shared = usePlanner((state) => state.temporaryPlan !== null);
  const lockedFull = usePlanner((state) => selectLockedFull(state) !== null);
  const drawing = usePlanner((state) => state.drawing);
  const diagnosis = useDiagnosis();
  const attention = diagnosis !== null && (diagnosis.issues.length > 0 || diagnosis.fixes.length > 0);
  const hidden = termFailed || shared || lockedFull;
  const hadAttention = useRef(false);

  // When nothing fits, the ways to fix it are in here. It opens by itself and leaves focus alone.
  useEffect(() => {
    if (drawing) return;
    if (attention && !hadAttention.current && !hidden) show(false);
    hadAttention.current = attention;
  }, [attention, drawing, hidden, show]);

  useEffect(() => hide, [hide]);

  // Drawing needs the whole calendar.
  useEffect(() => {
    if (drawing) hide();
  }, [drawing, hide]);

  const close = useCallback(() => {
    useSectionPreview.getState().clear();
    hide();
  }, [hide]);

  if (hidden) return null;

  return (
    <>
      <div className="hidden w-(--size-details-drawer) shrink-0 min-[100rem]:block">
        {docked && (
          <aside aria-label="Course details" data-guide-hide={hasCourses ? undefined : ""} className="relative h-full overflow-y-auto rounded-panel bg-surface px-16 py-20">
            <CourseDetailsPanel />
          </aside>
        )}
      </div>
      {!docked && (
        <Drawer modal={false} label="Course details panel" open={open} onClose={close} takeFocus={takeFocus}>
          {open && (
            <>
              <div className="flex shrink-0 justify-end px-12 pt-10">
                <button type="button" aria-label="Close course details" onClick={close} className="flex size-30 cursor-pointer items-center justify-center rounded-row bg-canvas text-ink-muted hover:text-ink">
                  <X aria-hidden className="size-14" />
                </button>
              </div>
              <aside aria-label="Course details" className="relative min-h-0 flex-1 overflow-y-auto px-16 pb-20">
                <CourseDetailsPanel />
              </aside>
            </>
          )}
        </Drawer>
      )}
    </>
  );
}
