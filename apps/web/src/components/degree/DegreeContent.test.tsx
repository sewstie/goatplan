import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Course } from "@/lib/data/types";
import { fitsLine, type DegreeSource } from "@/lib/degree";
import requirements from "@/lib/degree/sheets/cs-2030.json";
import { createDegreeSource } from "@/lib/degree/degreeSource";
import { HISTORY_KEY, type HistoryCourse } from "@/lib/degree/history";
import type { AuditRequest, AuditResponse, AuditSuccess } from "@/lib/engine";
import { DegreeContent } from "./DegreeContent";
import { useDegreeUi } from "./degreeUi";

const test = vi.hoisted(() => ({ source: null as unknown as DegreeSource }));

vi.mock("@/lib/degree/degreeSource", async (original) => ({
  ...(await original<typeof import("@/lib/degree/degreeSource")>()),
  getDegreeSource: () => test.source,
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/degree", useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

const catalog = vi.hoisted(() => ({ courses: [] as unknown[] }));
vi.mock("@/lib/degree/catalog", async (original) => ({
  ...(await original<typeof import("@/lib/degree/catalog")>()),
  loadCatalog: async () => ({ courses: catalog.courses, complete: true }),
}));

const course = (code: string, title: string, credits = 3) => ({ code, subject: code.split(" ")[0], title, credits, level: "Undergraduate", description: "", sections: [], options: [] }) as Course;
const saved = (code: string, extra: Partial<HistoryCourse> = {}): HistoryCourse => ({ code, title: "", credits: 3, status: "taken", apIb: false, source: "found", ...extra });

function answer(request: AuditRequest): AuditSuccess {
  const taken = request.taken ?? [];
  const planned = request.planned ?? [];
  const lines = new Map<number, { course: string; state: "done" | "planned" }>();
  const pool: string[] = [];
  for (const [list, state] of [[taken, "done"], [planned, "planned"]] as const) {
    for (const { code, credits } of list) {
      const free = requirements.lines.find((line) => !lines.has(line.line) && line.filter.type !== "any" && fitsLine(code, credits, line.line));
      if (free) lines.set(free.line, { course: code, state });
      else pool.push(code);
    }
  }
  const manualLines = new Map(requirements.manualItems.flatMap((item) => (item.line ? [[item.id, item.line] as const] : [])));
  const ticked = new Set((request.manual ?? []).map((id) => manualLines.get(id)));
  return {
    ok: true,
    version: 1,
    sections: requirements.sections.map((section) => {
      const auditLines = section.lines.map((id) => {
        const filled = lines.get(id);
        if (id === 7) return { id, label: "WPE", state: "empty" as const, course: null, subSlots: [0, 1, 2, 3].map(() => ({ course: null, state: "empty" as const })) };
        return { id, label: "Line", state: filled?.state ?? (ticked.has(id) ? ("done" as const) : ("empty" as const)), course: filled?.course ?? null };
      });
      return { name: section.name, done: auditLines.filter((line) => line.state === "done").length, planned: auditLines.filter((line) => line.state === "planned").length, total: auditLines.length, lines: auditLines };
    }),
    checks: ["systems", "theory", "design", "social", "science-depth", "hua-depth", "hua-breadth", "hua-ap-ib-limit", "residency"].map((id) => ({ id, label: id, state: "not-met" as const, courses: [] })),
    freeElectives: { creditsDone: 0, creditsPlanned: 0, creditsTotal: 9, courses: pool },
    extra: [],
    candidateResults: [],
  };
}

const auditReady = () => waitFor(() => expect(document.querySelector('[data-degree-audit-status="ready"]')).not.toBeNull(), { timeout: 2_000 });

async function setup(courses: HistoryCourse[] = [], extra: { pins?: { code: string; line: number }[]; manual?: string[] } = {}, audit: (request: AuditRequest) => Promise<AuditResponse> = async (request) => answer(request)) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify({ version: 1, courses, manual: extra.manual ?? [], ...(extra.pins ? { pins: extra.pins } : {}) }));
  const engine = { audit: vi.fn(audit) };
  test.source = createDegreeSource({ getStorage: () => window.localStorage, engine });
  const user = userEvent.setup();
  render(<DegreeContent />);
  await auditReady();
  return { user, engine };
}

const stored = () => JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "{}");
const tile = (name: RegExp) => screen.getByRole("button", { name });

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

beforeEach(() => {
  localStorage.clear();
  catalog.courses = [course("MA 1021", "Calculus I"), course("CS 2102", "Object-Oriented Design Concepts"), course("CS 2103", "Accelerated Object-Oriented Design Concepts")];
  useDegreeUi.setState({ panel: null, view: "sheet", filter: null, selectedTerm: null, addingTerm: null, lastAddTerm: null, keepPin: null, toast: null, whatIf: { perTerm: 3, summer: false } });
});

afterEach(() => vi.restoreAllMocks());

describe("the first visit", () => {
  it("says it's unofficial, Beta and based on the Class of 2030 sheet", async () => {
    await setup();
    expect(screen.getByText("Beta")).toBeVisible();
    expect(screen.getByText("Unofficial · Check with your advisor and Workday’s Academic Progress.")).toBeVisible();
    expect(screen.getByText("Class of 2030")).toBeVisible();
  });

  it("starts with an empty sheet of 45 lines and a way to add courses", async () => {
    await setup();
    expect(screen.getByText("0 of 45")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Your sheet starts here" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Find your courses" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Add AP or IB credit" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Add courses" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Insights" })).not.toBeInTheDocument();
    expect(screen.getByText(/Course history stays in this browser/)).toBeVisible();
    expect(tile(/^Introductory CS, line 16, empty/)).toBeVisible();
  });

  it("says so when the audit fails, and tries again", async () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify({ version: 1, courses: [], manual: [] }));
    let failing = true;
    const engine = vi.fn(async (request: AuditRequest): Promise<AuditResponse> => {
      if (failing) throw new Error("no engine");
      return answer(request);
    });
    test.source = createDegreeSource({ getStorage: () => window.localStorage, engine: { audit: engine } });
    const user = userEvent.setup();
    render(<DegreeContent />);
    const again = await screen.findByRole("button", { name: "Try again" });
    expect(screen.getByRole("alert")).toHaveTextContent("We couldn’t check your progress. Your courses are still saved.");
    failing = false;
    await user.click(again);
    await auditReady();
    expect(screen.getByText("0 of 45")).toBeVisible();
  });
});

describe("the sheet", () => {
  const someCourses = () => [saved("CS 1101", { term: "A Term 2026" }), saved("MA 1021"), saved("MA 2621", { status: "planned", term: "C Term 2027" }), saved("XFER 1000", { source: "typed", creditSource: "transfer" })];

  it("counts done, planned, to go and to check", async () => {
    await setup(someCourses());
    const summary = within(screen.getByRole("region", { name: "Your progress" }));
    expect(summary.getByText("2 of 45")).toBeVisible();
    expect(summary.getByRole("button", { name: /^2 Done/ })).toBeVisible();
    expect(summary.getByRole("button", { name: /^1 Planned/ })).toBeVisible();
    expect(summary.getByRole("button", { name: /^42 To go/ })).toBeVisible();
  });

  it("shows each state in words as well as color, with when it was taken", async () => {
    await setup(someCourses());
    expect(tile(/^CS 1101, line 16, done, A Term 2026/)).toBeVisible();
    expect(tile(/^MA 1021, line 34, done/)).toBeVisible();
    expect(tile(/^MA 2621, line \d+, planned/)).toBeVisible();
  });

  it("flags a course it couldn't find as something to check", async () => {
    await setup([saved("CS 9999", { source: "typed" })]);
    expect(tile(/^CS 9999, line \d+, check this yourself/)).toBeVisible();
    expect(screen.getByRole("button", { name: /^1 To check/ })).toBeVisible();
  });

  it("filters the sheet to planned lines and clears the filter", async () => {
    const { user } = await setup(someCourses());
    await user.click(screen.getByRole("button", { name: /^1 Planned/ }));
    expect(screen.getByText("Planned · 1 line")).toBeVisible();
    expect(screen.queryByRole("button", { name: /^CS 1101/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Insights" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filter" }));
    expect(tile(/^CS 1101/)).toBeVisible();
  });

  it("saves a tick for a project line and a WPE class", async () => {
    const { user } = await setup();
    await user.click(screen.getByRole("checkbox", { name: "IQP, line 10" }));
    await user.click(screen.getByRole("checkbox", { name: "WPE 2" }));
    expect(stored().manual).toEqual(["iqp-1", "wpe-2"]);
    await auditReady();
    expect(screen.getByRole("checkbox", { name: "IQP, line 10" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "WPE 2" })).toBeChecked();
  });

  it("counts Wellness as one line, done only when all four classes are ticked", async () => {
    await setup([], { manual: ["wpe-1", "wpe-2", "wpe-3"] });
    expect(screen.getByText("0 of 45")).toBeVisible();
    act(() => {
      test.source.setManualItem("wpe-4", true);
    });
    expect(await screen.findByText("1 of 45")).toBeVisible();
  });

  it("shows the same lines as a list with a progress bar per section", async () => {
    const { user } = await setup(someCourses());
    await user.click(screen.getByRole("button", { name: "List" }));
    expect(screen.getByRole("heading", { name: "Your sheet" })).toBeVisible();
    const math = screen.getByRole("progressbar", { name: "Mathematics: 1 of 7" });
    expect(math).toHaveAttribute("aria-valuetext", "1 done, 1 planned, 5 to go");
    const list = within(screen.getByRole("region", { name: "Your requirements" }));
    expect(list.getByRole("button", { name: /^MA 1021, line 34, done/ })).toBeVisible();
    expect(list.getByRole("button", { name: /^Math 2000\+, line 38, empty/ })).toHaveTextContent("Add a course");
    expect(list.getByRole("button", { name: /^MA 2621, line \d+, planned/ })).toHaveTextContent("Planned");
  });

  it("keeps planned lines visible when showing what is left", async () => {
    const { user } = await setup([saved("CS 1101"), saved("MA 1021", { status: "planned" })]);
    await user.click(screen.getByRole("checkbox", { name: /^What’s left/ }));
    expect(tile(/^MA 1021, line 34, planned/)).toBeVisible();
    expect(screen.queryByRole("button", { name: /^CS 1101, line/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /^What’s left/ }));
    expect(tile(/^CS 1101, line/)).toBeVisible();
  });

  it("opens the checks from a pill", async () => {
    const { user } = await setup(someCourses());
    await user.click(screen.getByRole("button", { name: "Systems: Missing. See the courses behind it" }));
    const list = within(screen.getByRole("region", { name: "Requirement checks" }));
    expect(list.getByText("No completed or planned Systems course is counted.")).toBeVisible();
    expect(list.getByRole("heading", { name: "WPI residency" })).toBeVisible();
  });
});

describe("insights", () => {
  const dated = () => [saved("CS 1101", { term: "A Term 2026" }), saved("MA 1021", { term: "B Term 2026" }), saved("MA 1022")];

  it("asks for terms until two finished courses have them", async () => {
    const { user } = await setup([saved("CS 1101"), saved("MA 1021")]);
    await user.click(screen.getByRole("button", { name: "Plan ahead" }));
    expect(screen.getAllByText("Add terms to see your pace").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Add course terms" })).toBeVisible();
    expect(screen.getByText("Average unavailable · add completed-course terms")).toBeVisible();
    expect(screen.getByText("2 completed courses have no term. Add terms for a clearer pace.")).toBeVisible();
  });

  it("can show the credits as a table", async () => {
    const { user } = await setup(dated());
    await user.click(screen.getByRole("button", { name: "Plan ahead" }));
    await user.click(screen.getByRole("button", { name: "Show as table" }));
    const table = screen.getByRole("table");
    expect(within(table).getByRole("rowheader", { name: "No term" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Show chart" }));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});

describe("moving a course", () => {
  it("moves a course to a line it's allowed on, pins it, and can undo that", async () => {
    const { user } = await setup([saved("CS 2022")]);
    await user.click(tile(/^CS 2022, line 16/));
    await user.click(screen.getByRole("button", { name: /Move to line/ }));
    const panel = within(screen.getByRole("region", { name: "Move to line…" }));
    await user.click(panel.getByRole("radio", { name: /Mathematics · 34/ }));
    await user.click(panel.getByRole("button", { name: "Move & pin" }));
    expect(stored().pins).toEqual([{ code: "CS 2022", line: 34 }]);
    await auditReady();
    expect(tile(/^CS 2022, line 34, done, pinned/)).toBeVisible();
    expect(screen.getByText("CS 2022 moved to Math 34 and pinned.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(stored().pins).toBeUndefined();
  });

  it("only offers lines the course is allowed on", async () => {
    const { user } = await setup([saved("CS 2022")]);
    await user.click(tile(/^CS 2022/));
    await user.click(screen.getByRole("button", { name: /Move to line/ }));
    const panel = within(screen.getByRole("region", { name: "Move to line…" }));
    expect(panel.getByText("CS 2022 cannot fill Statistics, line 40. Only allowed targets are selectable.")).toBeVisible();
    expect(panel.queryByRole("radio", { name: /· 40/ })).not.toBeInTheDocument();
  });

  it("asks first when a pin fills fewer lines, and saves nothing until it's kept", async () => {
    const { user } = await setup([saved("CS 2022"), saved("MA 1021"), saved("MA 1022"), saved("MA 1023"), saved("MA 1024"), saved("MA 2071")]);
    await user.click(tile(/^CS 2022/));
    await user.click(screen.getByRole("button", { name: /Move to line/ }));
    const panel = within(screen.getByRole("region", { name: "Move to line…" }));
    await user.click(panel.getByRole("radio", { name: /Mathematics · 38/ }));
    await user.click(panel.getByRole("button", { name: "Move & pin" }));
    const dialog = await screen.findByRole("dialog", { name: "Keep this pin?" });
    expect(dialog).toHaveTextContent("it fills one fewer line");
    expect(dialog).toHaveTextContent("The pin is not saved until you choose Keep pin.");
    expect(stored().pins).toBeUndefined();
    await user.click(within(dialog).getByRole("button", { name: "Use best fit" }));
    expect(stored().pins).toBeUndefined();
  });

  it("offers Unpin only for a pinned course", async () => {
    const { user } = await setup([saved("CS 2022")], { pins: [{ code: "CS 2022", line: 38 }] });
    await user.click(tile(/^CS 2022, line 38/));
    const panel = within(screen.getByRole("region", { name: "Course options" }));
    expect(panel.getByText("Pinned by you")).toBeVisible();
    await user.click(panel.getByRole("button", { name: "Unpin" }));
    expect(stored().pins).toBeUndefined();
  });

  it("offers courses from the history for an empty line", async () => {
    const { user } = await setup([saved("CS 2022")], { pins: [{ code: "CS 2022", line: 38 }] });
    await user.click(tile(/^CS 2000\+, 5 lines left, lines 17 to 21/));
    await user.click(tile(/^CS 2000\+, line 18, empty/));
    const panel = within(screen.getByRole("region", { name: "Courses that fit line 18" }));
    expect(panel.getByText("CS 2022 / MA 2201")).toBeVisible();
    expect(panel.getByText("Currently pinned to Mathematics, line 38")).toBeVisible();
    await user.click(panel.getByRole("button", { name: "Move CS 2022 here" }));
    expect(stored().pins).toEqual([{ code: "CS 2022", line: 18 }]);
  });
});

describe("course history", () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 10, 6) }));
  afterEach(() => vi.useRealTimers());

  const openHistory = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("button", { name: "Course history" }));
    return within(screen.getByRole("region", { name: "Course history" }));
  };

  it("groups courses by term, newest first, with the courses without a term last", async () => {
    const { user } = await setup([saved("PSY 1400", { title: "Psychology" }), saved("CS 1101", { term: "A Term 2026" }), saved("CS 2102", { term: "B Term 2026", status: "planned" })]);
    const panel = await openHistory(user);
    expect(panel.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(["B Term 2026", "A Term 2026", "No term"]);
    expect(panel.getByText("Psychology · ⅓ unit")).toBeVisible();
    expect(panel.getByText("3 courses · Newest terms first. Courses without a term are last.")).toBeVisible();
    expect(within(panel.getByRole("button", { name: "Edit CS 2102" })).getByText("In progress")).toBeVisible();
    expect(within(panel.getByRole("button", { name: "Edit CS 1101" })).getByText("Taken")).toBeVisible();
  });

  it("edits a course's units and term with the term grid", async () => {
    const { user } = await setup([saved("CS 2102")]);
    const panel = await openHistory(user);
    await user.click(panel.getByRole("button", { name: "Edit CS 2102" }));
    const edit = within(screen.getByRole("region", { name: "Edit course" }));
    await user.click(edit.getByRole("radio", { name: "⅙" }));
    await user.click(edit.getByRole("button", { name: /^Term \(optional\)/ }));
    await user.click(screen.getByRole("button", { name: "C Term 2027" }));
    expect(edit.getByRole("button", { name: "Planned" })).toHaveAttribute("aria-pressed", "true");
    await user.click(edit.getByRole("button", { name: "Save changes" }));
    expect(stored().courses[0]).toMatchObject({ credits: 1.5, term: "C Term 2027", status: "planned" });
  });

  it("refuses units it can't read", async () => {
    const { user } = await setup([saved("CS 2102")]);
    const panel = await openHistory(user);
    await user.click(panel.getByRole("button", { name: "Edit CS 2102" }));
    const edit = within(screen.getByRole("region", { name: "Edit course" }));
    await user.click(edit.getByRole("radio", { name: "Other" }));
    await user.type(edit.getByRole("textbox", { name: "Units" }), "lots");
    await user.click(edit.getByRole("button", { name: "Save changes" }));
    expect(edit.getByRole("alert")).toHaveTextContent("Enter WPI units, like 1/3 or 1/6.");
    expect(stored().courses[0].credits).toBe(3);
  });

  it("removes a course with its pin, and Undo brings both back", async () => {
    const { user } = await setup([saved("CS 2022")], { pins: [{ code: "CS 2022", line: 38 }] });
    const panel = await openHistory(user);
    await user.click(panel.getByRole("button", { name: "Remove CS 2022" }));
    expect(stored().courses).toEqual([]);
    expect(stored().pins).toBeUndefined();
    expect(screen.getByText("CS 2022 removed from history.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(stored().courses).toHaveLength(1);
    expect(stored().pins).toEqual([{ code: "CS 2022", line: 38 }]);
  });

  it("adds searched courses to the last finished term, and the status follows the term", async () => {
    const { user } = await setup();
    await user.click(screen.getByRole("button", { name: "Find your courses" }));
    const panel = within(screen.getByRole("region", { name: "Add courses" }));
    expect(panel.getByRole("button", { name: /^Adding to A Term 2026/ })).toBeVisible();
    await user.type(panel.getByRole("combobox", { name: "Course code or title" }), "CS 2102");
    await user.click(await panel.findByRole("button", { name: "Add CS 2102" }));
    expect(stored().courses[0]).toMatchObject({ code: "CS 2102", title: "Object-Oriented Design Concepts", source: "found", term: "A Term 2026", status: "taken" });
    expect(panel.getByText("CS 2102 added to A Term 2026 as taken.")).toBeVisible();

    await user.click(panel.getByRole("button", { name: "In progress" }));
    expect(panel.getByRole("button", { name: /^Adding to B Term 2026/ })).toBeVisible();
    const box = panel.getByRole("combobox", { name: "Course code or title" });
    await user.clear(box);
    await user.type(box, "MA 1021");
    await panel.findByRole("button", { name: "Add MA 1021" });
    await user.keyboard("{Enter}");
    expect(stored().courses[1]).toMatchObject({ code: "MA 1021", term: "B Term 2026", status: "planned" });
    await user.click(panel.getByRole("button", { name: "Undo" }));
    expect(stored().courses.map((course: HistoryCourse) => course.code)).toEqual(["CS 2102"]);
  });

  it("adds a WPI course by hand, in WPI units, with the same term choice as search", async () => {
    const { user } = await setup();
    await user.click(screen.getByRole("button", { name: "Find your courses" }));
    await user.click(screen.getByRole("button", { name: "Add manual credit" }));
    const panel = within(screen.getByRole("region", { name: "Add manual credit" }));
    expect(panel.getAllByRole("radio").slice(0, 3).map((radio) => radio.textContent)).toEqual(["WPI", "AP", "IB"]);
    expect(panel.getByRole("button", { name: /^Adding to A Term 2026/ })).toBeVisible();
    await user.type(panel.getByRole("textbox", { name: "Course code" }), "cs 1005");
    await user.click(panel.getByRole("radio", { name: "⅙" }));
    await user.type(panel.getByRole("textbox", { name: "Course title (optional)" }), "A retired course");
    await user.click(panel.getByRole("button", { name: "Add to history" }));
    expect(stored().courses[0]).toMatchObject({ code: "CS 1005", credits: 1.5, title: "A retired course", creditSource: "wpi", source: "typed", status: "taken", term: "A Term 2026" });
    expect(panel.getByText("CS 1005 added to A Term 2026 as taken.")).toBeVisible();
    expect(panel.getByRole("textbox", { name: "Course code" })).toHaveValue("");
  });

  it("turns an AP exam and score into the WPI courses it earns", async () => {
    const { user } = await setup([saved("MA 1021")]);
    await user.click(screen.getByRole("button", { name: "Course history" }));
    await user.click(screen.getByRole("button", { name: "Manual credit" }));
    const panel = within(screen.getByRole("region", { name: "Add manual credit" }));
    await user.click(panel.getByRole("radio", { name: "AP" }));
    await user.click(panel.getByRole("combobox", { name: "AP exam" }));
    await user.click(screen.getByRole("option", { name: "Calculus BC" }));
    await user.click(panel.getByRole("radio", { name: "5" }));
    const earns = within(panel.getByRole("region", { name: "What this exam earns" }));
    expect(earns.getByText("MA 1022")).toBeVisible();
    expect(earns.getByText("MA 1021 is already in your history.")).toBeVisible();
    expect(panel.getByRole("button", { name: /^Adding to No term/ })).toBeVisible();
    await user.click(panel.getByRole("button", { name: "Add 2 courses" }));
    expect(panel.getByText("MA 1022, MA 1023 added to your history as taken.")).toBeVisible();
    expect(stored().courses.slice(1)).toEqual([
      expect.objectContaining({ code: "MA 1022", apIb: true, creditSource: "ap", status: "taken" }),
      expect.objectContaining({ code: "MA 1023", apIb: true, creditSource: "ap", status: "taken" }),
    ]);
  });

  it("refuses text that isn't shaped like a course code", async () => {
    const { user } = await setup();
    await user.click(screen.getByRole("button", { name: "Find your courses" }));
    await user.click(screen.getByRole("button", { name: "Add manual credit" }));
    const panel = within(screen.getByRole("region", { name: "Add manual credit" }));
    await user.type(panel.getByRole("textbox", { name: "Course code" }), "not a code");
    await user.click(panel.getByRole("button", { name: "Add to history" }));
    expect(panel.getByRole("alert")).toHaveTextContent("That doesn’t look like a course code.");
    expect(stored().courses).toEqual([]);
  });

  it("says so when Enter picks a course that's already in history", async () => {
    const { user } = await setup([saved("CS 2102")]);
    await user.click(screen.getByRole("button", { name: "Add courses" }));
    const panel = within(screen.getByRole("region", { name: "Add courses" }));
    await user.type(panel.getByRole("combobox", { name: "Course code or title" }), "CS 2102");
    await panel.findByText("In history");
    await user.keyboard("{Enter}");
    expect(panel.getByText("CS 2102 is already in your history.")).toBeVisible();
  });

});

describe("when the browser won't keep a change", () => {
  it("offers a copy, keeps working in this page and doesn't claim it saved", async () => {
    const { user } = await setup([saved("CS 1101")]);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("full");
    });
    await user.click(screen.getByRole("checkbox", { name: "IQP, line 10" }));
    const dialog = await screen.findByRole("dialog", { name: "Keep a copy of your changes" });
    expect(dialog).toHaveTextContent("Not saved on this device");
    expect(within(dialog).getByRole("button", { name: "Export history & pins" })).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: "Keep planning" }));
    expect(screen.queryByRole("dialog", { name: "Keep a copy of your changes" })).not.toBeInTheDocument();
    vi.restoreAllMocks();
    expect(test.source.saveAgain()).toBe(true);
    expect(stored().manual).toEqual(["iqp-1"]);
  });
});

