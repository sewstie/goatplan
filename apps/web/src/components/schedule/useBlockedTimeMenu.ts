import { create } from "zustand";
import type { PlanBlockedTime } from "@/lib/store";

export const BLOCKED_TIME_POPOVER_ID = "blocked-time-popover";

type OpenMenu = { block: PlanBlockedTime; anchor: HTMLElement };

/** Tells blocked times apart, including two with different names at the same time. */
export const blockedKey = (block: PlanBlockedTime) => `${block.day}-${block.start}-${block.end}-${block.label?.trim() ?? ""}`;

interface BlockedTimeMenuState {
  /** The blocked time whose popover is open, and the block on the calendar it opened from. */
  open: OpenMenu | null;
  /** The blocked times picked with ⌘-click or Ctrl-click, by blockedKey. */
  selected: string[];
  toggle(block: PlanBlockedTime, anchor: HTMLElement): void;
  close(): void;
  toggleSelected(block: PlanBlockedTime): void;
  clearSelected(): void;
}

/** Which blocked time's popover is open and which are selected. The calendar sets them; BlockedTimeMenu acts on them. */
export const useBlockedTimeMenu = create<BlockedTimeMenuState>()((set, get) => ({
  open: null,
  selected: [],
  toggle: (block, anchor) => set({ open: get().open?.anchor === anchor ? null : { block, anchor }, selected: [] }),
  close: () => set({ open: null }),
  toggleSelected: (block) => {
    const key = blockedKey(block);
    const selected = get().selected;
    set({ open: null, selected: selected.includes(key) ? selected.filter((item) => item !== key) : [...selected, key] });
  },
  clearSelected: () => {
    if (get().selected.length > 0) set({ selected: [] });
  },
}));
