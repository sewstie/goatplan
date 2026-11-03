import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import type { TermFile } from "@/lib/data/types";
import { PlannerProvider } from "@/lib/store";
import { createPlannerStore } from "@/lib/store/createPlannerStore";
import { loaded, solved, termFile, termSummary } from "@/lib/store/testing/fixtures";
import { AddToCalendarButton } from "./AddToCalendarButton";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

const { track, phone } = vi.hoisted(() => ({ track: vi.fn(), phone: { value: false } }));
vi.mock("@/lib/analytics/track", () => ({ track }));
vi.mock("@/components/shell/usePhoneViewport", () => ({ usePhoneViewport: () => phone.value }));

let downloads: { name: string; blob: Blob }[] = [];

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
});

beforeEach(() => {
  downloads = [];
  const blobs = new Map<string, Blob>();
  URL.createObjectURL = vi.fn((blob: Blob) => {
    const url = `blob:test-${blobs.size}`;
    blobs.set(url, blob);
    return url;
  });
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push({ name: this.download, blob: blobs.get(this.href)! });
  });
});

afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); phone.value = false; });

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(blob);
  });
}

function withUntimed(file: TermFile, code: string): TermFile {
  return { ...file, courses: file.courses.map((course) => course.code === code ? { ...course, sections: course.sections.map((section) => ({ ...section, meetings: [] })) } : course) };
}

async function setup(courses: string[], term: (id: string) => TermFile = termFile, termId = "2027-C") {
  const user = userEvent.setup();
  const store = createPlannerStore({ storage: null, engine: { loadTerm: async (id) => loaded(id), solve: async (request) => solved(request) }, loadTermIndex: async () => ({ terms: [{ ...termSummary(termId) }] }), loadTerm: async (id) => term(id), takeTermBuffer: () => null });
  await store.getState().init();
  render(<PlannerProvider store={store}><AddToCalendarButton /></PlannerProvider>);
  await act(async () => {
    for (const code of courses) store.getState().addCourse(code);
    await store.getState().retrySolve();
  });
  return { user, store };
}

async function openExport(courses: string[], term?: (id: string) => TermFile, termId?: string) {
  const made = await setup(courses, term, termId);
  await made.user.click(screen.getByRole("button", { name: "Export" }));
  return made;
}

it("stays disabled until there is a schedule", async () => {
  await setup([]);
  expect(screen.getByRole("button", { name: "Export" })).toBeDisabled();
});

it("opens a short popover: one summary line and Download, with the rest under Details", async () => {
  await openExport(["AE 2320"]);
  const button = screen.getByRole("button", { name: "Export" });
  const dialog = screen.getByRole("dialog", { name: "Export to calendar" });
  expect(button).toHaveAttribute("aria-expanded", "true");
  expect(button).toHaveAttribute("aria-controls", dialog.id);
  expect(dialog).toHaveTextContent(/2 classes · Jan 13–Mar 5, 2027/);
  expect(screen.getByRole("button", { name: "Download .ics" })).toHaveFocus();
  const details = screen.getByText("Details").closest("details")!;
  expect(details).not.toHaveAttribute("open");
  expect(details).toHaveTextContent("AE 2320 · CL01");
  expect(details).toHaveTextContent("Jan 13 follows Monday’s schedule");
  expect(details).toHaveTextContent("Feb 25 · Academic Advising Day");
  expect(details).toHaveTextContent("follow daylight saving");
  expect(dialog).not.toHaveTextContent("America/New_York");
  expect(downloads).toEqual([]);
});

it("downloads the chosen sections as a calendar file and records the event", async () => {
  const { user } = await openExport(["AE 2320"]);
  await user.click(screen.getByRole("button", { name: "Download .ics" }));
  expect(downloads).toHaveLength(1);
  expect(downloads[0].name).toBe("GoatPlan-C-Term-2027.ics");
  expect(downloads[0].blob.type).toBe("text/calendar;charset=utf-8");
  const text = await readBlob(downloads[0].blob);
  expect(text).toContain("SUMMARY:AE 2320 Lecture CL01");
  expect(text).toContain("SUMMARY:AE 2320 Lab CX01");
  expect(text).not.toContain("CX02");
  expect(track).toHaveBeenCalledExactlyOnceWith("ics_exported");
  const dialog = screen.getByRole("dialog", { name: "Export to calendar" });
  expect(within(dialog).getByRole("status")).toHaveTextContent("Downloaded ✓ GoatPlan-C-Term-2027.ics");
  expect(dialog).toHaveTextContent("Google Calendar: Settings, then Import & export.");
});

it("works from the keyboard and downloads again on request", async () => {
  const { user } = await openExport(["AE 2320"]);
  await user.keyboard("{Enter}");
  await waitFor(() => expect(screen.getByRole("button", { name: "Download again" })).toHaveFocus());
  await user.keyboard("{Enter}");
  expect(downloads).toHaveLength(2);
});

it("closes on Escape and gives focus back to Export", async () => {
  const { user } = await openExport(["AE 2320"]);
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Export" })).toHaveFocus();
});

it("keeps a full touch target on a phone", async () => {
  phone.value = true;
  await setup(["AE 2320"]);
  expect(screen.getByRole("button", { name: "Export" })).toHaveClass("max-tablet:min-h-44");
});

it("says which sections stay out for having no set time", async () => {
  const { user } = await openExport(["AE 2320", "AE 2410"], (id) => withUntimed(termFile(id), "AE 2410"));
  const dialog = screen.getByRole("dialog", { name: "Export to calendar" });
  expect(dialog).toHaveTextContent("1 left out");
  expect(screen.getByText("Details").closest("details")).toHaveTextContent("No set time, so left out: AE 2410 · C01");
  await user.click(screen.getByRole("button", { name: "Download .ics" }));
  const text = await readBlob(downloads[0].blob);
  expect(text).toContain("AE 2320");
  expect(text).not.toContain("AE 2410");
});

it("leaves days off out of the file", async () => {
  const { user } = await openExport(["AE 2320"]);
  await user.click(screen.getByRole("button", { name: "Download .ics" }));
  expect(await readBlob(downloads[0].blob)).toContain("EXDATE;TZID=America/New_York:20270118T");
});

it("still downloads when the term has no calendar entry, once the student accepts that", async () => {
  const { user } = await openExport(["AE 2320"], termFile, "2030-A");
  const dialog = screen.getByRole("dialog", { name: "Export to calendar" });
  expect(dialog).toHaveTextContent("WPI calendar information is unavailable");
  const download = screen.getByRole("button", { name: "Download without adjustments" });
  await user.click(screen.getByRole("checkbox", { name: /Download without WPI calendar adjustments/ }));
  expect(download).toBeDisabled();
  await user.click(screen.getByRole("checkbox", { name: /Download without WPI calendar adjustments/ }));
  await user.click(download);
  expect(await readBlob(downloads[0].blob)).not.toContain("EXDATE");
});

it("has nothing to download when no section has a set time", async () => {
  await openExport(["AE 2410"], (id) => withUntimed(termFile(id), "AE 2410"));
  const dialog = screen.getByRole("dialog", { name: "Export to calendar" });
  expect(dialog).toHaveTextContent("None of the classes in this schedule have dates and times to add.");
  expect(within(dialog).getByRole("button", { name: "Download .ics" })).toBeDisabled();
  expect(track).not.toHaveBeenCalled();
});

it("never puts blocked times in the file", async () => {
  const { user, store } = await setup(["AE 2410"]);
  await act(async () => {
    store.getState().setPreferences({ blocked: [{ day: "Fri", start: 840, end: 960, label: "Private appointment" }] });
    await store.getState().retrySolve();
  });
  await user.click(screen.getByRole("button", { name: "Export" }));
  await user.click(screen.getByRole("button", { name: "Download .ics" }));
  const text = await readBlob(downloads[0].blob);
  expect(text.match(/RRULE:FREQ=WEEKLY/g)).toHaveLength(1);
  expect(text).not.toContain("Private appointment");
  expect(text).not.toContain("BYDAY=FR");
});
