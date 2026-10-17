import type { Metadata } from "next";
import { EnginePlayground } from "./EnginePlayground";

export const metadata: Metadata = {
  title: "Engine · GoatPlan",
  robots: { index: false },
};

export default function EnginePage() {
  return (
    <main className="mx-auto flex max-w-1100 flex-col gap-12 p-(--size-app-padding)">
      <header className="flex flex-col gap-7 px-4 pt-8 pb-12">
        <h1 className="text-25 leading-30 font-700 tracking-title">Engine</h1>
        <p className="text-10 leading-14-5 text-ink-muted">
          Sends requests to the WebAssembly engine through EngineClient and shows the response and how long it took.
          The request format is in docs/engine-api.md.
        </p>
      </header>
      <EnginePlayground />
    </main>
  );
}
