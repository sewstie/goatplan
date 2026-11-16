import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const description =
  "Course planner for WPI students: pick courses, compare sections and professors, build a conflict-free term schedule.";

export const metadata: Metadata = {
  metadataBase: new URL("https://goatplan.vercel.app"),
  title: "GoatPlan · WPI course planner and schedule builder",
  description,
  icons: { icon: "/brand/favicon.ico" },
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    siteName: "GoatPlan",
    title: "GoatPlan · WPI course planner and schedule builder",
    description,
    images: "/brand/logo.png",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dmSans.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.dataset.theme=localStorage.getItem("goatplan:theme:v1")==="dark"?"dark":"light"}catch{document.documentElement.dataset.theme="light"}` }} />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
