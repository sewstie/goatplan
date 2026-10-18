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
/** Raw bytes of each term file, kept until the engine takes them. */
const termBuffers = new Map<string, ArrayBuffer>();

async function fetchBytes(path: string): Promise<{ bytes: ArrayBuffer; status: number }> {
  let response: Response;
  try {
    response = await fetch(path);
  } catch (cause) {
    throw new DataLoadError(path, null, { cause });
  }
  if (!response.ok) throw new DataLoadError(path, response.status);
  try {
    return { bytes: await response.arrayBuffer(), status: response.status };
  } catch (cause) {
    throw new DataLoadError(path, response.status, { cause });
  }
}

async function fetchJson(path: string, keepBytes?: (bytes: ArrayBuffer) => void): Promise<unknown> {
  const { bytes, status } = await fetchBytes(path);
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch (cause) {
    throw new DataLoadError(path, status, { cause });
  }
  keepBytes?.(bytes);
  return parsed;
}

function cached<T>(path: string, load: () => Promise<unknown>): Promise<T> {
  let promise = cache.get(path);
  if (!promise) {
    promise = load();
    cache.set(path, promise);
    // A failed load is forgotten, so the next call tries again.
    promise.catch(() => {
      if (cache.get(path) === promise) cache.delete(path);
    });
  }
  return promise as Promise<T>;
}

export function loadTermIndex(): Promise<TermIndex> {
  const path = "/data/index.json";
  return cached<TermIndex>(path, () => fetchJson(path));
}

/** Fetches a term file once, parses it for the UI and keeps its bytes for {@link takeTermBuffer}. */
export function loadTerm(termId: string): Promise<TermFile> {
  const path = `/data/${termId}.json`;
  if (!isTermId(termId)) return Promise.reject(new DataLoadError(path, null));
  return cached<TermFile>(path, () => fetchJson(path, (bytes) => termBuffers.set(termId, bytes)));
}

/**
 * Hands over the raw bytes of a loaded term file, once, so they can be transferred to the engine
 * worker without a second download. Returns null when they were already taken or never loaded.
 */
export function takeTermBuffer(termId: string): ArrayBuffer | null {
  const bytes = termBuffers.get(termId) ?? null;
  termBuffers.delete(termId);
  return bytes;
}

export function clearDataCache(): void {
  cache.clear();
  termBuffers.clear();
}
