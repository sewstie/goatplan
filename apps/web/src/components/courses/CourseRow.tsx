import { LockSimple, X } from "@phosphor-icons/react/ssr";
import { IconButton } from "@/components/ui/IconButton";
import { cx } from "@/components/ui/cx";

type CourseRowProps = {
  code: string;
  title: string;
  sections: string;
  swatch: string;
  locked: boolean;
  selected: boolean;
  onSelect(): void;
  onRemove(): void;
};

/** A planned course in "Your courses" (div.app-3.md). The remove button shows on hover and keyboard focus. */
export function CourseRow({ code, title, sections, swatch, locked, selected, onSelect, onRemove }: CourseRowProps) {
  return (
    <li className="group relative">
      <button
        type="button"
        aria-current={selected || undefined}
        onClick={onSelect}
        data-course-row={code}
        className={cx(
          "flex w-full cursor-pointer gap-9 rounded-card border border-transparent px-10 py-12 text-left",
          selected ? "bg-surface-selected" : "hover:bg-surface-subtle",
        )}
      >
        <span aria-hidden className={cx("mt-5 size-8 shrink-0 rounded-swatch", swatch)} />
        <span className="flex min-w-0 flex-col gap-3">
          <span className="flex items-center gap-4 text-11 leading-15-95 font-700">
            {code}
            {locked && (
              <>
                <LockSimple aria-hidden className="size-11 shrink-0" />
                <span className="sr-only">, has a locked section</span>
              </>
            )}
          </span>
          <span className="text-10 leading-16">{title}</span>
          {sections && <span className="text-9 leading-14-4 text-ink-muted">{sections}</span>}
        </span>
      </button>
      <span className="absolute top-15 right-10 flex opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100">
        <IconButton
          variant="ghost"
          label={`Remove ${code}`}
          icon={<X aria-hidden />}
          onClick={onRemove}
          className="text-ink-muted"
        />
      </span>
    </li>
  );
}
