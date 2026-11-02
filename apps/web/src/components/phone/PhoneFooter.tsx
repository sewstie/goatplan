import { PageFooter } from "@/components/shell/PageFooter";

/** The bottom of a phone page: when the course data was updated, where it comes from, and the guide again. */
export function PhoneFooter({ termId }: { termId?: string }) {
  return (
    <div className="mt-auto pt-20">
      <PageFooter termId={termId} />
    </div>
  );
}
