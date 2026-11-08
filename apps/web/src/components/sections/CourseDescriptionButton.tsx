import type { Ref } from "react";
import { BookOpenText } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";

export function CourseDescriptionButton({ buttonRef, onClick }: { buttonRef: Ref<HTMLButtonElement>; onClick(): void }) {
  return (
    <div className="pt-7">
      <Button ref={buttonRef} variant="secondary" size="sm" icon={<BookOpenText aria-hidden />} onClick={onClick}>
        Course description
      </Button>
    </div>
  );
}
