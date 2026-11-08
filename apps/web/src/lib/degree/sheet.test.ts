import { describe, expect, it } from "vitest";
import { isTileStack, sectionFinished, sectionsWithMqp, stackEmptyTiles, type SheetSection, type SheetTile } from "./sheet";

const tile = (line: number, changes: Partial<SheetTile> = {}): SheetTile => ({
  key: String(line),
  line,
  number: String(line).padStart(2, "0"),
  label: "CS 4000+",
  kind: "empty",
  course: null,
  detail: null,
  pinned: false,
  manualId: null,
  checked: false,
  term: null,
  ...changes,
});

const section = (id: string, tiles: SheetTile[]): SheetSection => ({ id, name: id, lineRange: "", done: 0, planned: 0, total: tiles.length, tiles, note: null, caption: null });

describe("stackEmptyTiles", () => {
  it("folds identical empty lines in a row into one stack", () => {
    const [stack] = stackEmptyTiles([26, 27, 28, 29, 30].map((line) => tile(line)));
    expect(isTileStack(stack) && stack.label).toBe("CS 4000+");
    expect(isTileStack(stack) && stack.tiles.map((item) => item.line)).toEqual([26, 27, 28, 29, 30]);
  });

  it("leaves a single empty line as a tile", () => {
    const items = stackEmptyTiles([tile(22, { label: "Systems" })]);
    expect(items.some(isTileStack)).toBe(false);
  });

  it("doesn't stack across a filled line or a different label", () => {
    const items = stackEmptyTiles([tile(1), tile(2), tile(3, { kind: "done", course: "CS 4123" }), tile(4), tile(5, { label: "Design" }), tile(6, { label: "Design" })]);
    expect(items.map((item) => (isTileStack(item) ? `stack ${item.tiles.length}` : item.line))).toEqual(["stack 2", 3, 4, "stack 2"]);
  });

  it("never stacks a filled line, however alike", () => {
    const items = stackEmptyTiles([tile(1, { kind: "planned" }), tile(2, { kind: "planned" })]);
    expect(items.some(isTileStack)).toBe(false);
  });
});

describe("sectionsWithMqp", () => {
  const cs = section("cs", [tile(16, { label: "Introductory CS", kind: "done" }), tile(30), tile(31, { kind: "tick", checked: true, label: "MQP" }), tile(32, { kind: "tick", label: "MQP" }), tile(33, { kind: "tick", label: "MQP" })]);
  const math = section("math", [tile(34)]);

  it("puts MQP on its own row right after computer science, with its official lines", () => {
    const sections = sectionsWithMqp([cs, math]);
    expect(sections.map((item) => item.id)).toEqual(["cs", "mqp", "math"]);
    expect(sections[1].name).toBe("MQP");
    expect(sections[1].lineRange).toBe("Lines 31–33");
    expect(sections[1].tiles.map((item) => item.line)).toEqual([31, 32, 33]);
  });

  it("counts each row's own lines, keeping the same total", () => {
    const [csRow, mqpRow] = sectionsWithMqp([cs, math]);
    expect([csRow.total, csRow.done]).toEqual([2, 1]);
    expect([mqpRow.total, mqpRow.done]).toEqual([3, 1]);
  });
});

describe("sectionFinished", () => {
  it("is true when every line is done or ticked", () => {
    expect(sectionFinished(section("a", [tile(8, { kind: "done" }), tile(9, { kind: "tick", checked: true })]))).toBe(true);
  });

  it.each([
    ["an empty line", tile(9)],
    ["a planned course", tile(9, { kind: "planned" })],
    ["a line to check", tile(9, { kind: "check" })],
    ["an unticked box", tile(9, { kind: "tick" })],
  ])("stays open with %s left", (_name, last) => {
    expect(sectionFinished(section("a", [tile(8, { kind: "done" }), last]))).toBe(false);
  });
});
