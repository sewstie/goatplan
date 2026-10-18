import type { FailureReason, WorkerReply, WorkerRequest } from "./protocol";
import type { LoadTermResponse, SolveRequest, SolveResponse } from "./types";

/** A newer request replaced this one; its answer is no longer wanted. */
export class EngineSupersededError extends Error {
  constructor() {
    super("A newer request replaced this one.");
    this.name = "EngineSupersededError";
  }
}

/** The request got no engine answer: the term couldn't be fetched, the engine didn't start, or the worker crashed. */
export class EngineFailureError extends Error {
  readonly reason: FailureReason;

  constructor(reason: FailureReason, message: string) {
    super(message);
    this.name = "EngineFailureError";
    this.reason = reason;
  }
}

export interface EngineWorker {
  postMessage(message: WorkerRequest, transfer?: Transferable[]): void;
  terminate(): void;
  onmessage: ((event: MessageEvent<WorkerReply>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
}

interface Pending {
  message: WorkerRequest;
  resolve(response: LoadTermResponse | SolveResponse): void;
  reject(error: Error): void;
  settled: boolean;
}

function createEngineWorker(): EngineWorker {
  return new Worker(new URL("./engine.worker.ts", import.meta.url), {
    type: "module",
    name: "goatplan-engine",
  }) as unknown as EngineWorker;
}

/**
 * Talks to the engine in a Web Worker. Requests go to the worker one at a time.
 * Latest wins: a new solve settles every older solve as superseded, and a new loadTerm every older request.
 * A superseded request that was already sent still finishes in the worker, but its answer is dropped.
 */
export class EngineClient {
  private worker: EngineWorker | null = null;
  private nextId = 1;
  private inFlight: Pending | null = null;
  private waiting: Pending[] = [];

  constructor(private readonly createWorker: () => EngineWorker = createEngineWorker) {}

  /**
   * Loads a term into the engine. Pass the term file's bytes (from takeTermBuffer) to move them to the
   * worker without copying or downloading them again; without them the worker fetches the file.
   */
  loadTerm(termId: string, buffer?: ArrayBuffer | null): Promise<LoadTermResponse> {
    const message: WorkerRequest = { id: this.nextId++, kind: "loadTerm", termId };
    if (buffer) message.buffer = buffer;
    return this.enqueue(message) as Promise<LoadTermResponse>;
  }

  solve(request: SolveRequest): Promise<SolveResponse> {
    return this.enqueue({ id: this.nextId++, kind: "solve", request }) as Promise<SolveResponse>;
  }

  /** Stops the worker. Unsettled requests fail with reason "workerCrashed". */
  dispose(): void {
    this.failAll("workerCrashed", "The engine was stopped.");
  }

  private enqueue(message: WorkerRequest): Promise<LoadTermResponse | SolveResponse> {
    // Loading a term also makes earlier solves stale; a solve only replaces earlier solves.
    const replaces = (kind: WorkerRequest["kind"]) => message.kind === "loadTerm" || kind === "solve";
    for (const pending of [this.inFlight, ...this.waiting]) {
      if (pending && replaces(pending.message.kind)) {
        this.settle(pending, () => pending.reject(new EngineSupersededError()));
      }
    }
    this.waiting = this.waiting.filter((pending) => !pending.settled);

    const promise = new Promise<LoadTermResponse | SolveResponse>((resolve, reject) => {
      this.waiting.push({ message, resolve, reject, settled: false });
    });
    this.pump();
    return promise;
  }

  private pump(): void {
    if (this.inFlight) return;
    const next = this.waiting.shift();
    if (!next) return;
    this.inFlight = next;
    const { message } = next;
    const transfer = message.kind === "loadTerm" && message.buffer ? [message.buffer] : [];
    this.ensureWorker().postMessage(message, transfer);
  }

  private ensureWorker(): EngineWorker {
    if (!this.worker) {
      const worker = this.createWorker();
      worker.onmessage = (event) => this.handleReply(event.data);
      worker.onerror = (event) => {
        event.preventDefault?.();
        this.failAll("workerCrashed", event.message || "The engine worker crashed.");
      };
      this.worker = worker;
    }
    return this.worker;
  }

  private handleReply(reply: WorkerReply): void {
    const pending = this.inFlight;
    if (!pending || pending.message.id !== reply.id) return;
    this.inFlight = null;
    if (reply.type === "failure") {
      this.settle(pending, () => pending.reject(new EngineFailureError(reply.reason, reply.message)));
    } else {
      this.settle(pending, () => pending.resolve(reply.response));
    }
    this.pump();
  }

  private failAll(reason: FailureReason, message: string): void {
    for (const pending of [this.inFlight, ...this.waiting]) {
      if (pending) this.settle(pending, () => pending.reject(new EngineFailureError(reason, message)));
    }
    this.inFlight = null;
    this.waiting = [];
    this.worker?.terminate();
    this.worker = null;
  }

  private settle(pending: Pending, finish: () => void): void {
    if (pending.settled) return;
    pending.settled = true;
    finish();
  }
}
