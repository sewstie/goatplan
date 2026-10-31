import { ReplayGuideButton } from "@/components/tutorial/ReplayGuideButton";

export function SupportLinks() {
  return (
    <nav aria-label="Help" className="flex flex-wrap gap-x-10 text-9 leading-16-65 text-ink-muted">
      <a
        href="https://courselistings.wpi.edu"
        target="_blank"
        rel="noreferrer"
        className="rounded-badge hover:text-ink hover:underline"
      >
        Data source<span className="sr-only"> (opens in a new tab)</span>
      </a>
      <ReplayGuideButton className="cursor-pointer rounded-badge whitespace-nowrap hover:text-ink hover:underline" />
    </nav>
  );
}
