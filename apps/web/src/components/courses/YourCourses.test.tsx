import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { YourCourses } from "./YourCourses";
import { resetPlanner, setPlanner } from "@/components/schedule/testing/plannerFixtures";

afterEach(resetPlanner);

function renderList() {
  setPlanner();
  return render(<YourCourses searchRef={createRef<HTMLInputElement>()} />);
}

describe("YourCourses heading", () => {
  it("shows a visible 'Your courses' heading", () => {
    renderList();
    const heading = screen.getByRole("heading", { name: "Your courses" });
    expect(heading.closest("div")).not.toHaveClass("sr-only");
  });
});
