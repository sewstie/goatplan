export function CourseChips({ codes, pick }: { codes: string[]; pick(code: string): void }) {
  return (
    <div className="flex flex-wrap gap-6">
      {codes.map((code) => <button key={code} type="button" onClick={() => pick(code)} className="flow-chip text-10">{code}</button>)}
    </div>
  );
}
