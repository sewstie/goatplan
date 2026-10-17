import type { TermFile, TermIndex } from "./types";

const TERM_ID = /^\d{4}-[A-Z]$/;

export function isTermId(value: string): boolean {
  return TERM_ID.test(value);
}

export class DataLoadError extends Error {
  readonly path: string;
  readonly status: number | null;

  constructor(path: string, status: number | null, options?: { cause?: unknown }) {
    super(
      status === null ? `Couldn’t load ${path}.` : `Couldn’t load ${path} (HTTP ${status}).`,
      options,
    );
    this.name = "DataLoadError";
    this.path = path;
    this.status = status;
  }
}

const cache = new Map<string, Promise<unknown>>();

async function fetchJson(path: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(path);
  } catch (cause) {
    throw new DataLoadError(path, null, { cause });
  }
  if (!response.ok) throw new DataLoadError(path, response.status);
  try {
    return await response.json();
  } catch (cause) {
    throw new DataLoadError(path, response.status, { cause });
  }
}

function cached<T>(path: string): Promise<T> {
  let promise = cache.get(path);
  if (!promise) {
    promise = fetchJson(path);
    cache.set(path, promise);
    // A failed load is forgotten, so the next call tries again.
    promise.catch(() => {
      if (cache.get(path) === promise) cache.delete(path);
    });
  }
  return promise as Promise<T>;
}

export function loadTermIndex(): Promise<TermIndex> {
  return cached<TermIndex>("/data/index.json");
}

export function loadTerm(termId: string): Promise<TermFile> {
  if (!isTermId(termId)) {
    return Promise.reject(new DataLoadError(`/data/${termId}.json`, null));
  }
  return cached<TermFile>(`/data/${termId}.json`);
}

export function clearDataCache(): void {
  cache.clear();
}
