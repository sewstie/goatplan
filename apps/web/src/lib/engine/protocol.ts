import type { LoadTermResponse, SolveRequest, SolveResponse } from "./types";

// Messages between EngineClient and engine.worker.ts.

export type WorkerRequest =
  | { id: number; kind: "loadTerm"; termId: string }
  | { id: number; kind: "solve"; request: SolveRequest };

/** Why a request got no engine answer at all (engine errors come back as responses). */
export type FailureReason = "fetchFailed" | "engineUnavailable" | "unexpected" | "workerCrashed";

export type WorkerReply =
  | { id: number; type: "result"; response: LoadTermResponse | SolveResponse }
  | { id: number; type: "failure"; reason: FailureReason; message: string };
