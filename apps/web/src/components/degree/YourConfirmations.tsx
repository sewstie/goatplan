"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckField } from "@/components/ui/CheckField";
import { Notice } from "@/components/ui/Notice";
import { DEPTH_CONFIRMATION, getDegreeSource, WPE_SLOTS, type DegreeHistory } from "@/lib/degree";
import { useDegreeUi } from "./degreeUi";

const IQP = ["iqp-1", "iqp-2", "iqp-3"];
const MQP = ["mqp-1", "mqp-2", "mqp-3"];

export function YourConfirmations({ history }: { history: DegreeHistory }) {
  const set = useDegreeUi((state) => state.set);
  const [iqp, setIqp] = useState(IQP.every((id) => history.manual.includes(id)));
  const [mqp, setMqp] = useState(MQP.every((id) => history.manual.includes(id)));
  const [wpe, setWpe] = useState(WPE_SLOTS.map((id) => history.manual.includes(id)));
  const [related, setRelated] = useState(history.manual.includes(DEPTH_CONFIRMATION));
  const confirmed = wpe.filter(Boolean).length;

  function save() {
    const source = getDegreeSource();
    for (const id of IQP) source.setManualItem(id, iqp);
    for (const id of MQP) source.setManualItem(id, mqp);
    WPE_SLOTS.forEach((id, index) => source.setManualItem(id, wpe[index]));
    source.setManualItem(DEPTH_CONFIRMATION, related);
    set({ screen: "main" });
  }

  return (
    <div className="flex flex-col gap-16">
      <header>
        <h1 className="text-25 leading-30 font-700 tracking-title">Your confirmations</h1>
        <p className="pt-10 text-10 leading-16-5 text-ink-muted">Confirm what the tracker can’t infer.</p>
      </header>
      <Button className="min-h-44 self-start" onClick={save}>Save confirmations</Button>
      <section className="rounded-panel border border-card-line bg-surface p-18">
        <h2 className="text-14 leading-22 font-650">Projects &amp; related requirements</h2>
        <p className="pt-10 text-10 leading-17-5 text-ink-muted">Only confirm work you’ve completed. Your selections are stored on this device.</p>
        <div className="flex flex-col gap-20 border-b border-line py-20">
          <CheckField label="IQP completed" description="Leave unchecked while your project is in progress." labelClassName="text-10 leading-16-5 font-600" checked={iqp} onChange={(event) => setIqp(event.target.checked)} />
          <CheckField label="MQP completed" description="Confirm the capstone requirement for your selected major." labelClassName="text-10 leading-16-5 font-600" checked={mqp} onChange={(event) => setMqp(event.target.checked)} />
        </div>
        <div className="border-b border-line py-20">
          <h3 className="pb-14 text-10 leading-16-5 font-650">Wellness &amp; physical education</h3>
          <div className="grid grid-cols-2 gap-16">
            {WPE_SLOTS.map((id, index) => (
              <CheckField key={id} label={`WPE course ${index + 1}`} labelClassName="text-10 leading-16-5 font-600" checked={wpe[index]} onChange={(event) => setWpe(wpe.map((value, slot) => (slot === index ? event.target.checked : value)))} />
            ))}
          </div>
        </div>
        <div className="pt-20">
          <CheckField label="My humanities depth courses are thematically related" description="Confirm the grouping with your advisor when needed." labelClassName="text-10 leading-16-5 font-600" checked={related} onChange={(event) => setRelated(event.target.checked)} />
        </div>
      </section>
      <Notice title={`${confirmed} of ${WPE_SLOTS.length} WPE courses confirmed`}>Remaining courses stay missing. {iqp || mqp ? "Your project checkboxes are saved with these." : "Your project checkboxes are still unchecked."}</Notice>
    </div>
  );
}
