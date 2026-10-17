import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sectionDrops } from "../lib/section-drop.mjs";

const index = (...terms) => ({ terms: terms.map(([id, end, sections]) => ({ id, end, sections })) });

describe("sectionDrops", () => {
  const committed = index(["2026-B", "2026-12-11", 1145], ["2027-C", "2027-03-05", 1001]);

  it("lets normal day-to-day changes through", () => {
    const updated = index(["2026-B", "2026-12-11", 1031], ["2027-C", "2027-03-05", 1010]);
    assert.deepEqual(sectionDrops(committed, updated, "2026-10-17"), []);
  });

  it("catches a term that lost more than 10% of its sections", () => {
    const updated = index(["2026-B", "2026-12-11", 1030], ["2027-C", "2027-03-05", 1001]);
    assert.deepEqual(sectionDrops(committed, updated, "2026-10-17"), [
      { id: "2026-B", before: 1145, after: 1030 },
    ]);
  });

  it("catches a term that disappeared before it ended", () => {
    const updated = index(["2027-C", "2027-03-05", 1001]);
    assert.deepEqual(sectionDrops(committed, updated, "2026-12-11"), [
      { id: "2026-B", before: 1145, after: 0 },
    ]);
  });

  it("lets a term go once it has ended", () => {
    const updated = index(["2027-C", "2027-03-05", 1001]);
    assert.deepEqual(sectionDrops(committed, updated, "2026-12-12"), []);
  });
});
