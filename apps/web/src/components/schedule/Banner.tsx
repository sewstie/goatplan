import { CheckCircle, CircleNotch, Info, Warning } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import type { BannerMessage } from "./scheduleCopy";

const toneClasses = {
  success: "bg-success-surface text-success-ink",
  info: "bg-accent-soft text-info-ink",
  loading: "bg-accent-soft text-info-ink",
  warning: "bg-warning-surface text-warning-ink",
};

const icons = {
  success: <CheckCircle />,
  info: <Info />,
  loading: <CircleNotch className="motion-safe:animate-spin" />,
  warning: <Warning className="text-ink" />,
};

export function Banner({ message }: { message: BannerMessage }) {
  return (
    <div
      role="status"
      className={cx("flex items-center gap-9 rounded-card px-12 py-10 text-10 leading-15-5", toneClasses[message.tone])}
    >
      <span aria-hidden className="flex shrink-0 [&_svg]:size-15">
        {icons[message.tone]}
      </span>
      <p>
        {message.title && <><b className="font-700">{message.title}</b>{" "}</>}{message.detail}
      </p>
    </div>
  );
}
