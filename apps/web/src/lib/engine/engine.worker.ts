import { createEngineHost, type GoatplanModule } from "./engineHost";
import type { WorkerReply, WorkerRequest } from "./protocol";

type WorkerScope = {
  location: { origin: string };
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(reply: WorkerReply): void;
};

const scope = self as unknown as WorkerScope;

const host = createEngineHost({
  async loadModule() {
    // The engine is a prebuilt file in public/engine, loaded at runtime, not bundled.
    const url = new URL("/engine/goatplan.mjs", scope.location.origin).href;
    const engineModule = await import(/* webpackIgnore: true */ url);
    return (await engineModule.default()) as GoatplanModule;
  },
  async fetchTermText(termId) {
    const response = await fetch(`/data/${termId}.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  },
});

scope.onmessage = (event) => {
  void host.handle(event.data).then((reply) => scope.postMessage(reply));
};
