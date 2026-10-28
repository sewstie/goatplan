"use client";

import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react/ssr";
import { PhoneFooter } from "@/components/phone/PhoneFooter";
import { PhoneTopBar } from "@/components/phone/PhoneTopBar";
import { countLabel, sectionCount, termLabel } from "@/lib/plans";
import { RegistrationSheet } from "./RegistrationSheet";
import { useSelectedPlan } from "./useSelectedPlan";

/** /plans below the tablet breakpoint: the planner's top bar, a way back, then the plans or one plan's sections. */
export function PhonePlans() {
  const { planId, plan, snapshot } = useSelectedPlan();
  const back = planId ? { href: "/plans", label: "All saved plans" } : { href: "/", label: "Back to planner" };
  let subtitle = "";
  if (plan) subtitle = `${termLabel(plan.term)} · ${countLabel(plan.schedule.length, "course")} · ${countLabel(sectionCount(plan), "section")}`;
  else if (!planId && snapshot && snapshot.plans.length > 0) subtitle = countLabel(snapshot.plans.length, "plan");

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-8 focus:left-8 focus:z-20 focus:rounded-control focus:bg-surface focus:px-11 focus:py-9 focus:text-11 focus:font-570 focus:text-accent focus:shadow-popover"
      >
        Skip to main content
      </a>
      <PhoneTopBar />
      <main id="main" tabIndex={-1} className="flex min-w-0 flex-1 flex-col gap-12 px-(--size-phone-gutter) pt-14 pb-20 outline-none">
        <Link href={back.href} className="-ml-4 inline-flex min-h-44 items-center gap-6 self-start rounded-badge px-4 text-9 text-ink-muted hover:text-ink">
          <CaretLeft aria-hidden className="size-12" />
          {back.label}
        </Link>
        <header className="flex flex-col gap-4">
          <h1 className="text-21 leading-30 font-700 tracking-title break-words">{plan ? plan.name : planId ? "Saved plan" : "Saved plans"}</h1>
          {subtitle && <p className="text-9 text-ink-muted">{subtitle}</p>}
        </header>
        <RegistrationSheet />
        <PhoneFooter termId={plan?.termId} />
      </main>
    </div>
  );
}
