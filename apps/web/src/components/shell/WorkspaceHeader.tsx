import type { ReactNode } from "react";
import { HeaderTop } from "./HeaderTop";

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
    <header className="flex min-h-(--size-header) flex-col gap-y-7 px-2 pb-1">
      <HeaderTop>
        <div className="flex min-w-0 flex-col gap-7 wide:flex-1">
          <div className="flex min-h-15 items-center gap-7 text-10 leading-14-5 text-ink-muted empty:hidden">
            {breadcrumbs}
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <h1 className="text-25 leading-30 font-700 tracking-title">{title}</h1>
            {titleAside}
          </div>
        </div>
        {/* ml-auto keeps the actions on the right when they wrap under the title on narrow screens. */}
        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-5 tablet:[&_button]:px-8 tablet:[&_button]:text-9">
          {actions}
        </div>
      </HeaderTop>
      <div className="min-h-15 text-10 leading-14-5 text-ink-muted">{subtitle}</div>
    </header>
  );
}
