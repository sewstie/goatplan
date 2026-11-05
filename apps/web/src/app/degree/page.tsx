import type { Metadata } from "next";
import { DegreeContent } from "@/components/degree/DegreeContent";
import { DegreeLayout } from "@/components/degree/DegreeLayout";
import { DegreeOpenedEvent } from "@/components/degree/DegreeOpenedEvent";
import { PhoneTopBar } from "@/components/phone/PhoneTopBar";
import { PhoneTermSelect } from "@/components/phone/PhoneTermSelect";
import { DegreeGate } from "@/components/shell/DegreeGate";
import { PageFooter } from "@/components/shell/PageFooter";
import { PlannerBootstrap } from "@/components/shell/PlannerBootstrap";
import { SkipToMain } from "@/components/shell/SkipToMain";
import { TopBar } from "@/components/shell/TopBar";
import { ThemeButton } from "@/components/shell/ThemeButton";
import { ThemeSwitch } from "@/components/shell/ThemeSwitch";
import { BarMoreMenu } from "@/components/shell/BarMoreMenu";

export const metadata: Metadata = {
  title: "My degree · GoatPlan",
};

export default function DegreePage() {
  return (
    <DegreeGate>
      <DegreeOpenedEvent />
      <PlannerBootstrap />
      <div className="flex min-h-dvh flex-col bg-canvas">
        <SkipToMain />
        <DegreeLayout
          phone={
            <PhoneTopBar>
              <div className="flex items-center gap-8">
                <PhoneTermSelect />
                <BarMoreMenu><ThemeSwitch /></BarMoreMenu>
              </div>
            </PhoneTopBar>
          }
        >
          <TopBar appearance={<ThemeButton />} />
        </DegreeLayout>
        <main id="main" tabIndex={-1} className="mx-auto flex w-full max-w-(--size-app-max) min-w-0 flex-1 flex-col px-(--size-phone-gutter) pt-18 pb-20 outline-none tablet:px-20 tablet:pt-12 tablet:pb-8">
          <DegreeContent />
        </main>
        <PageFooter />
      </div>
    </DegreeGate>
  );
}
