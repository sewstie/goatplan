import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { PlannerProvider } from "@/lib/store";
import { createPlannerStore } from "@/lib/store/createPlannerStore";
import { loaded, solved, termFile, termSummary } from "@/lib/store/testing/fixtures";
import { decodePlan } from "@/lib/share/codec";
import { shareData } from "@/lib/share/url";
import { ShareButton } from "./ShareButton";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

const { track, phone } = vi.hoisted(() => ({ track: vi.fn(), phone: { value: false } }));
vi.mock("@/lib/analytics/track", () => ({ track }));
vi.mock("@/components/shell/usePhoneViewport", () => ({ usePhoneViewport: () => phone.value }));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
});

afterEach(() => { vi.clearAllMocks(); phone.value = false; vi.unstubAllGlobals(); });

async function setup() {
  const user = userEvent.setup();
  const store = createPlannerStore({ storage: null, engine: { loadTerm: async (id) => loaded(id), solve: async (request) => solved(request) }, loadTermIndex: async () => ({ terms: [termSummary("2027-C")] }), loadTerm: async (id) => termFile(id), takeTermBuffer: () => null });
  await store.getState().init();
  render(<PlannerProvider store={store}><ShareButton /></PlannerProvider>);
  return { user, store };
}

async function openDialog() {
  const made = await setup();
  await act(async () => { made.store.getState().addCourse("AE 2320"); await made.store.getState().retrySolve(); });
  await made.user.click(screen.getByRole("button", { name: "Share" }));
  return made;
}

it("stays disabled until there is a schedule", async () => {
  await setup();
  expect(screen.getByRole("button", { name: "Share" })).toBeDisabled();
});

it("opens a popover under the button with one summary line, and the rest folded under What’s included", async () => {
  const copy = vi.spyOn(navigator.clipboard, "writeText");
  await openDialog();
  const button = screen.getByRole("button", { name: "Share" });
  const dialog = screen.getByRole("dialog", { name: "Share this schedule" });
  expect(button).toHaveAttribute("aria-expanded", "true");
  expect(button).toHaveAttribute("aria-controls", dialog.id);
  expect(dialog).toHaveTextContent("1 course · selected sections included");
  expect(screen.getByRole("button", { name: "Copy link" })).toHaveFocus();
  const included = screen.getByText("What’s included").closest("details")!;
  expect(included).not.toHaveAttribute("open");
  expect(included).toHaveTextContent("Blocked-time names, My degree and course history stay private.");
  expect(copy).not.toHaveBeenCalled();
  expect(track).not.toHaveBeenCalled();
});

it("closes on Escape, a click outside or the button, and gives focus back to the button", async () => {
  const { user } = await openDialog();
  const button = screen.getByRole("button", { name: "Share" });
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(button).toHaveFocus();
  expect(button).toHaveAttribute("aria-expanded", "false");

  await user.click(button);
  expect(screen.getByRole("dialog", { name: "Share this schedule" })).toBeInTheDocument();
  await user.click(document.body);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await waitFor(() => expect(button).toHaveFocus());

  await user.click(button);
  await user.click(button);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("offers Share… beside Copy link when the browser has a share sheet", async () => {
  Object.defineProperty(navigator, "share", { value: vi.fn(), configurable: true });
  await openDialog();
  expect(screen.getByRole("button", { name: "Share…" })).toBeInTheDocument();
  Reflect.deleteProperty(navigator, "share");
});

it("copies only the plan URL and records an event with no plan data", async () => {
  const { user } = await openDialog();
  const copy = vi.spyOn(navigator.clipboard, "writeText");
  await user.click(screen.getByRole("button", { name: "Copy link" }));
  const url = new URL(copy.mock.calls[0][0]);
  expect(decodePlan(shareData(url.hash)!)).toMatchObject({ ok: true, plan: { courses: ["AE 2320"], chosen: { "AE 2320": ["AE 2320-CL01", "AE 2320-CX01"] } } });
  expect(screen.getByText("Link copied.")).toBeVisible();
  expect(track).toHaveBeenCalledExactlyOnceWith("share_link_created");
});

it("opens as a bottom sheet on a phone and uses the native share sheet", async () => {
  phone.value = true;
  const share = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "share", { value: share, configurable: true });
  const { user } = await openDialog();
  expect(screen.getByRole("dialog", { name: "Share this schedule" }).tagName).toBe("DIALOG");
  await user.click(screen.getByRole("button", { name: "Share…" }));
  expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: expect.stringContaining("#p=") }));
  expect(track).toHaveBeenCalledExactlyOnceWith("share_link_created");
  Reflect.deleteProperty(navigator, "share");
});

it("only offers Copy link on a phone without a share sheet", async () => {
  phone.value = true;
  const { user } = await openDialog();
  expect(screen.queryByRole("button", { name: "Share…" })).not.toBeInTheDocument();
  const copy = vi.spyOn(navigator.clipboard, "writeText");
  await user.click(screen.getByRole("button", { name: "Copy link" }));
  expect(copy).toHaveBeenCalledWith(expect.stringContaining("#p="));
});

it("copies the link when the phone share sheet fails", async () => {
  phone.value = true;
  const share = vi.fn().mockRejectedValue(new DOMException("blocked", "NotAllowedError"));
  Object.defineProperty(navigator, "share", { value: share, configurable: true });
  const { user } = await openDialog();
  const copy = vi.spyOn(navigator.clipboard, "writeText");
  await user.click(screen.getByRole("button", { name: "Share…" }));
  expect(copy).toHaveBeenCalledWith(expect.stringContaining("#p="));
  Reflect.deleteProperty(navigator, "share");
});

it("does nothing more when the student closes the phone share sheet", async () => {
  phone.value = true;
  const share = vi.fn().mockRejectedValue(Object.assign(new Error("closed"), { name: "AbortError" }));
  Object.defineProperty(navigator, "share", { value: share, configurable: true });
  const { user } = await openDialog();
  const copy = vi.spyOn(navigator.clipboard, "writeText");
  await user.click(screen.getByRole("button", { name: "Share…" }));
  expect(copy).not.toHaveBeenCalled();
  expect(track).not.toHaveBeenCalled();
  Reflect.deleteProperty(navigator, "share");
});

it("leaves the labeled link to copy by hand if clipboard access fails", async () => {
  const { user } = await openDialog();
  vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
  await user.click(screen.getByRole("button", { name: "Copy link" }));
  expect(screen.getByRole("status")).toHaveTextContent("Your browser wouldn’t copy it.");
  expect((screen.getByRole("textbox", { name: "Anyone with the link can view a snapshot" }) as HTMLInputElement).value).toContain("#p=");
});
