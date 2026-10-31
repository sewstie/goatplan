import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resetPlanner, setPlanner, term } from "@/components/schedule/testing/plannerFixtures";
import { getPlannerStore } from "@/lib/store";
import { CourseSearchPanel } from "./CourseSearchPanel";

vi.mock("@/lib/data", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/data")>()),
  loadTerm: vi.fn(async () => term),
}));

afterEach(resetPlanner);

const summary = (id: string, name: string) => ({ ...term.term, id, name, status: "upcoming" as const, courses: 3, sections: 6, generatedAt: term.generatedAt });

const searchBox = () => screen.getByRole("searchbox", { name: "Search courses" });

/** D Term without AE 2320, and a Switch to C Term button whose term stays loading until the test finishes it. */
async function switchToCTerm() {
  const empty = { ...term, courses: [] };
  setPlanner({ terms: [summary("2027-C", "C Term"), summary("2027-D", "D Term")], termId: "2027-D", term: empty, courses: [], response: null });
  getPlannerStore().setState({
    setTerm: async (termId) => getPlannerStore().setState({ termId, term: null, termStatus: "loading" }),
  });
  render(
    <>
      <CourseSearchPanel />
      <button>Elsewhere</button>
    </>,
  );
  const user = userEvent.setup();
  await user.type(searchBox(), "AE 2320");
  await user.click(await screen.findByRole("button", { name: "Switch to C Term" }));
  expect(searchBox()).toBeDisabled();
  return user;
}

const finishLoading = () => act(() => getPlannerStore().setState({ term, termStatus: "ready" }));

describe("switching to the term that has the course", () => {
  it("moves focus to the search box once the term has loaded, keeping the search", async () => {
    await switchToCTerm();
    expect(searchBox()).not.toHaveFocus();
    finishLoading();
    expect(searchBox()).toHaveFocus();
    expect(searchBox()).toHaveValue("AE 2320");
  });

  it("leaves focus alone if it moved on while the term loaded", async () => {
    const user = await switchToCTerm();
    await user.click(screen.getByRole("button", { name: "Elsewhere" }));
    finishLoading();
    expect(screen.getByRole("button", { name: "Elsewhere" })).toHaveFocus();
  });
});
