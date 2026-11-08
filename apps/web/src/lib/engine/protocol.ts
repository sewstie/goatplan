import type { AuditRequest, EngineResponse, SolveRequest } from "./types";

// Messages between EngineClient and engine.worker.ts.

export type WorkerRequest =
  /** `buffer` is the term file's bytes, transferred; without it the worker fetches the file itself. */
  | { id: number; kind: "loadTerm"; termId: string; buffer?: ArrayBuffer }
  | { id: number; kind: "solve"; request: SolveRequest }
  | { id: number; kind: "audit"; request: AuditRequest };

/** Why a request got no engine answer at all (engine errors come back as responses). */
export type FailureReason = "fetchFailed" | "engineUnavailable" | "unexpected" | "workerCrashed";

export type WorkerReply =
  | { id: number; type: "result"; response: EngineResponse }
  | { id: number; type: "failure"; reason: FailureReason; message: string };
