import { CalendarBlank, CheckCircle } from "@phosphor-icons/react/ssr";
import { AREA_NAMES, type AreaId } from "@/lib/courseMap/csLayout";

const AREAS: AreaId[] = ["systems", "theory", "design", "social", "cyber"];

export function MapLegend() {
  return (
    <div aria-label="Map key" role="group" className="flow-legend">
      <ul aria-label="Areas">
        {AREAS.map((area) => <li key={area}><span className={`flow-swatch flow-area-${area}`} aria-hidden />{AREA_NAMES[area]}</li>)}
      </ul>
      <ul aria-label="Your record">
        <li><CheckCircle size={13} weight="fill" aria-hidden className="text-success" />Taken</li>
        <li><CalendarBlank size={13} aria-hidden className="text-accent" />Planned</li>
      </ul>
      <ul aria-label="Lines">
        <li><svg width="26" height="8" aria-hidden><path d="M1,4 H20" className="flow-line" /><path d="M19,0 L25,4 L19,8 z" className="flow-arrow" /></svg>Leads to</li>
        <li><svg width="26" height="8" aria-hidden><path d="M1,4 H20" className="flow-line flow-line-optional" /><path d="M19,0 L25,4 L19,8 z" className="flow-arrow" /></svg>Any one</li>
        <li><span className="flow-or flow-or-key" aria-hidden>or</span>Either</li>
      </ul>
    </div>
  );
}
