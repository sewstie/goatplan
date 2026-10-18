import { Info } from "@phosphor-icons/react/ssr";

const STEPS = ["Choose your term.", "Search for a course or professor.", "Compare schedules and save a plan."];

/** The panel before any course is picked (div.app.md, "info" variant). */
export function PanelIntro() {
  return (
    <div className="flex flex-col">
      <Info aria-hidden className="size-23 text-ink" />
      <h2 className="mt-15 text-19 leading-24-7 font-700 tracking-heading text-ink">Your term starts here</h2>
      <p className="mt-10 mb-24 text-11 leading-20-35 text-ink-muted">
        Pick courses first. GoatPlan finds the sections that fit.
      </p>
      <ol>
        {STEPS.map((step, index) => (
          <li key={step} className="flex gap-11 border-t border-line py-13 text-10 leading-17">
            <span aria-hidden className="w-21 shrink-0 font-650 text-accent">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-ink-secondary">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
