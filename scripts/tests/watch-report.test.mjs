import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { parseLog, summarize } from "../lib/watch-report.mjs";

const log = parseLog(readFileSync(new URL("../../data/fixtures/watch-log.jsonl", import.meta.url), "utf8"));

describe("summarize", () => {
  const summary = summarize(log);

  it("counts checks, errors and distinct versions of the file", () => {
    assert.equal(summary.checks, 8);
    assert.equal(summary.errors, 1);
    assert.equal(summary.versions, 6);
  });

  it("lists each change with its kind", () => {
    assert.deepEqual(summary.changes, [
      { checkedAt: "2026-10-30T13:00:00.000Z", change: "seats-only" },
      { checkedAt: "2026-10-30T17:00:00.000Z", change: "structure" },
      { checkedAt: "2026-11-02T14:00:00.000Z", change: "both" },
      { checkedAt: "2026-11-02T14:30:00.000Z", change: "seats-only" },
    ]);
  });

  it("measures the gaps between changes in minutes", () => {
    assert.deepEqual(summary.gaps, { shortest: 30, median: 240, longest: 4140 });
  });

  it("counts changes by hour in New York, across the switch back from daylight time", () => {
    const expected = Array(24).fill(0);
    expected[9] = 3;
    expected[13] = 1;
    assert.deepEqual(summary.byHour, expected);
  });

  it("tells whether the server answers with 304 and which headers it sends", () => {
    assert.deepEqual(summary.server, { notModified: 1, sendsEtag: true, sendsLastModified: false });
  });

  it("counts new files that had the same data", () => {
    assert.equal(summary.sameData, 1);
  });
});
