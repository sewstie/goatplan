import type { BackgroundState } from "@/lib/degree/recommendations/background";
import type { Offering } from "@/lib/degree/recommendations/offerings";
import type { TagTone } from "./SuggestionTag";

const BACKGROUND: Record<BackgroundState, [string, TagTone]> = {
  completed: ["Background met", "good"],
  conditional: ["Ready after earlier terms", "good"],
  confirmed: ["Experience confirmed", "good"],
  skills: ["Confirm experience", "warn"],
  missing: ["Missing background", "warn"],
  unknown: ["Background not tracked", "plain"],
};

const OFFERING: Record<Offering["state"], [string, TagTone]> = {
  confirmed: ["Offered", "good"],
  estimated: ["Usually offered", "plain"],
  full: ["Full", "warn"],
  absent: ["Not offered", "warn"],
  unknown: ["Offering unknown", "plain"],
  failed: ["Couldn’t check offering", "warn"],
};

export const backgroundTag = (state: BackgroundState) => BACKGROUND[state];
export const offeringTag = (state: Offering["state"]) => OFFERING[state];
