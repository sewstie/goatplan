import { Warning } from "@phosphor-icons/react/ssr";
import { ButtonLink } from "./ButtonLink";

/** /plans?plan=… for a plan this browser doesn't have, like a deleted one or a link from another device. */
export function PlanNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-20">
      <div className="flex w-full max-w-(--size-message) flex-col items-center gap-6 rounded-message border border-line bg-surface-overlay px-20 py-28 text-center">
        <span className="flex size-42 items-center justify-center rounded-tile bg-accent-soft text-accent">
          <Warning aria-hidden className="size-23" />
        </span>
        <h2 className="pt-7 text-17 leading-23-8 font-700 tracking-message text-ink">This plan isn’t here</h2>
        <p className="text-11 leading-19-8 text-ink-muted">
          Saved plans stay in the browser they were saved in. It may have been deleted.
        </p>
        <ButtonLink href="/plans" className="mt-8">
          See your saved plans
        </ButtonLink>
      </div>
    </div>
  );
}
