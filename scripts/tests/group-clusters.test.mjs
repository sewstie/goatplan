import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildOptions, groupBy } from "../lib/group-clusters.mjs";

const section = (id, type, cluster = null) => ({ id, type, cluster });
const many = (prefix, numbers, type, cluster = null) =>
  numbers.map((n) => section(`${prefix}${String(n).padStart(2, "0")}`, type, cluster));

describe("groupBy", () => {
  it("groups items by key in first-seen order", () => {
    const groups = groupBy(["CL01", "CX01", "CX02", "CL02"], (code) => code[1]);
    assert.deepEqual([...groups], [
      ["L", ["CL01", "CL02"]],
      ["X", ["CX01", "CX02"]],
    ]);
  });
});

describe("buildOptions", () => {
  it("drops an option when an unclustered lab overlaps its lecture", () => {
    const options = buildOptions([
      {
        ...section("MA 1024-BL04", "lecture", "lecture-cluster"),
        meetings: [{ days: ["Mon"], start: 900, end: 950 }],
      },
      {
        ...section("MA 1024-BX08", "lab"),
        meetings: [{ days: ["Mon"], start: 900, end: 950 }],
      },
    ]);
    assert.deepEqual(options, []);
  });

  it("pairs a clustered lecture with each of its labs (AE 3010: 1 x 6 = 6)", () => {
    const options = buildOptions([
      section("AE 3010-AL01", "lecture", "5074"),
      ...many("AE 3010-AX", [1, 2, 3, 4, 5, 6], "lab", "5074"),
    ]);
    assert.deepEqual(options, [
      ["AE 3010-AL01", "AE 3010-AX01"],
      ["AE 3010-AL01", "AE 3010-AX02"],
      ["AE 3010-AL01", "AE 3010-AX03"],
      ["AE 3010-AL01", "AE 3010-AX04"],
      ["AE 3010-AL01", "AE 3010-AX05"],
      ["AE 3010-AL01", "AE 3010-AX06"],
    ]);
  });

  it("takes every lecture-lab pair inside one cluster (CS 1101: 2 x 11 = 22)", () => {
    const options = buildOptions([
      ...many("CS 1101-AL", [1, 2], "lecture", "5107"),
      ...many("CS 1101-AX", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], "lab", "5107"),
    ]);
    assert.equal(options.length, 22);
    assert.deepEqual(options[0], ["CS 1101-AL01", "CS 1101-AX01"]);
    assert.deepEqual(options.at(-1), ["CS 1101-AL02", "CS 1101-AX11"]);
  });

  it("makes a section with no cluster an option by itself", () => {
    const options = buildOptions([
      section("AE 4310-C01", "lecture"),
      section("AE 4310-C02", "lecture"),
      section("HU 3900-C03", "seminar"),
    ]);
    assert.deepEqual(options, [["AE 4310-C01"], ["AE 4310-C02"], ["HU 3900-C03"]]);
  });

  it("never mixes sections from different clusters (MA 1020)", () => {
    const options = buildOptions([
      section("MA 1020-FL01", "lecture", "5279"),
      section("MA 1020-FD01", "discussion", "5279"),
      section("MA 1020-FL02", "lecture", "5281"),
      section("MA 1020-FD02", "discussion", "5281"),
      section("MA 1020-FD04", "discussion", "5281"),
    ]);
    assert.deepEqual(options, [
      ["MA 1020-FD01", "MA 1020-FL01"],
      ["MA 1020-FD02", "MA 1020-FL02"],
      ["MA 1020-FD04", "MA 1020-FL02"],
    ]);
  });

  it("pairs lectures and labs that have no cluster at all (CH 1010)", () => {
    const options = buildOptions([
      ...many("CH 1010-AL", [1, 2], "lecture"),
      ...many("CH 1010-AX", [1, 2, 3], "lab"),
    ]);
    assert.equal(options.length, 6);
    assert.ok(options.every((option) => option.length === 2));
    assert.deepEqual(options[0], ["CH 1010-AL01", "CH 1010-AX01"]);
  });

  it("needs one of each type when nothing is clustered (ML 1011)", () => {
    const options = buildOptions([
      section("ML 1011-AL01", "lecture"),
      section("ML 1011-AD01", "discussion"),
      section("ML 1011-AX01", "lab"),
    ]);
    assert.deepEqual(options, [["ML 1011-AD01", "ML 1011-AL01", "ML 1011-AX01"]]);
  });

  it("adds shared labs to every lecture-discussion cluster (MA 1021)", () => {
    const options = buildOptions([
      section("MA 1021-AL02", "lecture", "5042"),
      section("MA 1021-AD02", "discussion", "5042"),
      section("MA 1021-AD03", "discussion", "5042"),
      section("MA 1021-AL04", "lecture", "5041"),
      section("MA 1021-AD04", "discussion", "5041"),
      ...many("MA 1021-AX", [1, 2], "lab"),
    ]);
    assert.deepEqual(options, [
      ["MA 1021-AD02", "MA 1021-AL02", "MA 1021-AX01"],
      ["MA 1021-AD02", "MA 1021-AL02", "MA 1021-AX02"],
      ["MA 1021-AD03", "MA 1021-AL02", "MA 1021-AX01"],
      ["MA 1021-AD03", "MA 1021-AL02", "MA 1021-AX02"],
      ["MA 1021-AD04", "MA 1021-AL04", "MA 1021-AX01"],
      ["MA 1021-AD04", "MA 1021-AL04", "MA 1021-AX02"],
    ]);
  });

  it("does not add shared labs to a cluster that has its own (PH 1110)", () => {
    const options = buildOptions([
      section("PH 1110-CL01", "lecture", "5299"),
      section("PH 1110-CD01", "discussion", "5299"),
      section("PH 1110-CT01-Multipurpose", "lecture", "5302"),
      section("PH 1110-CT01", "discussion", "5302"),
      section("PH 1110-CX03", "lab", "5302"),
      section("PH 1110-CX01", "lab"),
      section("PH 1110-CX02", "lab"),
    ]);
    assert.deepEqual(options, [
      ["PH 1110-CD01", "PH 1110-CL01", "PH 1110-CX01"],
      ["PH 1110-CD01", "PH 1110-CL01", "PH 1110-CX02"],
      ["PH 1110-CT01", "PH 1110-CT01-Multipurpose", "PH 1110-CX03"],
    ]);
  });

  it("keeps standalone lectures apart from a clustered lecture and lab (FY 1101)", () => {
    const options = buildOptions([
      section("FY 1101-B01", "lecture"),
      section("FY 1101-B02", "lecture"),
      section("FY 1101-BL03", "lecture", "5198"),
      section("FY 1101-BX03-A", "lab", "5198"),
      section("FY 1101-BX03-B", "lab", "5198"),
    ]);
    assert.deepEqual(options, [
      ["FY 1101-B01"],
      ["FY 1101-B02"],
      ["FY 1101-BL03", "FY 1101-BX03-A"],
      ["FY 1101-BL03", "FY 1101-BX03-B"],
    ]);
  });

  it("handles a clustered pair next to an unclustered pair (CS 3733)", () => {
    const options = buildOptions([
      section("CS 3733-CL01", "lecture", "5341"),
      section("CS 3733-CX01", "lab", "5341"),
      section("CS 3733-CL02", "lecture"),
      section("CS 3733-CX02", "lab"),
    ]);
    assert.deepEqual(options, [
      ["CS 3733-CL01", "CS 3733-CX01"],
      ["CS 3733-CL02", "CS 3733-CX02"],
    ]);
  });

  it("treats labs as options by themselves in a lab-only course (BB 2815)", () => {
    const options = buildOptions(many("BB 2815-AX", [1, 2, 3], "lab"));
    assert.deepEqual(options, [["BB 2815-AX01"], ["BB 2815-AX02"], ["BB 2815-AX03"]]);
  });

  it("leaves out a stray lab that no lecture is missing (IMGD 2030)", () => {
    const options = buildOptions([
      section("IMGD 2030-CL01", "lecture", "5372"),
      section("IMGD 2030-CX01", "lab", "5372"),
      section("IMGD 2030-CX02", "lab"),
    ]);
    assert.deepEqual(options, [["IMGD 2030-CL01", "IMGD 2030-CX01"]]);
  });

  it("returns options in the same order whatever order the sections come in", () => {
    const sections = [
      section("AE 2320-CX02", "lab", "5323"),
      section("AE 2320-CL01", "lecture", "5323"),
      section("AE 2320-CX03", "lab", "5323"),
      section("AE 2320-CX01", "lab", "5323"),
    ];
    const expected = [
      ["AE 2320-CL01", "AE 2320-CX01"],
      ["AE 2320-CL01", "AE 2320-CX02"],
      ["AE 2320-CL01", "AE 2320-CX03"],
    ];
    assert.deepEqual(buildOptions(sections), expected);
    assert.deepEqual(buildOptions([...sections].reverse()), expected);
  });

  it("returns [] for no sections", () => {
    assert.deepEqual(buildOptions([]), []);
  });
});
