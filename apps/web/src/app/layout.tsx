import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { TesterLink } from "@/components/shell/TesterLink";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoatPlan",
  icons: { icon: "/brand/favicon.ico" },
  description:
    "Course planner for WPI students: pick courses, compare sections and professors, build a conflict-free term schedule.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dmSans.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.dataset.theme=localStorage.getItem("goatplan:theme:v1")==="dark"?"dark":"light"}catch{document.documentElement.dataset.theme="light"}` }} />
      </head>
      <body><TesterLink />{children}</body>
    </html>
  );
}
