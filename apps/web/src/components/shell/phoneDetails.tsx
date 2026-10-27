"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Lets a course tap (a row in "Your courses" or a search result) ask the shell to open the phone
 * details sheet, without threading a callback through every component in between. Outside a provider
 * the hook is a no-op, so the same components work unchanged on tablet and wider screens.
 */
const PhoneDetailsContext = createContext<() => void>(() => {});

export function PhoneDetailsProvider({ onOpen, children }: { onOpen: () => void; children: ReactNode }) {
  return <PhoneDetailsContext.Provider value={onOpen}>{children}</PhoneDetailsContext.Provider>;
}

/** Returns a function that opens the phone details sheet, or a no-op when there's no phone sheet. */
export function useOpenPhoneDetails(): () => void {
  return useContext(PhoneDetailsContext);
}
