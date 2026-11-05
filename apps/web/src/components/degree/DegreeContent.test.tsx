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
const saved = (code: string, extra: Partial<HistoryCourse> = {}): HistoryCourse => ({ code, title: "", credits: 3, inProgress: false, apIb: false, source: "found", ...extra });

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
  useDegreeUi.setState({ panel: null, view: "sheet", screen: "main", filter: null, selectedTerm: null, keepPin: null, restored: null, toast: null, whatIf: { perTerm: 3, summer: false, bsMs: false } });
});

afterEach(() => vi.restoreAllMocks());

describe("the first visit", () => {
  it("says it's unofficial, Beta and based on the Class of 2030 sheet", async () => {
    await setup();
    expect(screen.getByText("Beta")).toBeVisible();
    expect(screen.getByText("Unofficial · Check with your advisor and Workday’s Academic Progress.")).toBeVisible();
    expect(screen.getByText("Based on the Class of 2030 sheet")).toBeVisible();
  });

  it("starts with an empty sheet of 45 lines and a way to add courses", async () => {
    await setup();
    expect(screen.getByText("0 of 45")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Your sheet starts here" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Add several courses" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Add one course" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Add courses" })).not.toBeInTheDocument();
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
  const someCourses = () => [saved("CS 1101", { term: "A Term 2026" }), saved("MA 1021", { term: "Prior credit" }), saved("MA 2621", { inProgress: true, term: "C Term 2027" }), saved("XFER 1000", { source: "typed", creditSource: "transfer" })];

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
    expect(tile(/^MA 1021, line 34, done, Prior/)).toBeVisible();
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
    expect(screen.getByText("Showing only planned coursework")).toBeVisible();
    expect(screen.getByText("Planned · 1 lines")).toBeVisible();
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
    expect(screen.getByRole("heading", { name: "Your requirements" })).toBeVisible();
    const math = screen.getByRole("progressbar", { name: "Mathematics: 1 of 7" });
    expect(math).toHaveAttribute("aria-valuetext", "1 done, 1 planned, 5 to go");
    await user.click(screen.getByRole("button", { name: /^Mathematics/ }));
    expect(screen.getByRole("button", { name: "MA 1021 → Mathematics, line 34" })).toBeVisible();
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
    await setup([saved("CS 1101"), saved("MA 1021")]);
    expect(screen.getAllByText("Add terms to see your pace").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Add course terms" })).toBeVisible();
    expect(screen.getByText("Average unavailable · add completed-course terms")).toBeVisible();
    expect(screen.getByText("2 completed courses have no term. Add terms for a clearer pace.")).toBeVisible();
  });

  it("can show the credits as a table", async () => {
    const { user } = await setup(dated());
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

  it("resets every pin from the sheet options, keeping the history", async () => {
    const { user } = await setup([saved("CS 2022")], { pins: [{ code: "CS 2022", line: 38 }] });
    await user.click(screen.getByRole("button", { name: "Sheet options" }));
    await user.click(screen.getByRole("button", { name: "Reset to best fit" }));
    expect(stored().pins).toBeUndefined();
    expect(stored().courses).toHaveLength(1);
    expect(screen.getByText("Sheet reset to best fit.")).toBeVisible();
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
  const openHistory = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("button", { name: "Sheet options" }));
    await user.click(screen.getByRole("button", { name: "Course history" }));
    return within(screen.getByRole("region", { name: "Course history" }));
  };

  it("groups courses by term, newest first, with the courses without a term last", async () => {
    const { user } = await setup([saved("PSY 1400", { title: "Psychology" }), saved("CS 1101", { term: "A Term 2026" }), saved("CS 2102", { term: "B Term 2026" })]);
    const panel = await openHistory(user);
    expect(panel.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(["B Term 2026", "A Term 2026", "No term"]);
    expect(panel.getByText("Psychology")).toBeVisible();
    expect(panel.getByText("3 records · 3 courses")).toBeVisible();
  });

  it("edits a course's units and term", async () => {
    const { user } = await setup([saved("CS 2102")]);
    const panel = await openHistory(user);
    await user.click(panel.getByRole("button", { name: "CS 2102 details" }));
    const details = within(screen.getByRole("region", { name: "Course details" }));
    await user.clear(details.getByRole("textbox", { name: "Units" }));
    await user.type(details.getByRole("textbox", { name: "Units" }), "1/6");
    await user.click(details.getByRole("button", { name: "Save changes" }));
    expect(stored().courses[0].credits).toBe(1.5);
  });

  it("refuses units it can't read", async () => {
    const { user } = await setup([saved("CS 2102")]);
    const panel = await openHistory(user);
    await user.click(panel.getByRole("button", { name: "CS 2102 details" }));
    const details = within(screen.getByRole("region", { name: "Course details" }));
    await user.clear(details.getByRole("textbox", { name: "Units" }));
    await user.type(details.getByRole("textbox", { name: "Units" }), "lots");
    await user.click(details.getByRole("button", { name: "Save changes" }));
    expect(details.getByRole("alert")).toHaveTextContent("Enter WPI units, like 1/3 or 1/6.");
    expect(stored().courses[0].credits).toBe(3);
  });

  it("removes a course with its pin, and Undo brings both back", async () => {
    const { user } = await setup([saved("CS 2022")], { pins: [{ code: "CS 2022", line: 38 }] });
    const panel = await openHistory(user);
    await user.click(panel.getByRole("button", { name: "CS 2022 details" }));
    await user.click(screen.getByRole("button", { name: "Remove course" }));
    expect(stored().courses).toEqual([]);
    expect(stored().pins).toBeUndefined();
    expect(screen.getByText("CS 2022 removed from history.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(stored().courses).toHaveLength(1);
    expect(stored().pins).toEqual([{ code: "CS 2022", line: 38 }]);
  });

  it("finds a course across terms and adds it", async () => {
    const { user } = await setup();
    await user.click(screen.getByRole("button", { name: "Add one course" }));
    const panel = within(screen.getByRole("region", { name: "Add to course history" }));
    await user.type(panel.getByRole("textbox", { name: "Course code or title" }), "CS 2102");
    await user.click(await panel.findByRole("button", { name: "Use CS 2102" }));
    expect(stored().courses[0]).toMatchObject({ code: "CS 2102", title: "Object-Oriented Design Concepts", source: "found" });
  });

  it("adds a retired course by hand, in WPI units", async () => {
    const { user } = await setup();
    await user.click(screen.getByRole("button", { name: "Add one course" }));
    await user.click(screen.getByRole("button", { name: "Enter a course manually" }));
    const panel = within(screen.getByRole("region", { name: "Add a manual course" }));
    await user.type(panel.getByRole("textbox", { name: "Course code" }), "xfer 1040");
    await user.clear(panel.getByRole("textbox", { name: "Units" }));
    await user.type(panel.getByRole("textbox", { name: "Units" }), "1/6");
    await user.type(panel.getByRole("textbox", { name: "Course title (optional)" }), "Transferred science elective");
    await user.click(panel.getByRole("button", { name: "Add to history" }));
    expect(stored().courses[0]).toMatchObject({ code: "XFER 1040", credits: 1.5, title: "Transferred science elective", term: "Prior credit", creditSource: "transfer", source: "typed" });
  });

  it("refuses text that isn't shaped like a course code", async () => {
    const { user } = await setup();
    await user.click(screen.getByRole("button", { name: "Add one course" }));
    await user.click(screen.getByRole("button", { name: "Enter a course manually" }));
    const panel = within(screen.getByRole("region", { name: "Add a manual course" }));
    await user.type(panel.getByRole("textbox", { name: "Course code" }), "not a code");
    await user.click(panel.getByRole("button", { name: "Add to history" }));
    expect(panel.getByRole("alert")).toHaveTextContent("That doesn’t look like a course code.");
    expect(stored().courses).toEqual([]);
  });

  it("keeps only course details from pasted text, and asks before adding", async () => {
    const { user } = await setup([saved("CS 1101")]);
    await user.click(screen.getByRole("button", { name: "Add courses" }));
    await user.click(screen.getByRole("tab", { name: "Add several" }));
    await user.type(screen.getByRole("textbox", { name: "Workday course text" }), "CS 1101 Grade A{enter}MA 1021 · Calculus I{enter}A Term 2026 · Grade A{enter}CS 2102{enter}C Term 2027 · In progress");
    await user.click(screen.getByRole("button", { name: "Review 3 courses" }));
    const panel = within(await screen.findByRole("region", { name: "Review detected courses" }));
    expect(panel.getByText("Nothing has been saved yet.", { exact: false })).toBeVisible();
    expect(panel.getByRole("checkbox", { name: "Add CS 1101" })).toBeDisabled();
    expect(panel.getByText("A Term 2026 · ⅓ unit · completed")).toBeVisible();
    expect(panel.getByText("C Term 2027 · ⅓ unit · in progress")).toBeVisible();
    await user.click(panel.getByRole("button", { name: "Add 2 courses" }));
    const courses = stored().courses as HistoryCourse[];
    expect(courses.map((item) => item.code)).toEqual(["CS 1101", "MA 1021", "CS 2102"]);
    expect(courses[1]).toMatchObject({ term: "A Term 2026", inProgress: false });
    expect(courses[2]).toMatchObject({ term: "C Term 2027", inProgress: true });
    expect(JSON.stringify(courses)).not.toContain("Grade");
  });
});

describe("moving history between devices", () => {
  const file = (body: object, name = "GoatPlan-history.json") => new File([JSON.stringify(body)], name, { type: "application/json" });
  const openTransfer = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("button", { name: "Sheet options" }));
    await user.click(screen.getByRole("button", { name: "Import history" }));
  };

  it("shows what a file would add before adding it, then merges", async () => {
    const { user } = await setup([saved("CS 1101")]);
    await openTransfer(user);
    await user.upload(screen.getByLabelText("History file"), file({ version: 1, courses: [saved("CS 1101"), saved("MA 1021")], manual: [] }));
    const panel = within(await screen.findByRole("region", { name: "Review history import" }));
    expect(panel.getByText("Valid GoatPlan export · 2 courses")).toBeVisible();
    expect(panel.getByText("1 course is already on this device.", { exact: false })).toBeVisible();
    expect(stored().courses).toHaveLength(1);
    await user.click(panel.getByRole("button", { name: "Import 1 course" }));
    expect((stored().courses as HistoryCourse[]).map((item) => item.code)).toEqual(["CS 1101", "MA 1021"]);
  });

  it("reviews pins as well, and reports one it can't restore without losing the rest", async () => {
    const { user } = await setup();
    await openTransfer(user);
    await user.upload(screen.getByLabelText("History file"), file({ version: 1, courses: [saved("CS 2022"), saved("CS 2119")], manual: [], pins: [{ code: "CS 2022", line: 38 }, { code: "CS 2119", line: 18 }] }));
    await user.click(within(await screen.findByRole("region", { name: "Review history import" })).getByRole("button", { name: "Import 2 courses" }));
    const review = within(screen.getByRole("region", { name: "Review history & pins" }));
    expect(review.getByText("2 course records · 2 manual pins")).toBeVisible();
    expect(review.getByText("Not allowed")).toBeVisible();
    expect(stored().courses).toEqual([]);
    await user.click(review.getByRole("button", { name: "Import history & pins" }));
    expect(stored().pins).toEqual([{ code: "CS 2022", line: 38 }]);
    expect(stored().courses).toHaveLength(2);
    const dialog = screen.getByRole("dialog", { name: "Review a restored pin" });
    expect(dialog).toHaveTextContent("CS 2119 is not allowed on Computer science, line 18.");
    expect(dialog).toHaveTextContent("Pin kept");
  });

  it("says what's wrong with a bad file and changes nothing", async () => {
    const { user } = await setup([saved("CS 1101")]);
    await openTransfer(user);
    await user.upload(screen.getByLabelText("History file"), file({ version: 1, courses: [{ ...saved("MA 1021"), credits: -1 }], manual: [] }, "my-course-history.json"));
    const panel = within(await screen.findByRole("region", { name: "Your history is unchanged" }));
    expect(panel.getByText("my-course-history.json")).toBeVisible();
    expect(panel.getByText(/One record has an invalid credit amount\. Nothing was imported; your 1 existing course is unchanged\./)).toBeVisible();
    expect(stored().courses).toHaveLength(1);
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

describe("how courses count", () => {
  it("explains a cross-listed course and goes back", async () => {
    const { user } = await setup([saved("CS 2022")]);
    await user.click(screen.getByRole("button", { name: "Sheet options" }));
    await user.click(screen.getByRole("button", { name: "How your courses count" }));
    expect(await screen.findByRole("heading", { name: "How your courses count" })).toBeVisible();
    expect(screen.getByText("CS 2022 / MA 2201")).toBeVisible();
    expect(screen.getByText("Counted once")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Back to My degree" }));
    expect(screen.getByRole("heading", { name: "My degree" })).toBeVisible();
  });
});
