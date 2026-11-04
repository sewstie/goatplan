import { loadTerm, loadTermIndex } from "@/lib/data/load";
import { pickDefaultTerm } from "@/lib/data/terms";
import type { TermFile, TermIndex } from "@/lib/data/types";
import { draftKey, LAST_TERM_KEY, readDraft, readLastTerm } from "@/lib/store/draft";
import type { AuditCourse } from "@/lib/engine/types";
import { DEFAULT_CREDITS, type HistoryStorage } from "./history";

export interface OpenPlan {
  read(): Promise<AuditCourse[]>;
  signature(): string;
}

interface OpenPlanDeps {
  getStorage(): HistoryStorage | null;
  loadTermIndex(): Promise<TermIndex>;
  loadTerm(termId: string): Promise<TermFile>;
  now?(): Date;
}

const DRAFT_KEY_PREFIX = draftKey("");

export const isPlanKey = (key: string) => key === LAST_TERM_KEY || key.startsWith(DRAFT_KEY_PREFIX);

export function createOpenPlan({ getStorage, now = () => new Date(), ...load }: OpenPlanDeps): OpenPlan {
  async function openTermId(): Promise<string | null> {
    const remembered = readLastTerm(getStorage());
    try {
      const { terms } = await load.loadTermIndex();
      return pickDefaultTerm(terms, remembered, now())?.id ?? null;
    } catch {
      return remembered;
    }
  }

  return {
    async read() {
      const termId = await openTermId();
      const codes = termId ? (readDraft(getStorage(), termId)?.courses ?? []) : [];
      if (!termId || codes.length === 0) return [];
      let term: TermFile;
      try {
        term = await load.loadTerm(termId);
      } catch {
        return codes.map((code) => ({ code, credits: DEFAULT_CREDITS }));
      }
      const credits = new Map(term.courses.map((course) => [course.code, course.credits]));
      return codes.filter((code) => credits.has(code)).map((code) => ({ code, credits: credits.get(code) ?? DEFAULT_CREDITS }));
    },
    signature() {
      const storage = getStorage();
      const termId = readLastTerm(storage);
      return JSON.stringify([termId, termId ? (readDraft(storage, termId)?.courses ?? []) : []]);
    },
  };
}

export const browserOpenPlan = (getStorage: OpenPlanDeps["getStorage"]): OpenPlan => createOpenPlan({ getStorage, loadTermIndex, loadTerm });
