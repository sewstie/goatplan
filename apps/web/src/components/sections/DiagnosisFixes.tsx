"use client";

import { CircleNotch, Clock, Eraser, LockSimpleOpen, User, Users, X } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import type { DiagnosisFix } from "@/lib/diagnosis/diagnosisText";
import { usePlanner } from "@/lib/store";
import { FixRow } from "./FixRow";

const icons = {
  relaxStartsAfter: <Clock />,
  clearBlocked: <Eraser />,
  allowFull: <Users />,
  clearAnyOf: <Users />,
  switchProfessor: <User />,
  unlock: <LockSimpleOpen />,
  dropCourse: <X />,
};

function FixGroup({ id, heading, note, children }: { id: string; heading: string; note?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h3 id={id} className="text-10 leading-14-5 font-650 text-ink">{heading}</h3>
        {note && <p className="text-8 leading-11-6 text-ink-muted">{note}</p>}
      </div>
      <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        {children}
      </ul>
    </section>
  );
}

export function DiagnosisFixes({ fixes }: { fixes: readonly DiagnosisFix[] }) {
  const applyFix = usePlanner((state) => state.applyFix);
  const ready = usePlanner((state) => state.solveStatus === "done" && state.termStatus === "ready");
  const checking = usePlanner((state) => state.checkingProfessors);
  const professorByCourse = usePlanner((state) => state.professorByCourse);
  const switches = fixes.filter(({ fix }) => fix.kind === "switchProfessor");
  const others = fixes.filter(({ fix }) => fix.kind !== "switchProfessor");
  const showSwitches = switches.length > 0 || checking;
  const first = showSwitches ? switches[0] : others[0];
  if (!showSwitches && others.length === 0) return null;
  const switchedCourses = [...new Set(switches.map(({ fix }) => "course" in fix ? fix.course : ""))];
  const current = switchedCourses.length === 1 ? professorByCourse[switchedCourses[0]] : null;

  const row = (item: DiagnosisFix) => {
    const { fix, label, count } = item;
    const professor = fix.kind === "switchProfessor";
    return (
      <li key={`${fix.kind}:${"course" in fix ? fix.course : ""}${"startsAfter" in fix ? `:${fix.startsAfter}` : ""}${professor ? `:${fix.professor}` : ""}`}>
        <FixRow
          icon={fix.kind === "relaxStartsAfter" && fix.startsAfter === 0 ? <X /> : icons[fix.kind]}
          title={professor ? fix.professor : label}
          detail={professor ? `${fix.course} · ${count}` : count}
          label={professor ? `${label}, ${count}` : undefined}
          recommended={item === first}
          disabled={!ready}
          onClick={() => {
            document.getElementById("main")?.focus();
            applyFix(fix);
          }}
        />
      </li>
    );
  };

  return (
    <div className="mt-16 flex flex-col gap-16">
      {showSwitches && (
        <FixGroup id="diagnosis-professors" heading="Try another professor" note={current ? `Instead of ${current} for ${switchedCourses[0]}` : undefined}>
          {switches.map(row)}
          {checking && (
            <li role="status" className="flex items-center gap-10 px-11 py-10 text-9 leading-13 text-ink-muted">
              <span aria-hidden className="flex size-28 shrink-0 items-center justify-center">
                <CircleNotch className="size-15 motion-safe:animate-spin" />
              </span>
              Checking other professors…
            </li>
          )}
        </FixGroup>
      )}
      {others.length > 0 && (
        <FixGroup id="diagnosis-fixes" heading={showSwitches ? "Other ways to fix it" : "Ways to fix it"}>
          {others.map(row)}
        </FixGroup>
      )}
    </div>
  );
}
