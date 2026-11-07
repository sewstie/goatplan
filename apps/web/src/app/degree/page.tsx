import type { Metadata } from "next";
import { DegreeContent } from "@/components/degree/DegreeContent";
import { DegreeLayout } from "@/components/degree/DegreeLayout";
import { DegreeOpenedEvent } from "@/components/degree/DegreeOpenedEvent";
import { PhoneTopBar } from "@/components/phone/PhoneTopBar";
import { DegreeGate } from "@/components/shell/DegreeGate";
import { DegreeFooter } from "@/components/degree/DegreeFooter";
import "./degree.css";
import { SkipToMain } from "@/components/shell/SkipToMain";
import { TopBar } from "@/components/shell/TopBar";
import { ThemeButton } from "@/components/shell/ThemeButton";

export const metadata: Metadata = {
  title: "My degree · GoatPlan",
};

export default function DegreePage() {
  return (
    <DegreeGate>
      <DegreeOpenedEvent />
      <div className="degree-page flex min-h-dvh flex-col bg-canvas">
        <SkipToMain />
        <DegreeLayout
          phone={
            <PhoneTopBar>
              <ThemeButton />
            </PhoneTopBar>
          }
        >
          <TopBar appearance={<ThemeButton />} />
        </DegreeLayout>
        <main id="main" tabIndex={-1} className="mx-auto flex w-full max-w-(--size-app-max) min-w-0 flex-1 flex-col px-(--size-phone-gutter) pt-18 pb-20 outline-none tablet:px-20 tablet:pt-12 tablet:pb-8">
          <DegreeContent />
        </main>
        <DegreeFooter />
      </div>
    </DegreeGate>
  );
}
