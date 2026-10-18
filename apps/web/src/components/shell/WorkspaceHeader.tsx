import type { ReactNode } from "react";

type WorkspaceHeaderProps = {
  title: ReactNode;
  breadcrumbs?: ReactNode;
  titleAside?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
};

export function WorkspaceHeader({
  title,
  breadcrumbs,
  titleAside,
  subtitle,
  actions,
}: WorkspaceHeaderProps) {
  return (
    <header className="flex min-h-(--size-header) flex-wrap items-center justify-between gap-x-16 gap-y-8 px-4 pt-8 pb-1">
      <div className="flex min-w-0 flex-col gap-7">
        <div className="flex min-h-15 items-center gap-7 text-10 leading-14-5 text-ink-muted">
          {breadcrumbs}
        </div>
        <div className="flex flex-wrap items-center gap-16">
          <h1 className="text-25 leading-30 font-700 tracking-title">{title}</h1>
          {titleAside}
        </div>
        <div className="min-h-15 text-10 leading-14-5 text-ink-muted">{subtitle}</div>
      </div>
      {/* ml-auto keeps the actions on the right when they wrap under the title on narrow screens. */}
      <div className="ml-auto flex max-w-(--size-actions) flex-wrap items-center justify-end gap-10">
        {actions}
      </div>
    </header>
  );
}
