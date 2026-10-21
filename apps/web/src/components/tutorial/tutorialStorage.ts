import type { DraftStorage } from "@/lib/store/draft";

const KEY = "goatplan:tutorial:v1";
export type TutorialOutcome = "dismissed" | "completed";

export function tutorialFinished(storage: DraftStorage | null): boolean {
  try {
    const status = storage?.getItem(KEY);
    return status === "dismissed" || status === "completed";
  } catch {
    return false;
  }
}

export function rememberTutorial(storage: DraftStorage | null, outcome: TutorialOutcome): boolean {
  try {
    if (!storage) return false;
    storage.setItem(KEY, outcome);
    return true;
  } catch {
    return false;
  }
}
