import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { checkSource, classify, fingerprint } from "../lib/watch-source.mjs";

const raw = (name) => readFileSync(new URL(`../../data/fixtures/${name}`, import.meta.url), "utf8");
const fixture = (name) => JSON.parse(raw(name));

// In "after", the Arabic section's seats changed and the accounting section moved rooms.
const before = fixture("watch-before.json").Report_Entry;
const after = fixture("watch-after.json").Report_Entry;
const file = (arabic, accounting) => ({ Report_Entry: [arabic, accounting] });

describe("classify", () => {
  const previous = fingerprint(file(before[0], before[1]));

  it("sees no change when only the row order differs", () => {
    assert.equal(classify(previous, fingerprint(file(before[1], before[0]))), "unchanged");
  });

  it("sees a seats-only change", () => {
    assert.equal(classify(previous, fingerprint(file(after[0], before[1]))), "seats-only");
  });

  it("sees a structure change", () => {
    assert.equal(classify(previous, fingerprint(file(before[0], after[1]))), "structure");
  });

  it("sees both at once", () => {
    assert.equal(classify(previous, fingerprint(file(after[0], after[1]))), "both");
  });
});

describe("checkSource", () => {
  const now = new Date("2026-10-30T13:00:00Z");
  const state = {
    etag: '"v1"',
    lastModified: "Thu, 29 Oct 2026 09:00:00 GMT",
    bodyHash: "body-v1",
    seatsHash: "seats-v1",
    structureHash: "structure-v1",
  };

  it("asks only for a newer file and records a 304 as unchanged", async () => {
    const requests = [];
    const fetch = async (url, init) => {
      requests.push(init.headers);
      return new Response(null, { status: 304, headers: { etag: '"v1"', "cache-control": "max-age=300", age: "42" } });
    };

    const result = await checkSource(state, { fetch, now });

    assert.equal(requests.length, 1);
    assert.equal(requests[0]["If-None-Match"], '"v1"');
    assert.equal(requests[0]["If-Modified-Since"], "Thu, 29 Oct 2026 09:00:00 GMT");
    assert.equal(requests[0]["User-Agent"], "GoatPlan course planner (student project)");
    assert.equal(result.entry.checkedAt, "2026-10-30T13:00:00.000Z");
    assert.equal(result.entry.status, 304);
    assert.equal(result.entry.change, "unchanged (304)");
    assert.equal(result.entry.cacheControl, "max-age=300");
    assert.equal(result.entry.age, "42");
    assert.deepEqual(result.state, state);
  });

  it("logs a network error instead of throwing, and keeps the old state", async () => {
    const fetch = async () => {
      throw new TypeError("fetch failed", { cause: new Error("getaddrinfo ENOTFOUND courselistings.wpi.edu") });
    };

    const result = await checkSource(state, { fetch, now });

    assert.deepEqual(result.entry, {
      checkedAt: "2026-10-30T13:00:00.000Z",
      status: "error",
      message: "fetch failed: getaddrinfo ENOTFOUND courselistings.wpi.edu",
    });
    assert.deepEqual(result.state, state);
  });

  it("fingerprints a new file and remembers it for the next check", async () => {
    const body = raw("watch-after.json");
    const fetch = async () =>
      new Response(body, { status: 200, headers: { etag: '"v2"', "content-length": "1234" } });
    const previous = { ...state, ...fingerprint(fixture("watch-before.json")) };

    const result = await checkSource(previous, { fetch, now });

    assert.equal(result.entry.status, 200);
    assert.equal(result.entry.change, "both");
    assert.equal(result.entry.bodyHash, "7f0adc82cf05927577333329caa91014a7420c292597e8395e91612f34b7d78c");
    assert.equal(result.entry.contentLength, "1234");
    assert.equal(result.entry.sectionCount, 2);
    assert.equal(result.entry.enrolledTotal, 55);
    assert.deepEqual(result.state, {
      etag: '"v2"',
      lastModified: null,
      bodyHash: "7f0adc82cf05927577333329caa91014a7420c292597e8395e91612f34b7d78c",
      ...fingerprint(fixture("watch-after.json")),
    });
  });

  it("has nothing to compare with on the first check", async () => {
    const requests = [];
    const fetch = async (url, init) => {
      requests.push(init.headers);
      return new Response(raw("watch-before.json"), { status: 200 });
    };

    const result = await checkSource(null, { fetch, now });

    assert.equal(requests[0]["If-None-Match"], undefined);
    assert.equal(result.entry.change, "first");
  });

  it("logs a server error as an error", async () => {
    const fetch = async () => new Response("busy", { status: 503, statusText: "Service Unavailable" });

    const result = await checkSource(state, { fetch, now });

    assert.equal(result.entry.status, "error");
    assert.equal(result.entry.message, "HTTP 503 Service Unavailable");
    assert.deepEqual(result.state, state);
  });
});
