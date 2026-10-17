"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { SolveResponse } from "@/lib/engine/types";

export type Run =
  | { kind: "single"; roundTripMs: number; response: SolveResponse }
  | { kind: "burst"; roundTripMs: number; sent: number; superseded: number; response: SolveResponse | null }
  | { kind: "stress"; roundTripMs: number; runs: number; engineMs: number; response: SolveResponse };

const MAX_JSON_CHARACTERS = 20_000;

export function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms.toFixed(1)} ms`;
}

function rows(run: Run): [string, string][] {
  const result: [string, string][] = [["Round trip", formatMs(run.roundTripMs)]];
  if (run.kind === "burst") {
    result.push(["Requests", `${run.sent} sent · ${run.superseded} superseded · ${run.sent - run.superseded} answered`]);
  }
  if (run.kind === "stress") {
    result.push(["Requests", `${run.runs} in a row`], ["Engine time, all requests", formatMs(run.engineMs)]);
  }

  const response = run.response;
  if (!response) return result;
  if (!response.ok) {
    result.push(["Error", `${response.error.code}: ${response.error.message}`]);
    if (response.error.detail !== null) result.push(["Detail", String(response.error.detail)]);
    return result;
  }

  result.push(
    ["Engine time", formatMs(response.elapsedMs)],
    ["Schedules that fit", `${response.total.toLocaleString("en-US")} (${response.patterns.toLocaleString("en-US")} timetables)`],
    ["Schedules sent back", String(response.schedules.length)],
    ["Search steps", `${response.steps.toLocaleString("en-US")}${response.capped ? " · ran out of steps" : ""}`],
  );
  const diagnosis = response.diagnosis;
  if (diagnosis) {
    const parts = [
      diagnosis.unsure && "unsure",
      diagnosis.emptyCourses.length > 0 && `no options: ${diagnosis.emptyCourses.map((course) => course.code).join(", ")}`,
      diagnosis.clashingPairs.length > 0 && `clashes: ${diagnosis.clashingPairs.map((pair) => pair.join(" + ")).join(", ")}`,
      diagnosis.minimalClash.length > 0 && `can't all fit: ${diagnosis.minimalClash.join(", ")}`,
      `${diagnosis.fixes.length} fixes`,
    ].filter(Boolean);
    result.push(["Diagnosis", parts.join(" · ")]);
  }
  return result;
}

export function RunSummary({ run }: { run: Run }) {
  const [showJson, setShowJson] = useState(false);
  const json = useMemo(() => {
    if (!showJson || !run.response) return "";
    const text = JSON.stringify(run.response, null, 2);
    return text.length > MAX_JSON_CHARACTERS
      ? `${text.slice(0, MAX_JSON_CHARACTERS)}\n… ${(text.length - MAX_JSON_CHARACTERS).toLocaleString("en-US")} more characters`
      : text;
  }, [showJson, run.response]);

  return (
    <div className="flex flex-col gap-12">
      <dl className="grid grid-cols-[auto_1fr] gap-x-16 gap-y-6 text-10 leading-14-5">
        {rows(run).map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-ink-muted">{label}</dt>
            <dd className="tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {run.response && (
        <div className="flex flex-col gap-8">
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            aria-expanded={showJson}
            onClick={() => setShowJson((shown) => !shown)}
          >
            {showJson ? "Hide response JSON" : "Show response JSON"}
          </Button>
          {showJson && (
            <pre className="max-h-480 overflow-auto rounded-control border border-line bg-code-surface p-12 font-mono text-9 leading-13">
              {json}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
