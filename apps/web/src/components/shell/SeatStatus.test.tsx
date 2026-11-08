import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlannerProvider } from "@/lib/store";
import { createPlannerStore } from "@/lib/store/createPlannerStore";
import { designPlan } from "@/lib/plans/testing";
import { SeatStatus } from "./SeatStatus";

function setup(state: { seatsUpdatedAt: string | null; seatRefresh?: "idle" | "refreshing" | "failed" }) {
  const store = createPlannerStore({
    engine: { loadTerm: vi.fn(), solve: vi.fn() },
    loadTermIndex: vi.fn(),
    loadTerm: vi.fn(),
    takeTermBuffer: () => null,
    storage: null,
  });
  const refreshSeats = vi.fn(async () => store.setState({ seatRefresh: "idle", seatsUpdatedAt: "2026-11-12T11:59:00Z" }));
  store.setState({ seatRefresh: "idle", termId: "2027-C", ...state, refreshSeats });
  render(<PlannerProvider store={store}><SeatStatus /></PlannerProvider>);
  return { store, refreshSeats };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-12T12:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("SeatStatus", () => {
  it("says how old the seats are and to confirm in Workday", () => {
    setup({ seatsUpdatedAt: "2026-11-12T11:55:00Z" });
    expect(screen.getByRole("status", { name: "Seat freshness" })).toHaveTextContent("Seats updated 5 min ago");
    expect(screen.getByText("Confirm in Workday before you register.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Retry/ })).not.toBeInTheDocument();
  });

  it("offers Retry with the daily file's date when live seats failed, and focuses the new age after it works", async () => {
    const { refreshSeats } = setup({ seatsUpdatedAt: "2026-11-08T15:53:22", seatRefresh: "failed" });
    expect(screen.getByRole("status", { name: "Seat freshness" })).toHaveTextContent(/^Seats from Nov 8/);
    const retry = screen.getByRole("button", { name: "Retry getting the latest seats" });
    expect(retry).toHaveTextContent("Retry");
    await userEvent.setup().click(retry);
    expect(refreshSeats).toHaveBeenCalledOnce();
    await act(() => new Promise(requestAnimationFrame));
    const status = screen.getByRole("status", { name: "Seat freshness" });
    expect(status).toHaveTextContent("Seats updated 1 min ago");
    expect(status).toHaveFocus();
  });

  it("says nothing before the term loads or in a saved plan", () => {
    const { store } = setup({ seatsUpdatedAt: null });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    const plan = designPlan({ termId: "2027-C" });
    act(() => store.setState({ seatsUpdatedAt: "2026-11-12T11:55:00Z", savedPlans: [plan], savedPlanId: plan.id }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
