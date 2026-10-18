/** Three gray course cards while the term's sections load (div.app-1.md). */
export function CourseListSkeleton() {
  return (
    <>
      <p className="sr-only">Loading your courses…</p>
      <ul aria-hidden className="flex flex-col gap-5">
        {[0, 1, 2].map((key) => (
          <li key={key} className="mb-12 flex flex-col gap-10 rounded-card bg-surface-subtle px-10 py-23">
            <span className="h-12 w-158 max-w-full rounded-badge bg-skeleton" />
            <span className="h-10 w-129 max-w-full rounded-badge bg-skeleton" />
            <span className="h-10 w-83 rounded-badge bg-skeleton" />
          </li>
        ))}
      </ul>
    </>
  );
}
