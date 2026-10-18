import { isTermId } from "@/lib/data/load";
import type { FailureReason, WorkerReply, WorkerRequest } from "./protocol";
import type { LoadTermResponse, SolveResponse } from "./types";

/** What goatplan.mjs gives back: both functions take and return JSON text and never throw. */
export interface GoatplanModule {
  loadTerm(termText: string): string;
  handle(requestText: string): string;
}

export interface EngineHostDeps {
  loadModule(): Promise<GoatplanModule>;
  fetchTermText(termId: string): Promise<string>;
}

class HostFailure extends Error {
  constructor(
    readonly reason: FailureReason,
    message: string,
  ) {
    super(message);
  }
}

/** The worker's logic, kept apart from the worker so it can be tested. Runs one message at a time. */
export function createEngineHost(deps: EngineHostDeps) {
  let modulePromise: Promise<GoatplanModule> | null = null;
  let loaded: { termId: string; response: LoadTermResponse } | null = null;
  let queue: Promise<unknown> = Promise.resolve();

  async function getModule(): Promise<GoatplanModule> {
    modulePromise ??= deps.loadModule();
    try {
      return await modulePromise;
    } catch (cause) {
      modulePromise = null;
      throw new HostFailure("engineUnavailable", `The engine didn’t start: ${String(cause)}`);
    }
  }

  async function fetchTerm(termId: string): Promise<string> {
    try {
      return await deps.fetchTermText(termId);
    } catch (cause) {
      throw new HostFailure("fetchFailed", `Couldn’t load term ${termId}: ${String(cause)}`);
    }
  }

  async function loadTerm(termId: string, buffer?: ArrayBuffer): Promise<LoadTermResponse> {
    if (!isTermId(termId)) throw new HostFailure("fetchFailed", `Not a term id: ${termId}`);
    if (loaded?.termId === termId) return loaded.response;
    const engine = await getModule();
    const text = buffer ? new TextDecoder().decode(buffer) : await fetchTerm(termId);
    const response = JSON.parse(engine.loadTerm(text)) as LoadTermResponse;
    // A term that fails to load leaves the previous one loaded, as the engine does.
    if (response.ok) loaded = { termId, response };
    return response;
  }

  async function run(message: WorkerRequest): Promise<WorkerReply> {
    try {
      const response =
        message.kind === "loadTerm"
          ? await loadTerm(message.termId, message.buffer)
          : (JSON.parse((await getModule()).handle(JSON.stringify(message.request))) as SolveResponse);
      return { id: message.id, type: "result", response };
    } catch (error) {
      if (error instanceof HostFailure) {
        return { id: message.id, type: "failure", reason: error.reason, message: error.message };
      }
      return { id: message.id, type: "failure", reason: "unexpected", message: String(error) };
    }
  }

  return {
    handle(message: WorkerRequest): Promise<WorkerReply> {
      const reply = queue.then(() => run(message));
      queue = reply;
      return reply;
    },
  };
}
