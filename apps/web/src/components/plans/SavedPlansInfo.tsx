import { Info } from "@phosphor-icons/react/ssr";

const STEPS = ["Open a plan to change it in the planner.", "See its sections to register.", "Copy them into Workday."];

/** Next to the plan list: where plans are kept and what to do with them, like the planner's info panel. */
export function SavedPlansInfo() {
  return (
    <div className="flex flex-col">
      <Info aria-hidden className="size-23 text-ink" />
      <h2 className="pt-15 text-19 leading-24-7 font-700 tracking-heading text-ink">Saved in this browser</h2>
      <p className="pt-10 pb-24 text-11 leading-20-35 text-ink-muted">
        Plans stay on this device. Clearing your browser data removes them.
      </p>
      <ol>
        {STEPS.map((step, index) => (
          <li key={step} className="flex gap-11 border-t border-line py-13">
            <span aria-hidden className="w-21 shrink-0 text-10 leading-17 font-650 text-accent">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-10 leading-17 text-ink-secondary">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
