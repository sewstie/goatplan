import { ArrowSquareOut, GraduationCap } from "@phosphor-icons/react/ssr";
import { OSCAR_URL, rateMyProfessorsUrl } from "@/lib/data";
import { cx } from "@/components/ui/cx";

/** A professor's name with links to look them up in OSCAR and on Rate My Professors. The phone variant sets the name in bold. */
export function InstructorRating({ name, dense = false, showLink = true, phone = false }: { name: string; dense?: boolean; showLink?: boolean; phone?: boolean }) {
  const linkClass = cx(
    "inline-flex shrink-0 items-center rounded-badge bg-accent-soft font-570 whitespace-nowrap text-accent transition-colors hover:bg-accent-line",
    phone ? "min-h-44 gap-6 px-12 text-10" : "min-h-21 gap-4 px-6 py-4 text-9 leading-10-8",
  );
  const icon = <ArrowSquareOut aria-hidden className={phone ? "size-12" : "size-9"} />;

  return (
    <div role="group" aria-label={showLink ? name : undefined} className={cx("flex flex-col border-t border-line", phone ? (dense ? "gap-8 pt-10" : "gap-10 pt-14") : dense ? "gap-5 pt-7" : "gap-6 pt-9")}>
      <span className={cx("flex min-w-0 items-start gap-8 text-10 leading-14-5 text-ink", phone && "font-650")}>
        <GraduationCap aria-hidden className={cx("shrink-0", phone ? "mt-1.5 size-16" : "mt-1 size-12")} />
        {name}
      </span>
      {showLink && (
        <div className={cx("flex flex-wrap", phone ? "gap-8" : "gap-5")}>
          <a href={OSCAR_URL} target="_blank" rel="noreferrer" aria-label={`View ${name} in OSCAR (opens in a new tab)`} className={linkClass}>
            View in OSCAR
            {icon}
          </a>
          <a href={rateMyProfessorsUrl(name)} target="_blank" rel="noreferrer" aria-label={`View ${name} on Rate My Professors (opens in a new tab)`} className={linkClass}>
            Rate My Professors
            {icon}
          </a>
        </div>
      )}
    </div>
  );
}
