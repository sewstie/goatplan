import { create } from "zustand";

export const GUIDE_SKIPPED_MESSAGE = "Guide closed · Replay it from How to use";

interface GuideSessionState {
  replayRequested: boolean;
  skipped: boolean;
  closedThisVisit: boolean;
  requestReplay(): void;
  replayStarted(): void;
  showSkipped(): void;
  hideSkipped(): void;
  closeForVisit(): void;
}

/**
 * What the footers and the toast share with the guide. Lives outside the page, so a replay from /plans
 * survives the trip to the planner and a closed guide stays closed until the next page load.
 */
export const useGuideSession = create<GuideSessionState>()((set) => ({
  replayRequested: false,
  skipped: false,
  closedThisVisit: false,
  requestReplay: () => set({ replayRequested: true, skipped: false, closedThisVisit: false }),
  replayStarted: () => set({ replayRequested: false }),
  showSkipped: () => set({ skipped: true }),
  hideSkipped: () => set({ skipped: false }),
  closeForVisit: () => set({ closedThisVisit: true }),
}));
