import type { ReactNode } from "react";

type CalendarMessageProps = {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
};

/** The card over the empty grid: first visit and "Couldn’t load" (div.app.md, div.app-2.md). */
export function CalendarMessage({ icon, title, children, actions }: CalendarMessageProps) {
  return (
    <div className="pointer-events-none absolute inset-x-12 top-[24%] flex justify-center">
      <div className="pointer-events-auto flex w-full max-w-(--size-message) flex-col items-center gap-6 rounded-message border border-line bg-surface-overlay px-20 py-28 text-center">
        <span aria-hidden className="flex size-42 items-center justify-center rounded-tile bg-accent-soft [&_svg]:size-23">
          {icon}
        </span>
        <h3 className="mt-1 text-17 leading-23-8 font-700 tracking-message">{title}</h3>
        <div className="text-11 leading-19-8 text-ink-muted">{children}</div>
        {actions && <div className="mt-3 flex flex-wrap justify-center gap-8">{actions}</div>}
      </div>
    </div>
  );
}
