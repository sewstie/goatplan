import { create } from "zustand";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";

/** The full-page views of the phone layout. Tablet and wider show them side by side instead. */
export type PhoneScreen = "schedule" | "search" | "course" | "preferences";

interface PhoneScreenState {
  screen: PhoneScreen;
  show(screen: PhoneScreen): void;
}

export const usePhoneScreen = create<PhoneScreenState>()((set) => ({
  screen: "schedule",
  show: (screen) => set({ screen }),
}));

/** Opens a phone screen from a component that tablet and wider share; a no-op there. */
export function useShowPhoneScreen(): (screen: PhoneScreen) => void {
  const phone = usePhoneViewport();
  const show = usePhoneScreen((state) => state.show);
  return phone ? show : noop;
}

function noop() {}
