import type { Ref } from "react";
import { cx } from "@/components/ui/cx";

type SectionListPreviewProps = {
  text: string;
  ref?: Ref<HTMLPreElement>;
  className?: string;
};

/** "Section list": the text that Copy section list puts on the clipboard. */
export function SectionListPreview({ text, ref, className }: SectionListPreviewProps) {
  return (
    <div className={cx("flex flex-col gap-10", className)}>
      <h3 className="text-10 leading-14-5 font-650 text-ink">Section list</h3>
      <pre
        ref={ref}
        className="rounded-control border border-line bg-code-surface px-16 py-14 font-sans text-11 leading-22 whitespace-pre-wrap text-ink"
      >
        {text}
      </pre>
    </div>
  );
}
