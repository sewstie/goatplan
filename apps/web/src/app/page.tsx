import { AppShell } from "@/components/shell/AppShell";
import { Placeholder } from "@/components/shell/Placeholder";
import { Sidebar } from "@/components/shell/Sidebar";
import { WorkspaceHeader } from "@/components/shell/WorkspaceHeader";

export default function PlannerPage() {
  return (
    <AppShell
      sidebar={
        <Sidebar>
          <Placeholder name="term-picker" className="h-73" />
          <Placeholder name="course-search" className="h-58.5" />
          <Placeholder name="course-list" className="flex-1" />
        </Sidebar>
      }
      header={
        <WorkspaceHeader
          title="Schedule planner"
          actions={<Placeholder name="plan-actions" className="h-36 w-206" />}
        />
      }
      toolbar={<Placeholder name="preferences" className="min-h-35.5" />}
      schedule={<Placeholder name="calendar" className="flex-1" />}
      details={<Placeholder name="course-details" className="flex-1" />}
    />
  );
}
