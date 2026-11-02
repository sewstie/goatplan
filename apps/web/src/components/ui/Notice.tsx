import type { ReactNode } from "react";
import { Info, ShieldCheck, WarningCircle } from "@phosphor-icons/react/ssr";
import { cx } from "./cx";

type NoticeProps = {
  tone?: "info" | "warning" | "private";
  title?: ReactNode;
  children?: ReactNode;
  /** The roomier version with bigger type, on full-width banners. */
  large?: boolean;
  className?: string;
};

const TONES = {
  info: { box: "bg-notice-info text-info-ink", title: "text-info-ink", Icon: Info },
  warning: { box: "bg-notice-warning text-notice-warning-ink", title: "text-notice-warning-ink", Icon: WarningCircle },
  private: { box: "bg-notice-neutral text-ink-muted", title: "text-ink", Icon: ShieldCheck },
};

/** The tinted box for something worth reading: a hint, a warning, or what stays private. */
export function Notice({ tone = "info", title, children, large = false, className }: NoticeProps) {
  const { box, title: titleTone, Icon } = TONES[tone];
  return (
    <div className={cx("flex items-start rounded-card", box, large ? "gap-12 px-16 py-14 text-10 leading-16-5" : "gap-11 px-15 py-12 text-8-5 leading-16", className)}>
      <Icon aria-hidden className={cx("shrink-0 text-ink", large ? "mt-1 size-17" : "mt-1 size-16")} />
      <div className="min-w-0">
        {title && <p className={cx("font-650", titleTone, large ? "pb-3 text-10 leading-16-5" : "pb-3")}>{title}</p>}
        {children}
      </div>
    </div>
  );
}
