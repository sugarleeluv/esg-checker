import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import { LocaleShell } from "@/components/providers/LocaleShell";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ESG Checker | GRI 14 Mining Disclosure",
  description:
    "Assess IDX-listed mining companies on GRI 14 sustainability disclosure with scores, checklist, and investor insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${dmSans.variable} ${jetbrains.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-[#475569] font-sans antialiased">
        <Suspense fallback={null}>
          <LocaleShell>{children}</LocaleShell>
        </Suspense>
      </body>
    </html>
  );
}
