import { EngineClient } from "./EngineClient";

export * from "./types";
export { EngineClient, EngineFailureError, EngineSupersededError } from "./EngineClient";

let shared: EngineClient | null = null;

/** The app's one engine. The worker holds one term at a time, so the app shares a single client. */
export function getEngineClient(): EngineClient {
  shared ??= new EngineClient();
  return shared;
}
