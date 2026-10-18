import { describe, expect, it } from "vitest";
import { EngineClient, EngineFailureError, EngineSupersededError, type EngineWorker } from "./EngineClient";
import type { WorkerReply, WorkerRequest } from "./protocol";
import type {
  EngineErrorResponse,
  LoadTermResponse,
  LoadTermSuccess,
  SolveRequest,
  SolveResponse,
  SolveSuccess,
} from "./types";

class FakeWorker implements EngineWorker {
  posted: WorkerRequest[] = [];
  transferred: Transferable[][] = [];
  terminated = false;
  onmessage: EngineWorker["onmessage"] = null;
  onerror: EngineWorker["onerror"] = null;

  postMessage(message: WorkerRequest, transfer: Transferable[] = []) {
    this.posted.push(message);
    this.transferred.push(transfer);
  }

  terminate() {
    this.terminated = true;
  }

  reply(reply: WorkerReply) {
    this.onmessage?.({ data: reply } as MessageEvent<WorkerReply>);
  }

  /** Answers the last message the worker got. */
  answer(response: LoadTermResponse | SolveResponse) {
    this.reply({ id: this.posted.at(-1)!.id, type: "result", response });
  }

  crash(message: string) {
    this.onerror?.({ message, preventDefault() {} } as ErrorEvent);
  }
}

function setup() {
  const workers: FakeWorker[] = [];
  const client = new EngineClient(() => {
    const worker = new FakeWorker();
    workers.push(worker);
    return worker;
  });
  return { client, workers, worker: () => workers.at(-1)! };
}

const request = (...courses: string[]): SolveRequest => ({ version: 1, courses });
const loaded = (termId: string): LoadTermSuccess => ({ ok: true, version: 1, termId, courses: 581 });
const solved = (total: number): SolveSuccess => ({
  ok: true,
  version: 1,
  termId: "2027-C",
  total,
  patterns: total,
  capped: false,
  steps: 10,
  elapsedMs: 1,
  schedules: [],
  diagnosis: null,
});

/** Lets promise callbacks run. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("EngineClient", () => {
  it("sends one request at a time, with increasing ids, and starts the worker lazily", async () => {
    const { client, workers, worker } = setup();
    expect(workers).toHaveLength(0);

    const load = client.loadTerm("2027-C");
    const solve = client.solve(request("AE 2320"));
    expect(worker().posted).toEqual([{ id: 1, kind: "loadTerm", termId: "2027-C" }]);

    worker().answer(loaded("2027-C"));
    await expect(load).resolves.toEqual(loaded("2027-C"));
    expect(worker().posted.at(-1)).toEqual({ id: 2, kind: "solve", request: request("AE 2320") });

    worker().answer(solved(24));
    await expect(solve).resolves.toEqual(solved(24));
    expect(workers).toHaveLength(1);
  });

  it("transfers the term file's bytes to the worker when it has them", async () => {
    const { client, worker } = setup();
    const bytes = new TextEncoder().encode('{"term":{}}').buffer;
    const load = client.loadTerm("2027-C", bytes);
    expect(worker().posted[0]).toEqual({ id: 1, kind: "loadTerm", termId: "2027-C", buffer: bytes });
    expect(worker().transferred[0]).toEqual([bytes]);
    worker().answer(loaded("2027-C"));
    await load;

    const reload = client.loadTerm("2027-C", null);
    expect(worker().posted[1]).toEqual({ id: 2, kind: "loadTerm", termId: "2027-C" });
    expect(worker().transferred[1]).toEqual([]);
    worker().answer(loaded("2027-C"));
    await reload;
  });

  it("resolves engine errors as responses instead of rejecting", async () => {
    const { client, worker } = setup();
    const error: EngineErrorResponse = {
      ok: false,
      version: 1,
      error: { code: "unknownCourse", message: "No course PH 9999 in 2027-C", detail: "PH 9999" },
    };
    const solve = client.solve(request("PH 9999"));
    worker().answer(error);
    await expect(solve).resolves.toEqual(error);
  });

  it("latest wins: a new solve supersedes the running and waiting ones", async () => {
    const { client, worker } = setup();
    const first = client.solve(request("A"));
    const second = client.solve(request("B"));
    const third = client.solve(request("C"));

    await expect(first).rejects.toBeInstanceOf(EngineSupersededError);
    await expect(second).rejects.toBeInstanceOf(EngineSupersededError);
    expect(worker().posted.map((message) => message.id)).toEqual([1]);

    worker().answer(solved(1));
    await flush();
    expect(worker().posted.map((message) => message.id)).toEqual([1, 3]);

    worker().answer(solved(3));
    await expect(third).resolves.toEqual(solved(3));
  });

  it("a new term supersedes pending solves but not solves sent after it", async () => {
    const { client, worker } = setup();
    const stale = client.solve(request("A"));
    const load = client.loadTerm("2027-D");
    const fresh = client.solve(request("B"));
    await expect(stale).rejects.toBeInstanceOf(EngineSupersededError);

    worker().answer(solved(1));
    expect(worker().posted.at(-1)).toMatchObject({ kind: "loadTerm", termId: "2027-D" });
    worker().answer(loaded("2027-D"));
    await expect(load).resolves.toEqual(loaded("2027-D"));

    worker().answer(solved(2));
    await expect(fresh).resolves.toEqual(solved(2));
  });

  it("rejects with the reason when the worker couldn't get an answer", async () => {
    const { client, worker } = setup();
    const load = client.loadTerm("2026-A");
    worker().reply({ id: 1, type: "failure", reason: "fetchFailed", message: "HTTP 404" });
    const error = await load.catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(EngineFailureError);
    expect(error).toMatchObject({ reason: "fetchFailed", message: "HTTP 404" });
  });

  it("ignores replies to requests it isn't waiting for", async () => {
    const { client, worker } = setup();
    const solve = client.solve(request("A"));
    worker().reply({ id: 99, type: "result", response: solved(99) });
    worker().answer(solved(1));
    await expect(solve).resolves.toEqual(solved(1));
  });

  it("a crash fails everything pending, and the next request starts a new worker", async () => {
    const { client, workers, worker } = setup();
    const load = client.loadTerm("2027-C");
    const solve = client.solve(request("A"));
    worker().crash("out of memory");

    await expect(load).rejects.toMatchObject({ reason: "workerCrashed", message: "out of memory" });
    await expect(solve).rejects.toMatchObject({ reason: "workerCrashed" });
    expect(workers[0].terminated).toBe(true);

    const retry = client.loadTerm("2027-C");
    expect(workers).toHaveLength(2);
    worker().answer(loaded("2027-C"));
    await expect(retry).resolves.toEqual(loaded("2027-C"));
  });

  it("dispose stops the worker and fails what's left", async () => {
    const { client, worker } = setup();
    const solve = client.solve(request("A"));
    client.dispose();
    await expect(solve).rejects.toMatchObject({ reason: "workerCrashed" });
    expect(worker().terminated).toBe(true);
  });
});
