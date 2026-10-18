"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { loadTerm, loadTermIndex, takeTermBuffer } from "@/lib/data/load";
import type { TermSummary } from "@/lib/data/types";
import { EngineClient, EngineSupersededError } from "@/lib/engine/EngineClient";
import type { SolveRequest, SolveResponse } from "@/lib/engine/types";
import { ClickCounter } from "./ClickCounter";
import { FrameMeter } from "./FrameMeter";
import { buildPresets, PRESET_LABELS, type PresetName } from "./presets";
import { formatMs, RunSummary, type Run } from "./RunSummary";

const BURST_SIZE = 5;
const STRESS_RUNS = 10;

function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

export function EnginePlayground() {
  const [client] = useState(() => new EngineClient());
  const [terms, setTerms] = useState<TermSummary[]>([]);
  const [termId, setTermId] = useState("");
  const [presets, setPresets] = useState<Record<PresetName, SolveRequest> | null>(null);
  const [requestText, setRequestText] = useState("");
  const [status, setStatus] = useState("Loading terms…");
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestId = useId();

  useEffect(() => () => client.dispose(), [client]);

  const perform = useCallback(async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setBusy(false);
    }
  }, []);

  const openTerm = useCallback(
    (id: string) =>
      perform(async () => {
        setTermId(id);
        setStatus(`Loading ${id}…`);
        const started = performance.now();
        // One download: the page parses the file and the worker gets its bytes.
        const termFile = await loadTerm(id);
        const response = await client.loadTerm(id, takeTermBuffer(id));
        const roundTripMs = performance.now() - started;
        if (!response.ok) {
          setStatus(`${id} didn’t load: ${response.error.message}`);
          return;
        }
        const built = buildPresets(termFile);
        setPresets(built);
        setRequestText(JSON.stringify(built.basic, null, 2));
        setStatus(`Loaded ${id} · ${response.courses} courses · ${formatMs(roundTripMs)}`);
      }),
    [client, perform],
  );

  useEffect(() => {
    let cancelled = false;
    loadTermIndex()
      .then((index) => {
        if (cancelled) return;
        setTerms(index.terms);
        const first = index.terms.find((term) => term.status === "upcoming") ?? index.terms[0];
        if (first) void openTerm(first.id);
        else setStatus("No published terms.");
      })
      .catch((caught: unknown) => setStatus(describeError(caught)));
    return () => {
      cancelled = true;
    };
  }, [openTerm]);

  function readRequest(): SolveRequest | null {
    try {
      return JSON.parse(requestText) as SolveRequest;
    } catch (caught) {
      setError(`The request isn’t valid JSON. ${describeError(caught)}`);
      return null;
    }
  }

  function send() {
    const request = readRequest();
    if (!request) return;
    void perform(async () => {
      const started = performance.now();
      const response = await client.solve(request);
      setRun({ kind: "single", roundTripMs: performance.now() - started, response });
    });
  }

  function sendBurst() {
    const request = readRequest();
    if (!request) return;
    void perform(async () => {
      const started = performance.now();
      const results = await Promise.allSettled(
        Array.from({ length: BURST_SIZE }, () => client.solve(request)),
      );
      const superseded = results.filter(
        (result) => result.status === "rejected" && result.reason instanceof EngineSupersededError,
      ).length;
      const answered = results.find(
        (result): result is PromiseFulfilledResult<SolveResponse> => result.status === "fulfilled",
      );
      setRun({
        kind: "burst",
        roundTripMs: performance.now() - started,
        sent: BURST_SIZE,
        superseded,
        response: answered?.value ?? null,
      });
    });
  }

  function runStress() {
    if (!presets) return;
    void perform(async () => {
      const started = performance.now();
      let engineMs = 0;
      let response: SolveResponse | null = null;
      for (let index = 1; index <= STRESS_RUNS; index += 1) {
        setStatus(`Large request ${index} of ${STRESS_RUNS}…`);
        response = await client.solve(presets.large);
        if (response.ok) engineMs += response.elapsedMs;
      }
      setStatus(`Loaded ${termId} · ${STRESS_RUNS} large requests done`);
      setRun({ kind: "stress", roundTripMs: performance.now() - started, runs: STRESS_RUNS, engineMs, response: response! });
    });
  }

  return (
    <div className="flex flex-col gap-12">
      <Card as="section" variant="panel" aria-label="Term" className="flex flex-wrap items-center gap-16 px-20 py-20">
        <Select
          variant="field"
          label="Term"
          className="w-240"
          value={termId}
          disabled={busy || terms.length === 0}
          onChange={(event) => void openTerm(event.target.value)}
          options={terms.map((term) => ({ value: term.id, label: `${term.name} · ${term.season} ${term.year}` }))}
        />
        <p role="status" className="text-10 leading-14-5 text-ink-muted">
          {status}
        </p>
      </Card>

      <Card as="section" variant="panel" aria-label="Request" className="flex flex-col gap-12 px-20 py-20">
        <div className="flex flex-wrap items-center gap-8">
          <span className="text-10 leading-14-5 font-650">Presets</span>
          {(Object.keys(PRESET_LABELS) as PresetName[]).map((name) => (
            <Button
              key={name}
              variant="soft"
              size="xs"
              disabled={!presets || busy}
              onClick={() => presets && setRequestText(JSON.stringify(presets[name], null, 2))}
            >
              {PRESET_LABELS[name]}
            </Button>
          ))}
        </div>
        <label htmlFor={requestId} className="text-10 leading-14-5 font-650">
          Request JSON
        </label>
        <textarea
          id={requestId}
          value={requestText}
          onChange={(event) => setRequestText(event.target.value)}
          rows={12}
          spellCheck={false}
          className="w-full rounded-control border border-line bg-surface p-9 font-mono text-10 leading-14-5 text-ink"
        />
        <div className="flex flex-wrap items-center gap-8">
          <Button size="md" disabled={busy || !presets} onClick={send}>
            Send request
          </Button>
          <Button variant="secondary" size="md" disabled={busy || !presets} onClick={sendBurst}>
            Send {BURST_SIZE} at once
          </Button>
          <Button variant="secondary" size="md" disabled={busy || !presets} onClick={runStress}>
            Run {STRESS_RUNS} large requests
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-10 leading-14-5 text-alert">
            {error}
          </p>
        )}
      </Card>

      <Card as="section" variant="panel" aria-label="Responsiveness" className="flex flex-col gap-12 px-20 py-20">
        <h2 className="text-12 leading-17-4 font-700">Responsiveness</h2>
        <p className="text-10 leading-14-5 text-ink-muted">
          The engine runs in a Web Worker. While it works, the clock below keeps moving and clicks count right away.
        </p>
        <div className="flex flex-wrap items-center gap-16">
          <ClickCounter />
          <FrameMeter active={busy} />
        </div>
      </Card>

      <Card as="section" variant="panel" aria-label="Response" className="flex flex-col gap-12 px-20 py-20">
        <h2 className="text-12 leading-17-4 font-700">Response</h2>
        {run ? <RunSummary run={run} /> : <p className="text-10 leading-14-5 text-ink-muted">No request sent yet.</p>}
      </Card>
    </div>
  );
}
