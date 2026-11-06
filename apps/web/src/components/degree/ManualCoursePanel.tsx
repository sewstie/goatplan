"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckField } from "@/components/ui/CheckField";
import { DrawerFrame } from "@/components/ui/Drawer";
import { Notice } from "@/components/ui/Notice";
import { Select } from "@/components/ui/Select";
import { TextInput } from "@/components/ui/TextInput";
import { cleanCourseCode, getDegreeSource, parseUnits, typedCourse, type CreditSource } from "@/lib/degree";
import { useDegreeUi } from "./degreeUi";
import { termChoices } from "./termChoices";

const SOURCES: { value: CreditSource; label: string }[] = [
  { value: "transfer", label: "Transfer" },
  { value: "wpi", label: "WPI" },
  { value: "other", label: "Other" },
];

export function ManualCoursePanel({ initialCode = "" }: { initialCode?: string }) {
  const close = useDegreeUi((state) => state.close);
  const open = useDegreeUi((state) => state.open);
  const [code, setCode] = useState(initialCode);
  const [units, setUnits] = useState("1/3");
  const [title, setTitle] = useState("");
  const [term, setTerm] = useState("");
  const [source, setSource] = useState<CreditSource>("transfer");
  const [status, setStatus] = useState<"taken" | "planned">("taken");
  const [apIb, setApIb] = useState(false);
  const [problem, setProblem] = useState<{ field: "code" | "units" | "form"; text: string } | null>(null);

  function add() {
    const clean = cleanCourseCode(code);
    if (!clean) {
      setProblem({ field: "code", text: "That doesn’t look like a course code. Try one like CS 2102." });
      return;
    }
    const credits = parseUnits(units);
    if (credits === null) {
      setProblem({ field: "units", text: "Enter WPI units, like 1/3 or 1/6." });
      return;
    }
    const result = getDegreeSource().addCourse({ ...typedCourse(clean), title: title.trim(), credits, status, apIb, creditSource: source, ...(term ? { term } : {}) });
    if (result === "duplicate") {
      setProblem({ field: "code", text: `${clean} is already in your history.` });
      return;
    }
    if (result === "invalid") {
      setProblem({ field: "form", text: "That course couldn’t be added. Check the code and units." });
      return;
    }
    open({ kind: "history", tab: "history" });
  }

  return (
    <DrawerFrame
      title="Add a manual course"
      onClose={close}
      footer={
        <>
          <Button variant="secondary" size="md" className="min-h-40" onClick={() => open({ kind: "history", tab: "search" })}>Cancel</Button>
          <Button size="md" className="min-h-40" onClick={add}>Add to history</Button>
        </>
      }
    >
      <p className="-mt-6 pb-16 text-8-5 leading-17 text-ink-muted">Add the credit WPI awarded, even if the course is not in today’s catalog.</p>
      <div className="grid grid-cols-2 gap-16">
        <TextInput label="Course code" hideLabel={false} autoComplete="off" spellCheck={false} value={code} aria-invalid={problem?.field === "code" ? true : undefined} hint={problem?.field === "code" && <span role="alert">{problem.text}</span>} onChange={(event) => { setCode(event.target.value); setProblem(null); }} />
        <TextInput label="Units" hideLabel={false} autoComplete="off" value={units} aria-invalid={problem?.field === "units" ? true : undefined} hint={problem?.field === "units" ? <span role="alert">{problem.text}</span> : "Enter WPI units, not semester credits."} onChange={(event) => { setUnits(event.target.value); setProblem(null); }} />
      </div>
      <TextInput label="Course title (optional)" hideLabel={false} autoComplete="off" value={title} onChange={(event) => setTitle(event.target.value)} className="pt-14" />
      <div className="grid grid-cols-2 gap-16 pt-16">
        <Select label="Term" hideLabel={false} variant="box" options={termChoices()} value={term} onChange={(event) => setTerm(event.target.value)} />
        <Select label="Credit source" hideLabel={false} variant="box" options={SOURCES} value={source} onChange={(event) => setSource(event.target.value as CreditSource)} />
      </div>
      <div className="flex flex-col gap-18 pt-22 pb-14">
        <Select label="Status" hideLabel={false} variant="box" options={[{ value: "taken", label: "Taken" }, { value: "planned", label: "Planned" }]} value={status} onChange={(event) => setStatus(event.target.value as "taken" | "planned")} />
        <CheckField label="AP / IB credit" description="Use this only for an AP or IB award." checked={apIb} onChange={(event) => setApIb(event.target.checked)} />
      </div>
      <Notice title="Needs your review">A manual code may not match a specific requirement. We’ll keep it in history and flag uncertain allocations.</Notice>
      {problem?.field === "form" && <p role="alert" className="pt-10 text-8-5 leading-16 text-notice-warning-ink">{problem.text}</p>}
    </DrawerFrame>
  );
}
