import { uniqueInstructors } from "@/lib/data";
import { InstructorRating } from "./InstructorRating";
import { RegularSectionCard, type RegularSectionCardProps } from "./RegularSectionCard";

export function LectureCard(props: RegularSectionCardProps) {
  const instructors = uniqueInstructors([props.section]);

  return (
    <RegularSectionCard {...props} showInstructor={instructors.length === 0}>
      {instructors.map((name) => <InstructorRating key={name} name={name} dense={props.dense} />)}
    </RegularSectionCard>
  );
}
