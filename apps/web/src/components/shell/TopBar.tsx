import { Brand } from "./Brand";
import { MainTabs } from "./MainTabs";
import { TopBarTerm } from "./TopBarTerm";

/** The bar above every page from the tablet breakpoint up: the brand, Planner and My degree, and the open term. */
export function TopBar() {
  return (
    <header className="sticky top-0 z-10 flex h-(--size-topbar) shrink-0 items-center gap-37 border-b border-line bg-surface px-32 print:hidden">
      <Brand variant="bar" />
      <MainTabs />
      <div className="ml-auto">
        <TopBarTerm />
      </div>
    </header>
  );
}
