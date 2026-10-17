import { cx } from "@/components/ui/cx";

type PlaceholderProps = {
  name: string;
  className?: string;
};

export function Placeholder({ name, className }: PlaceholderProps) {
  return <div aria-hidden data-placeholder={name} className={cx("shrink-0", className)} />;
}
