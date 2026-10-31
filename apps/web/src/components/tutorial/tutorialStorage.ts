import type { DraftStorage } from "@/lib/store/draft";

const KEY = "goatplan:tutorial:v1";
export type TutorialOutcome = "dismissed" | "completed";

function readStatus(storage: DraftStorage | null): string | null {
  try {
    return storage?.getItem(KEY) ?? null;
  } catch {
    return null;
  }
}

export function tutorialFinished(storage: DraftStorage | null): boolean {
  const status = readStatus(storage);
  return status === "dismissed" || status === "completed";
}

/** The guide was opened and closed or left unfinished, as opposed to never seen. */
export function tutorialStarted(storage: DraftStorage | null): boolean {
  return readStatus(storage) === "started";
}

export function rememberTutorial(storage: DraftStorage | null, outcome: TutorialOutcome): boolean {
  if (outcome === "dismissed" && tutorialFinished(storage)) return true;
  return writeProgress(storage, outcome);
}

export function rememberGuideProgress(storage: DraftStorage | null): boolean {
  return tutorialFinished(storage) || writeProgress(storage, "started");
}

function writeProgress(storage: DraftStorage | null, status: string): boolean {
  try {
    if (!storage) return false;
    storage.setItem(KEY, status);
    return true;
  } catch {
    return false;
  }
}
