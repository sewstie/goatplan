import { Banner } from "@/components/schedule/Banner";

export function VisitBanner({ storageFailed }: { storageFailed: boolean }) {
  if (!storageFailed) return null;
  return <Banner message={{ tone: "info", title: "", detail: "Guide progress can’t be remembered in this browser. You may see the guide again next visit." }} />;
}
